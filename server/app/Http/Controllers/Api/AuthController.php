<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use App\Models\PendingRegistration;
use App\Models\PwdProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login user and create token
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'id_number' => 'required|string',
            'password' => 'required|string',
        ]);

        $login = trim($request->id_number);
        $password = $request->password;

        // Try to find the user by id_number or username
        $user = User::where('id_number', $login)
            ->orWhere('username', $login)
            ->first();

        // Check if user exists and password is correct
        if (!$user || !Hash::check($password, $user->password)) {
            // Check if user exists by email if it were supported, but it's not in the model
            throw ValidationException::withMessages([
                'id_number' => ['Invalid credentials.'],
            ]);
        }

        if ($user->status !== 'ACTIVE') {
            throw ValidationException::withMessages([
                'id_number' => ['Your account is inactive. Please contact an administrator.'],
            ]);
        }

        // Create token
        $token = $user->createToken('auth-token')->plainTextToken;

        // Calculate portal status
        $application = $this->resolveUserApplication($user);
        $summary = $this->getApplicationSummary($user, $application);
        $applicationStatus = $summary['application_status'];
        $pwdNumber = $summary['pwd_number'];

        // Log login activity
        ActivityLog::create([
            'user_id' => $user->id,
            'action_type' => 'login',
            'model_type' => User::class,
            'model_id' => $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'description' => "User logged in: {$user->full_name}",
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'id_number' => $user->id_number,
                    'username' => $user->username,
                    'name' => $user->full_name,
                    'role' => $user->role,
                    'initials' => $user->initials,
                    'email' => '', 
                    'application_status' => $applicationStatus,
                    'pwd_number' => $pwdNumber,
                ],
                'token' => $token,
            ],
        ]);
    }

    /**
     * Register a new user
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_number' => 'nullable|string|unique:users,id_number',
            'username' => 'nullable|string|unique:users,username',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'password' => 'required|string|min:6',
        ]);

        // Ensure at least one of id_number or username is provided
        if (empty($validated['id_number']) && empty($validated['username'])) {
            throw ValidationException::withMessages([
                'id_number' => ['Either ID Number or Username is required.'],
            ]);
        }

        $user = User::create([
            'id_number' => $validated['id_number'] ?? null,
            'username' => $validated['username'] ?? null,
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'password' => $validated['password'], // Hashing handled by model cast
            'role' => 'USER',
            'status' => 'ACTIVE',
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        ActivityLog::log('register', User::class, $user->id, null, null, "New user registered: {$user->full_name}");

        return response()->json([
            'success' => true,
            'message' => 'Registration successful',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'id_number' => $user->id_number,
                    'username' => $user->username,
                    'name' => $user->full_name,
                    'role' => $user->role,
                    'initials' => $user->initials,
                    'email' => '',
                ],
                'token' => $token,
            ],
        ], 201);
    }

    /**
     * Logout user (revoke token)
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Log logout activity
        ActivityLog::log('logout', User::class, $user->id, null, null, "User logged out: {$user->full_name}");

        // Revoke current token
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Get current authenticated user
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        // Calculate portal status
        $application = $this->resolveUserApplication($user);
        $summary = $this->getApplicationSummary($user, $application);
        $applicationStatus = $summary['application_status'];
        $pwdNumber = $summary['pwd_number'];

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'id_number' => $user->id_number,
                'username' => $user->username,
                'name' => $user->full_name,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'role' => $user->role,
                'unit' => $user->unit,
                'initials' => $user->initials,
                'email' => '',
                'application_status' => $applicationStatus,
                'pwd_number' => $pwdNumber,
            ],
        ]);
    }

    /**
     * Get current user's application details and history
     */
    public function getApplication(Request $request): JsonResponse
    {
        $user = $request->user();

        // Portal users only
        if ($user->role !== 'USER' && $user->role !== 'PWD MEMBER') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $application = $this->resolveUserApplication($user);

        if (!$application || !$application->pwdProfile) {
            return response()->json([
                'success' => false,
                'message' => 'Application not found',
            ], 404);
        }

        $profile = $application->pwdProfile->load([
            'personalInfo', 'address.barangay', 'contacts', 
            'disabilities.disabilityType', 'employment', 
            'education', 'familyMembers', 'governmentIds', 
            'householdInfo'
        ]);
        
        // Build flat form data for the frontend
        $formData = [
            'lastName' => $profile->last_name ?? '',
            'firstName' => $profile->first_name ?? '',
            'middleName' => $profile->middle_name ?? '',
            'suffix' => $profile->suffix ?? '',
            'dob' => $profile->personalInfo?->birth_date ? $profile->personalInfo->birth_date->format('Y-m-d') : '',
            'sex' => $profile->personalInfo?->sex ?? '',
            'civilStatus' => $profile->personalInfo?->civil_status ?? '',
            'bloodType' => $profile->personalInfo?->blood_type ?? '',
            'religion' => $profile->personalInfo?->religion ?? '',
            'ethnicGroup' => $profile->personalInfo?->ethnic_group ?? '',
            'houseNoStreet' => $profile->address?->house_street ?? '',
            'barangay' => $profile->address?->barangay?->name ?? '',
            'city' => $profile->address?->city ?? 'Pagsanjan',
            'province' => $profile->address?->province ?? 'Laguna',
            'region' => $profile->address?->region ?? '4A',
            'mobileNo' => $profile->contacts?->mobile ?? '',
            'email' => $profile->contacts?->email ?? '',
            'landlineNo' => $profile->contacts?->landline ?? '',
            'disabilityType' => $profile->disabilities->first()?->disabilityType?->name ?? '',
            'disabilityTypeSpecify' => $profile->disabilities->first()?->cause_details ?? '',
            'causeOfDisability' => $profile->disabilities->first() ? ($profile->disabilities->first()->cause === 'Congenital' ? 'Congenital / Inborn' : 'Acquired') : '',
            'educationalAttainment' => $profile->education?->attainment ?? '',
            'employmentStatus' => $profile->employment?->status ?? '',
            'occupation' => $profile->employment?->occupation ?? '',
            'typeOfEmployment' => $profile->employment?->type ?? '',
            'sourceOfIncome' => $profile->householdInfo?->income_source ?? '',
            'livingArrangement' => $profile->householdInfo?->living_arrangement ?? '',
            'sssNo' => $profile->governmentIds?->where('id_type', 'SSS')->first()?->id_number ?? '',
            'gsisNo' => $profile->governmentIds?->where('id_type', 'GSIS')->first()?->id_number ?? '',
            'pagibigNo' => $profile->governmentIds?->where('id_type', 'Pag-IBIG')->first()?->id_number ?? '',
            'philhealthNo' => $profile->governmentIds?->where('id_type', 'PhilHealth')->first()?->id_number ?? '',
            'guardianContactNo' => $profile->contacts?->guardian_contact ?? '',
        ];

        // Map family members
        foreach ($profile->familyMembers as $member) {
            $prefix = strtolower($member->relation_type);
            switch ($member->relation_type) {
                case 'Father':
                    $formData['fatherLName'] = $member->last_name ?? '';
                    $formData['fatherFName'] = $member->first_name ?? '';
                    $formData['fatherMName'] = $member->middle_name ?? '';
                    break;
                case 'Mother':
                    $formData['motherLName'] = $member->last_name ?? '';
                    $formData['motherFName'] = $member->first_name ?? '';
                    $formData['motherMName'] = $member->middle_name ?? '';
                    break;
                case 'Guardian':
                    $formData['guardianLName'] = $member->last_name ?? '';
                    $formData['guardianFName'] = $member->first_name ?? '';
                    $formData['guardianMName'] = $member->middle_name ?? '';
                    break;
                case 'Spouse':
                    $formData['spouseName'] = trim(($member->last_name ? $member->last_name . ', ' : '') . $member->first_name . ' ' . ($member->middle_name ?? ''));
                    $formData['spouseAge'] = (string)$member->age ?? '';
                    break;
            }
        }

        // Build history based on status and timestamps
        $history = [
            [
                'status' => 'SUBMITTED',
                'label' => 'Application Submitted',
                'description' => 'Your application was submitted to the PDAO office for review.',
                'date' => $application->created_at->format('M d, Y h:i A')
            ]
        ];

        if ($application->status === 'UNDER_REVIEW') {
            $history[] = [
                'status' => 'UNDER_REVIEW',
                'label' => 'Under Review',
                'description' => 'Your application is currently being evaluated by a PDAO officer.',
                'date' => $application->updated_at->format('M d, Y h:i A')
            ];
        } elseif ($application->status === 'RETURNED') {
            $history[] = [
                'status' => 'RETURNED',
                'label' => 'Returned for Corrections',
                'description' => 'The administrator has returned your application for corrections. Please check the comments.',
                'date' => $application->reviewed_at ? $application->reviewed_at->format('M d, Y h:i A') : $application->updated_at->format('M d, Y h:i A')
            ];
        } elseif ($application->status === 'APPROVED' || $profile->status === 'ACTIVE' || $profile->status === 'ISSUED') {
            $history[] = [
                'status' => 'APPROVED',
                'label' => 'Application Approved',
                'description' => 'Congratulations! Your application has been verified and approved.',
                'date' => $application->reviewed_at ? $application->reviewed_at->format('M d, Y h:i A') : $application->updated_at->format('M d, Y h:i A')
            ];

            if ($profile->card_printed) {
                $history[] = [
                    'status' => 'PRINTED',
                    'label' => 'ID Card Printed',
                    'description' => 'Your physical ID card has been printed and is ready for pickup/scheduling.',
                    'date' => $profile->updated_at->format('M d, Y h:i A') // Assuming printed timestamp is updated_at
                ];
            }

            if ($profile->status === 'ISSUED') {
                $history[] = [
                    'status' => 'ISSUED',
                    'label' => 'ID Card Issued',
                    'description' => 'You have successfully claimed your physical PWD ID card.',
                    'date' => $profile->updated_at->format('M d, Y h:i A')
                ];
            }
        } elseif ($application->status === 'REJECTED') {
             $history[] = [
                'status' => 'REJECTED',
                'label' => 'Application Rejected',
                'description' => 'Unfortunately, your application was not approved. See review notes for details.',
                'date' => $application->reviewed_at ? $application->reviewed_at->format('M d, Y h:i A') : $application->updated_at->format('M d, Y h:i A')
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'formData' => $formData,
                'history' => $history,
                'status' => $application->status,
                'pwd_number' => $profile->pwd_number,
                'remarks' => $application->review_notes,
                'date_approved' => $profile->date_approved?->format('Y-m-d'),
                'expiry_date' => $profile->expiry_date?->format('Y-m-d'),
            ],
        ]);
    }

    /**
     * Resubmit a returned application with updated data.
     * Accepts the same flat form fields as the portal form and updates the underlying PWD profile.
     */
    public function resubmitApplication(Request $request): JsonResponse
    {
        $user = $request->user();
        $application = $this->resolveUserApplication($user);

        if (!$application) {
            return response()->json([
                'success' => false,
                'message' => 'No application found.',
            ], 404);
        }

        // Only allow resubmit if status is UNDER_REVIEW (returned for changes) or RETURNED
        if (!in_array($application->status, ['UNDER_REVIEW', 'RETURNED'])) {
            return response()->json([
                'success' => false,
                'message' => 'Application cannot be resubmitted in its current status.',
            ], 422);
        }

        $profile = $application->pwdProfile;
        if (!$profile) {
            return response()->json([
                'success' => false,
                'message' => 'No profile found for this application.',
            ], 404);
        }

        // Update profile personal info
        $profileData = [];
        if ($request->has('first_name')) $profileData['first_name'] = $request->first_name;
        if ($request->has('last_name')) $profileData['last_name'] = $request->last_name;
        if ($request->has('middle_name')) $profileData['middle_name'] = $request->middle_name;
        if ($request->has('suffix')) $profileData['suffix'] = $request->suffix;

        // Personal info
        if ($request->has('personal_info')) {
            $pi = $request->personal_info;
            if (isset($pi['birth_date'])) $profileData['birth_date'] = $pi['birth_date'];
            if (isset($pi['sex'])) $profileData['sex'] = $pi['sex'];
            if (isset($pi['civil_status'])) $profileData['civil_status'] = $pi['civil_status'];
            if (isset($pi['blood_type'])) $profileData['blood_type'] = $pi['blood_type'];
            if (isset($pi['religion'])) $profileData['religion'] = $pi['religion'];
            if (isset($pi['ethnic_group'])) $profileData['ethnic_group'] = $pi['ethnic_group'];
        }

        if (!empty($profileData)) {
            $profile->update($profileData);
        }

        // Update address
        if ($request->has('address')) {
            $addr = $request->address;
            $addressModel = $profile->address()->first();
            if ($addressModel) {
                $addressModel->update([
                    'house_street' => $addr['house_street'] ?? $addressModel->house_street,
                    'barangay_id' => $addr['barangay_id'] ?? $addressModel->barangay_id,
                    'city' => $addr['city'] ?? $addressModel->city,
                    'province' => $addr['province'] ?? $addressModel->province,
                    'region' => $addr['region'] ?? $addressModel->region,
                ]);
            }
        }

        // Update contacts
        if ($request->has('contacts')) {
            $c = $request->contacts;
            $contact = \App\Models\PwdContact::firstOrNew(['pwd_profile_id' => $profile->id]);
            $contact->fill([
                'mobile' => $c['mobile'] ?? $contact->mobile,
                'email' => $c['email'] ?? $contact->email,
                'landline' => $c['landline'] ?? $contact->landline,
                'guardian_contact' => $c['guardian_contact'] ?? $contact->guardian_contact,
            ]);
            $contact->save();
        }

        // Update disabilities
        if ($request->has('disabilities') && is_array($request->disabilities)) {
            $profile->disabilities()->delete();
            foreach ($request->disabilities as $d) {
                $profile->disabilities()->create([
                    'disability_type_id' => $d['disability_type_id'],
                    'cause' => $d['cause'] ?? null,
                    'cause_details' => $d['cause_details'] ?? null,
                ]);
            }
        }

        // Update employment
        if ($request->has('employment')) {
            $emp = $request->employment;
            $employment = $profile->employment()->first();
            if ($employment) {
                $employment->update([
                    'status' => $emp['status'] ?? $employment->status,
                    'type' => $emp['type'] ?? $employment->type,
                    'occupation' => $emp['occupation'] ?? $employment->occupation,
                ]);
            } else {
                $profile->employment()->create($emp);
            }
        }

        // Update education
        if ($request->has('education')) {
            $edu = $request->education;
            $education = $profile->education()->first();
            if ($education) {
                $education->update(['attainment' => $edu['attainment'] ?? $education->attainment]);
            } else {
                $profile->education()->create($edu);
            }
        }

        // Update family members
        if ($request->has('family') && is_array($request->family)) {
            $profile->familyMembers()->delete();
            foreach ($request->family as $f) {
                $profile->familyMembers()->create($f);
            }
        }

        // Update government IDs
        if ($request->has('government_ids') && is_array($request->government_ids)) {
            $profile->governmentIds()->delete();
            foreach ($request->government_ids as $gid) {
                $profile->governmentIds()->create($gid);
            }
        }

        // Update household info 
        if ($request->has('household_info')) {
            $hh = $request->household_info;
            $household = $profile->householdInfo()->first();
            if ($household) {
                $household->update([
                    'income_source' => $hh['income_source'] ?? $household->income_source,
                    'living_arrangement' => $hh['living_arrangement'] ?? $household->living_arrangement,
                ]);
            } else {
                $profile->householdInfo()->create($hh);
            }
        }

        // Reset application status back to PENDING for re-review
        $application->update([
            'status' => 'PENDING',
            'reviewed_by' => null,
            'reviewed_at' => null,
            'review_notes' => null,
        ]);

        // Notify admins that the application was resubmitted
        $this->notifyAdminsOfResubmission($user, $application);

        return response()->json([
            'success' => true,
            'message' => 'Application resubmitted successfully. It is now back in the review queue.',
        ]);
    }

    /**
     * Notify admin users about a resubmitted application.
     */
    private function notifyAdminsOfResubmission(User $user, PendingRegistration $application): void
    {
        $admins = User::whereIn('role', ['ADMIN', 'STAFF'])->get();
        foreach ($admins as $admin) {
            \App\Models\Notification::notify(
                $admin->id,
                'resubmission',
                'Application Resubmitted',
                "{$user->name} has resubmitted their PWD registration application after making requested changes.",
                $user->name ?? 'User',
                'pending_registration',
                $application->id
            );
        }
    }

    /**
     * Change password
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password is incorrect.'],
            ]);
        }

        $user->update([
            'password' => $request->new_password, // Hashing handled by model cast
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully',
        ]);
    }

    /**
     * Update contact information
     */
    public function updateContact(Request $request): JsonResponse
    {
        $request->validate([
            'mobile' => 'nullable|string|max:20',
            'email' => 'nullable|string|email|max:255',
            'landline' => 'nullable|string|max:20',
            'guardian_contact' => 'nullable|string|max:20',
        ]);

        $user = $request->user();
        $application = $this->resolveUserApplication($user);

        if (!$application || !$application->pwd_profile_id) {
            return response()->json([
                'success' => false,
                'message' => 'No application found. Please submit an application first.',
            ], 404);
        }

        $contact = \App\Models\PwdContact::firstOrNew([
            'pwd_profile_id' => $application->pwd_profile_id,
        ]);

        $contact->fill([
            'mobile' => $request->mobile,
            'email' => $request->email,
            'landline' => $request->landline,
            'guardian_contact' => $request->guardian_contact,
        ]);
        $contact->save();

        return response()->json([
            'success' => true,
            'message' => 'Contact information updated successfully.',
            'data' => [
                'mobile' => $contact->mobile,
                'email' => $contact->email,
                'landline' => $contact->landline,
                'guardian_contact' => $contact->guardian_contact,
            ],
        ]);
    }

    /**
     * Resolves the application for a user, handling linking by name if necessary.
     */
    private function resolveUserApplication(User $user)
    {
        $application = PendingRegistration::where('user_id', $user->id)
            ->with(['pwdProfile'])
            ->latest()
            ->first();

        // If no application found by user_id, fall back to matching by name for existing records
        if (!$application) {
            $application = PendingRegistration::whereHas('pwdProfile', function($q) use ($user) {
                $q->where('first_name', $user->first_name)
                  ->where('last_name', $user->last_name);
            })
            ->with(['pwdProfile'])
            ->latest()
            ->first();
            
            // If found by name, link it to this user account
            if ($application) {
                $application->update(['user_id' => $user->id]);
            }
        }

        return $application;
    }

    /**
     * Extracts status and PWD number from application object.
     */
    private function getApplicationSummary($user, $application = null) {
        $applicationStatus = null;
        $pwdNumber = null;

        if ($application) {
            $applicationStatus = $application->status;
            if ($application->pwdProfile) {
                $pwdNumber = $application->pwdProfile->pwd_number;

                // Extra logic for special statuses if profile is already approved/printed
                if ($applicationStatus === 'APPROVED') {
                    if ($application->pwdProfile->status === 'ISSUED') {
                        $applicationStatus = 'ISSUED';
                    } elseif ($application->pwdProfile->card_printed) {
                        $applicationStatus = 'PRINTED';
                    }
                }
            }
        } elseif ($user && ($user->role === 'USER' || $user->role === 'PWD MEMBER')) {
            // Check if they are already in the PWD profiles masterlist even without registration record
            $profile = PwdProfile::where('first_name', $user->first_name)
                ->where('last_name', $user->last_name)
                ->first();
            
            if ($profile) {
                $pwdNumber = $profile->pwd_number;
                $applicationStatus = 'ISSUED';
                if ($profile->status === 'ACTIVE' && !$profile->card_printed) {
                    $applicationStatus = 'APPROVED';
                } elseif ($profile->card_printed && $profile->status !== 'ISSUED') {
                    $applicationStatus = 'PRINTED';
                }
            }
        }

        return [
            'application_status' => $applicationStatus,
            'pwd_number' => $pwdNumber
        ];
    }
}
