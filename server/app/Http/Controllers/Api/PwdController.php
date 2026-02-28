<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barangay;
use App\Models\DisabilityType;
use App\Models\Notification;
use App\Models\PendingRegistration;
use App\Models\PwdAddress;
use App\Models\PwdContact;
use App\Models\PwdDisability;
use App\Models\PwdHouseholdInfo;
use App\Models\PwdEducation;
use App\Models\PwdEmployment;
use App\Models\PwdFamily;
use App\Models\PwdGovernmentId;
use App\Models\PwdOrganization;
use App\Models\PwdPersonalInfo;
use App\Models\PwdProfile;
use App\Models\PwdProfileVersion;
use App\Observers\VersionObserver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PwdController extends Controller
{
    /**
     * Get all PWD profiles with filters
     */
    public function index(Request $request): JsonResponse
    {
        $query = PwdProfile::with([
            'personalInfo',
            'address.barangay',
            'contacts',
            'disabilities.disabilityType',
            'employment',
            'education',
            'pendingRegistration',
        ]);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        } else {
            // Default behavior: Exclude PENDING registrations and UNDER_REVIEW from the masterlist
            // These should only be visible in the Approval Queue
            $query->whereNotIn('status', ['PENDING', 'UNDER_REVIEW']);
        }

        // Filter by barangay (by name)
        if ($request->has('barangay') && $request->barangay !== 'All Barangays') {
            $query->whereHas('address.barangay', function ($q) use ($request) {
                $q->where('name', $request->barangay);
            });
        }

        // Filter by barangay ID
        if ($request->has('barangay_id')) {
            $query->whereHas('address', function ($q) use ($request) {
                $q->where('barangay_id', $request->barangay_id);
            });
        }

        // Filter by disability type
        if ($request->has('disability_type_id')) {
            $query->whereHas('disabilities', function ($q) use ($request) {
                $q->where('disability_type_id', $request->disability_type_id);
            });
        }

        // Filter by year
        if ($request->has('year')) {
            $query->whereYear('date_applied', $request->year);
        }

        // Filter by PWD number presence
        if ($request->has('has_pwd_number')) {
            if ($request->boolean('has_pwd_number')) {
                $query->whereNotNull('pwd_number')->where('pwd_number', '!=', '');
            } else {
                $query->where(function ($q) {
                    $q->whereNull('pwd_number')->orWhere('pwd_number', '');
                });
            }
        }

        // Filter for children (under 18 based on birth date)
        if ($request->boolean('is_child')) {
            $query->whereHas('personalInfo', function ($q) {
                $eighteenYearsAgo = now()->subYears(18)->format('Y-m-d');
                $q->where('birth_date', '>', $eighteenYearsAgo);
            });
        }

        // Filter for online applicants (have a pending_registration with a user_id)
        if ($request->boolean('applied_online')) {
            $query->whereHas('pendingRegistration', function ($q) {
                $q->whereNotNull('user_id');
            });
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('pwd_number', 'like', "%{$search}%");
            });
        }

        // Include trashed if requested
        if ($request->boolean('with_trashed')) {
            $query->withTrashed();
        }

        $profiles = $query->orderBy('created_at', 'desc')
                         ->paginate($request->per_page ?? 15);

        // Transform data for frontend
        $data = $profiles->map(function ($profile) {
            return $this->transformProfile($profile);
        });

        // Get counts for tabs
        $eighteenYearsAgo = now()->subYears(18)->format('Y-m-d');
        
        // Base query for counts should match the search and barangay filters
        // but not be restricted by the current tab's status filter
        $countQuery = PwdProfile::query();
        
        // Always exclude PENDING/UNDER_REVIEW from masterlist counts 
        // unless they are explicitly requested
        if ($request->has('status') && in_array($request->status, ['PENDING', 'UNDER_REVIEW'])) {
            $countQuery->where('status', $request->status);
        } else {
            $countQuery->whereNotIn('status', ['PENDING', 'UNDER_REVIEW']);
        }

        if ($request->has('barangay') && $request->barangay !== 'All Barangays') {
            $countQuery->whereHas('address.barangay', function ($q) use ($request) {
                $q->where('name', $request->barangay);
            });
        }
        if ($request->has('search')) {
            $search = $request->search;
            $countQuery->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('pwd_number', 'like', "%{$search}%");
            });
        }

        $counts = [
            'all' => (clone $countQuery)->count(),
            'with_id' => (clone $countQuery)->whereNotNull('pwd_number')->where('pwd_number', '!=', '')->count(),
            'without_id' => (clone $countQuery)->where(function ($q) {
                $q->whereNull('pwd_number')->orWhere('pwd_number', '');
            })->count(),
            'children' => (clone $countQuery)->whereHas('personalInfo', function ($q) use ($eighteenYearsAgo) {
                $q->where('birth_date', '>', $eighteenYearsAgo);
            })->count(),
            'deceased' => (clone $countQuery)->where('status', 'DECEASED')->count(),
            'applied_online' => (clone $countQuery)->whereHas('pendingRegistration', function ($q) {
                $q->whereNotNull('user_id');
            })->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $data,
            'meta' => [
                'current_page' => $profiles->currentPage(),
                'last_page' => $profiles->lastPage(),
                'per_page' => $profiles->perPage(),
                'total' => $profiles->total(),
            ],
            'counts' => $counts,
        ]);
    }

    /**
     * Get a single PWD profile
     */
    public function show(PwdProfile $pwd): JsonResponse
    {
        $pwd->loadFullProfile();

        return response()->json([
            'success' => true,
            'data' => $this->transformProfileFull($pwd),
        ]);
    }

    /**
     * Search for PWD by PWD Number
     */
    public function searchByPwdNumber(Request $request): JsonResponse
    {
        $pwdNumber = $request->get('pwd_number');
        
        if (!$pwdNumber) {
            return response()->json([
                'success' => false,
                'message' => 'PWD Number is required',
            ], 400);
        }

        $pwd = PwdProfile::where('pwd_number', $pwdNumber)->first();
        
        if (!$pwd) {
            return response()->json([
                'success' => false,
                'message' => 'PWD record not found',
            ], 404);
        }

        $pwd->loadFullProfile();

        return response()->json([
            'success' => true,
            'data' => $this->transformProfileFull($pwd),
        ]);
    }

    /**
     * Create a new PWD profile
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatePwdData($request);

        $profile = DB::transaction(function () use ($validated, $request) {
            $authUser = $request->user();
            $isStaff = $authUser && in_array($authUser->role, ['ADMIN', 'STAFF', 'ENCODER']);
            $isAdmin = $authUser && $authUser->role === 'ADMIN';

            // Non-admin users (STAFF, ENCODER, USER, etc.) always create records that need approval
            // Only true ADMIN role can bypass the approval queue
            $isPending = !$isAdmin || $request->boolean('create_pending');

            // The user_id for the registration should be the logged-in user 
            // ONLY if they are not staff (i.e. they are an applicant submitting for themselves)
            $applicantId = !$isStaff ? $authUser?->id : null;

            // Create main profile
            $profile = PwdProfile::create([
                'pwd_number' => $validated['pwd_number'] ?? null,
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'middle_name' => $validated['middle_name'] ?? null,
                'suffix' => $validated['suffix'] ?? null,
                'date_applied' => $validated['date_applied'] ?? now(),
                'status' => $isPending ? 'PENDING' : 'ACTIVE',
                'current_version' => 1,
                'remarks' => $validated['remarks'] ?? null,
                'accessibility_needs' => $validated['accessibility_needs'] ?? null,
                'service_needs' => $validated['service_needs'] ?? null,
            ]);

            // Create personal info
            if (isset($validated['personal_info'])) {
                PwdPersonalInfo::create([
                    'pwd_profile_id' => $profile->id,
                    ...$validated['personal_info'],
                ]);
            }

            // Create address
            if (isset($validated['address'])) {
                PwdAddress::create([
                    'pwd_profile_id' => $profile->id,
                    ...$validated['address'],
                ]);
            }

            // Create contacts
            if (isset($validated['contacts'])) {
                PwdContact::create([
                    'pwd_profile_id' => $profile->id,
                    ...$validated['contacts'],
                ]);
            }

            // Create disabilities
            if (isset($validated['disabilities'])) {
                foreach ($validated['disabilities'] as $index => $disability) {
                    PwdDisability::create([
                        'pwd_profile_id' => $profile->id,
                        'is_primary' => $index === 0,
                        ...$disability,
                    ]);
                }
            }

            // Create employment
            if (isset($validated['employment'])) {
                PwdEmployment::create([
                    'pwd_profile_id' => $profile->id,
                    ...$validated['employment'],
                ]);
            }

            // Create education
            if (isset($validated['education'])) {
                PwdEducation::create([
                    'pwd_profile_id' => $profile->id,
                    ...$validated['education'],
                ]);
            }

            // Create family members
            if (isset($validated['family'])) {
                foreach ($validated['family'] as $member) {
                    PwdFamily::create([
                        'pwd_profile_id' => $profile->id,
                        ...$member,
                    ]);
                }
            }

            // Create government IDs
            if (isset($validated['government_ids'])) {
                foreach ($validated['government_ids'] as $govId) {
                    if (!empty($govId['id_number'])) {
                        PwdGovernmentId::create([
                            'pwd_profile_id' => $profile->id,
                            ...$govId,
                        ]);
                    }
                }
            }

            // Create household info
            if (isset($validated['household_info'])) {
                PwdHouseholdInfo::create([
                    'pwd_profile_id' => $profile->id,
                    ...$validated['household_info'],
                ]);
            }

            // Create organization
            if (isset($validated['organization'])) {
                PwdOrganization::create([
                    'pwd_profile_id' => $profile->id,
                    ...$validated['organization'],
                ]);
            }

            // Create pending registration if the status is PENDING or UNDER_REVIEW
            if ($isPending || $profile->status === 'PENDING' || $profile->status === 'UNDER_REVIEW') {
                PendingRegistration::create([
                    'pwd_profile_id' => $profile->id,
                    'user_id' => $applicantId,
                    'submission_type' => $validated['submission_type'] ?? 'NEW',
                    'status' => $profile->status,
                ]);
            }

            return $profile;
        });

        return response()->json([
            'success' => true,
            'message' => 'PWD profile created successfully',
            'data' => $this->transformProfile($profile->loadFullProfile()),
        ], 201);
    }

    /**
     * Update a PWD profile
     */
    public function update(Request $request, PwdProfile $pwd): JsonResponse
    {
        $validated = $this->validatePwdData($request, $pwd->id);

        DB::transaction(function () use ($validated, $pwd) {
            // Track if major changes for versioning
            $createVersion = false;
            $changeSummary = [];

            // Update main profile
            $pwd->update([
                'pwd_number' => $validated['pwd_number'] ?? $pwd->pwd_number,
                'first_name' => $validated['first_name'] ?? $pwd->first_name,
                'last_name' => $validated['last_name'] ?? $pwd->last_name,
                'middle_name' => $validated['middle_name'] ?? $pwd->middle_name,
                'suffix' => $validated['suffix'] ?? $pwd->suffix,
                'remarks' => $validated['remarks'] ?? $pwd->remarks,
                'accessibility_needs' => $validated['accessibility_needs'] ?? $pwd->accessibility_needs,
                'service_needs' => $validated['service_needs'] ?? $pwd->service_needs,
            ]);

            // Update personal info
            if (isset($validated['personal_info'])) {
                $pwd->personalInfo()->updateOrCreate(
                    ['pwd_profile_id' => $pwd->id],
                    $validated['personal_info']
                );
            }

            // Update address
            if (isset($validated['address'])) {
                $oldAddress = $pwd->address?->toArray();
                $pwd->address()->updateOrCreate(
                    ['pwd_profile_id' => $pwd->id],
                    $validated['address']
                );
                if ($oldAddress && $oldAddress !== $validated['address']) {
                    $createVersion = true;
                    $changeSummary[] = 'address';
                }
            }

            // Update contacts
            if (isset($validated['contacts'])) {
                $pwd->contacts()->updateOrCreate(
                    ['pwd_profile_id' => $pwd->id],
                    $validated['contacts']
                );
            }

            // Update disabilities
            if (isset($validated['disabilities'])) {
                $oldDisabilities = $pwd->disabilities()->get()->toArray();
                $pwd->disabilities()->delete();
                foreach ($validated['disabilities'] as $index => $disability) {
                    PwdDisability::create([
                        'pwd_profile_id' => $pwd->id,
                        'is_primary' => $index === 0,
                        ...$disability,
                    ]);
                }
                $createVersion = true;
                $changeSummary[] = 'disabilities';
            }

            // Update employment
            if (isset($validated['employment'])) {
                $pwd->employment()->updateOrCreate(
                    ['pwd_profile_id' => $pwd->id],
                    $validated['employment']
                );
            }

            // Update education
            if (isset($validated['education'])) {
                $pwd->education()->updateOrCreate(
                    ['pwd_profile_id' => $pwd->id],
                    $validated['education']
                );
            }

            // Update household info
            if (isset($validated['household_info'])) {
                $pwd->householdInfo()->updateOrCreate(
                    ['pwd_profile_id' => $pwd->id],
                    $validated['household_info']
                );
            }

            // Create version if major changes
            if ($createVersion) {
                $this->createVersionSnapshot($pwd, implode(', ', $changeSummary));
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'PWD profile updated successfully',
            'data' => $this->transformProfile($pwd->fresh()->loadFullProfile()),
        ]);
    }

    /**
     * Delete a PWD profile (soft delete)
     */
    public function destroy(Request $request, PwdProfile $pwd): JsonResponse
    {
        $user = $pwd->findUser();
        $pwdName = $pwd->full_name;

        if ($request->boolean('force')) {
            $pwd->forceDelete();
            $message = 'PWD profile permanently deleted';
        } else {
            $pwd->delete();
            $message = 'PWD profile deleted successfully';
        }

        // Notify the user if found
        if ($user) {
            Notification::notify(
                $user->id,
                'rejection',
                'Account Record Deleted',
                "Your PWD record ({$pwdName}) has been deleted from the system by the administrator.",
                $request->user()->full_name,
                'pwd_profile',
                null
            );
        }

        return response()->json([
            'success' => true,
            'message' => $message,
        ]);
    }

    /**
     * Update PWD status
     */
    public function updateStatus(Request $request, PwdProfile $pwd): JsonResponse
    {
        $request->validate([
            'status' => ['required', Rule::in(['ACTIVE', 'INACTIVE', 'DECEASED', 'PENDING', 'UNDER_REVIEW'])],
        ]);

        $oldStatus = $pwd->status;
        $newStatus = $request->status;

        if ($oldStatus === $newStatus) {
            return response()->json([
                'success' => true,
                'message' => 'Status is already ' . $newStatus,
                'data' => $this->transformProfile($pwd->loadFullProfile()),
            ]);
        }

        $pwd->update(['status' => $newStatus]);

        // Create version for status change
        $this->createVersionSnapshot($pwd, "Status changed from {$oldStatus} to {$newStatus}");

        // Notify user of status change
        $user = $pwd->findUser();
        if ($user) {
            $title = 'Profile Status Updated';
            $message = "Your profile status has been updated from {$oldStatus} to {$newStatus} by the administrator.";
            
            // Customize message based on status
            if ($newStatus === 'ACTIVE') {
                $title = 'Account Activated';
                $message = "Your PWD profile status is now ACTIVE. You can now access all services.";
            } elseif ($newStatus === 'INACTIVE') {
                $title = 'Account Deactivated';
                $message = "Your PWD profile has been set to INACTIVE. Please contact the office for more information.";
            }

            Notification::notify(
                $user->id,
                $newStatus === 'ACTIVE' ? 'approval' : 'warning',
                $title,
                $message,
                $request->user()->full_name,
                'pwd_profile',
                $pwd->id
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Status updated successfully',
            'data' => $this->transformProfile($pwd->fresh()->loadFullProfile()),
        ]);
    }

    /**
     * Mark a PWD ID card as printed — transitions the application to PRINTED status.
     * This unlocks the Appointment & Pickup module for the user.
     */
    public function markAsPrinted(Request $request, PwdProfile $pwd): JsonResponse
    {
        // Update the card_printed flag / status
        $pwd->update([
            'card_printed' => true,
            'card_printed_at' => now(),
        ]);

        // Create version for this milestone
        $this->createVersionSnapshot($pwd, "PWD ID card marked as printed by admin");

        // Notify the user
        $user = $pwd->findUser();
        if ($user) {
            Notification::notify(
                $user->id,
                'approval',
                'Your PWD ID Card is Ready!',
                'Great news! Your physical PWD ID card has been printed and is ready for pickup. Please visit the Appointment & Pickup section to schedule your collection.',
                $request->user()->full_name ?? 'Admin',
                'pwd_profile',
                $pwd->id
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Card marked as printed successfully. User has been notified.',
            'data' => $this->transformProfile($pwd->fresh()->loadFullProfile()),
        ]);
    }

    /**
     * Get PWD versions (history)
     */
    public function versions(PwdProfile $pwd): JsonResponse
    {
        $versions = $pwd->versions()
            ->with('changedByUser')
            ->orderBy('version_number', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $versions->map(function ($version) {
                return [
                    'id' => $version->id,
                    'version_number' => $version->version_number,
                    'change_summary' => $version->change_summary,
                    'changed_by' => $version->changedByUser?->full_name ?? 'System',
                    'changed_at' => $version->changed_at,
                ];
            }),
        ]);
    }

    /**
     * Restore PWD to a specific version (ADMIN only)
     */
    public function restoreVersion(Request $request, PwdProfile $pwd, $versionNumber): JsonResponse
    {
        $version = PwdProfileVersion::where('pwd_profile_id', $pwd->id)
            ->where('version_number', $versionNumber)
            ->firstOrFail();

        $snapshot = $version->snapshot;

        DB::transaction(function () use ($pwd, $snapshot, $versionNumber) {
            // Update main profile from snapshot
            $pwd->update([
                'pwd_number' => $snapshot['pwd_number'] ?? $pwd->pwd_number,
                'first_name' => $snapshot['first_name'],
                'last_name' => $snapshot['last_name'],
                'middle_name' => $snapshot['middle_name'] ?? null,
                'suffix' => $snapshot['suffix'] ?? null,
                'status' => $snapshot['status'],
            ]);

            // Restore related data from snapshot
            // (simplified - in production you'd restore all related tables)
            
            // Create new version for the restore action
            $this->createVersionSnapshot($pwd, "Restored to version {$versionNumber}");
        });

        // Notify user of version restoration
        $user = $pwd->findUser();
        if ($user) {
            Notification::notify(
                $user->id,
                'update',
                'Profile Restored',
                "Your profile information has been restored to an earlier version (Version {$versionNumber}) by the administrator.",
                $request->user()->full_name,
                'pwd_profile',
                $pwd->id
            );
        }

        return response()->json([
            'success' => true,
            'message' => "Profile restored to version {$versionNumber}",
            'data' => $this->transformProfile($pwd->fresh()->loadFullProfile()),
        ]);
    }

    /**
     * Get lookup data for forms
     */
    public function lookups(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'barangays' => Barangay::where('is_active', true)
                    ->orderBy('name')
                    ->get(['id', 'name', 'code']),
                'disability_types' => DisabilityType::where('is_active', true)
                    ->where('name', '!=', 'Other')
                    ->orderBy('name')
                    ->get(['id', 'name', 'code']),
            ],
        ]);
    }

    /**
     * Generate PWD Number for a profile
     */
    public function generateNumber(PwdProfile $pwd): JsonResponse
    {
        if ($pwd->pwd_number) {
            return response()->json([
                'success' => false,
                'message' => 'PWD already has a number assigned',
            ], 400);
        }

        // Get barangay code
        $barangayCode = '00';
        if ($pwd->address && $pwd->address->barangay) {
            $barangayCode = str_pad($pwd->address->barangay->code ?? $pwd->address->barangay_id, 2, '0', STR_PAD_LEFT);
        }

        // Get disability type code
        $disabilityCode = '00';
        $primaryDisability = $pwd->disabilities()->where('is_primary', true)->first();
        if ($primaryDisability && $primaryDisability->disabilityType) {
            $disabilityCode = str_pad($primaryDisability->disabilityType->code ?? $primaryDisability->disability_type_id, 2, '0', STR_PAD_LEFT);
        }

        // Get year (last 2 digits)
        $year = date('y');

        // Get sequence number for this year
        $lastNumber = PwdProfile::whereNotNull('pwd_number')
            ->whereYear('created_at', date('Y'))
            ->orderBy('pwd_number', 'desc')
            ->first();

        $sequence = 1;
        if ($lastNumber && $lastNumber->pwd_number) {
            // Extract sequence from last PWD number (last 4 digits)
            $lastSequence = (int) substr($lastNumber->pwd_number, -4);
            $sequence = $lastSequence + 1;
        }

        // Format: BB-DD-YY-SSSS (Barangay-Disability-Year-Sequence)
        $pwdNumber = sprintf('%s-%s-%s-%04d', $barangayCode, $disabilityCode, $year, $sequence);

        $pwd->update(['pwd_number' => $pwdNumber]);

        // Create version for PWD number assignment
        $this->createVersionSnapshot($pwd, "PWD Number assigned: {$pwdNumber}");

        return response()->json([
            'success' => true,
            'message' => 'PWD number generated successfully',
            'data' => $this->transformProfile($pwd->fresh()->loadFullProfile()),
        ]);
    }

    // ==================== Helper Methods ====================

    protected function validatePwdData(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'pwd_number' => ['nullable', 'string', Rule::unique('pwd_profiles')->ignore($ignoreId)],
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'suffix' => 'nullable|string|max:50',
            'date_applied' => 'nullable|date',
            'remarks' => 'nullable|string',
            'accessibility_needs' => 'nullable|string',
            'service_needs' => 'nullable|string',
            'submission_type' => 'nullable|in:NEW,EXISTING,RENEWAL',

            // Personal info
            'personal_info.birth_date' => 'nullable|date',
            'personal_info.birth_place' => 'nullable|string|max:255',
            'personal_info.sex' => 'nullable|in:Male,Female',
            'personal_info.religion' => 'nullable|string|max:255',
            'personal_info.ethnic_group' => 'nullable|string|max:255',
            'personal_info.civil_status' => 'nullable|in:Single,Married,Widowed,Separated,Divorced,Cohabitation',
            'personal_info.blood_type' => 'nullable|in:A+,A-,B+,B-,O+,O-,AB+,AB-',

            // Address
            'address.house_street' => 'nullable|string|max:255',
            'address.barangay_id' => 'nullable|exists:barangays,id',
            'address.city' => 'nullable|string|max:255',
            'address.province' => 'nullable|string|max:255',
            'address.region' => 'nullable|string|max:255',

            // Contacts
            'contacts.mobile' => 'nullable|string|max:20',
            'contacts.landline' => 'nullable|string|max:20',
            'contacts.email' => 'nullable|email|max:255',
            'contacts.guardian_contact' => 'nullable|string|max:20',

            // Disabilities
            'disabilities' => 'nullable|array',
            'disabilities.*.disability_type_id' => 'required|exists:disability_types,id',
            'disabilities.*.cause' => 'nullable|in:Acquired,Congenital,Congenital / Inborn,Inborn',
            'disabilities.*.cause_details' => 'nullable|string',

            // Employment
            'employment.status' => 'nullable|in:Employed,Unemployed,Self-Employed,Self-employed',
            'employment.category' => 'nullable|string|max:255',
            'employment.type' => 'nullable|string|max:255',
            'employment.occupation' => 'nullable|string|max:255',

            // Education
            'education.attainment' => 'nullable|string|max:255',

            // Family
            'family' => 'nullable|array',
            'family.*.relation_type' => 'required|in:Father,Mother,Guardian,Spouse',
            'family.*.first_name' => 'nullable|string|max:255',
            'family.*.last_name' => 'nullable|string|max:255',
            'family.*.middle_name' => 'nullable|string|max:255',
            'family.*.age' => 'nullable|integer',

            // Government IDs
            'government_ids' => 'nullable|array',
            'government_ids.*.id_type' => 'required|in:SSS,GSIS,PhilHealth,Pag-IBIG',
            'government_ids.*.id_number' => 'nullable|string|max:50',

            // Household info
            'household_info.living_arrangement' => 'nullable|string|max:255',
            'household_info.receiving_support' => 'nullable|boolean',
            'household_info.is_pensioner' => 'nullable|boolean',
            'household_info.pension_type' => 'nullable|string|max:255',
            'household_info.monthly_pension' => 'nullable|numeric',
            'household_info.income_source' => 'nullable|string|max:255',
            'household_info.monthly_income' => 'nullable|numeric',

            // Organization
            'organization.organization_name' => 'nullable|string|max:255',
            'organization.contact_person' => 'nullable|string|max:255',
            'organization.address' => 'nullable|string',
            'organization.telephone' => 'nullable|string|max:50',
        ]);

        // Normalize data to match database standard values and be consistent across forms
        if (isset($validated['employment']['status'])) {
            $status = $validated['employment']['status'];
            if ($status === 'Self-employed') {
                $validated['employment']['status'] = 'Self-Employed';
            }
        }

        if (isset($validated['personal_info']['civil_status'])) {
            $status = $validated['personal_info']['civil_status'];
            if ($status === 'Cohabitation') {
                $validated['personal_info']['civil_status'] = 'Separated'; // Map to closest matching database enum
            }
        }

        if (isset($validated['disabilities'])) {
            foreach ($validated['disabilities'] as &$disability) {
                if (isset($disability['cause'])) {
                    if ($disability['cause'] === 'Congenital / Inborn' || $disability['cause'] === 'Inborn') {
                        $disability['cause'] = 'Congenital';
                    }
                }
            }
        }

        return $validated;
    }

    protected function transformProfile(PwdProfile $profile): array
    {
        // Check if this profile was applied online
        $appliedOnline = $profile->relationLoaded('pendingRegistration') 
            ? ($profile->pendingRegistration && $profile->pendingRegistration->user_id !== null)
            : $profile->isAppliedOnline();

        return [
            'id' => $profile->id,
            'pwd_number' => $profile->pwd_number,
            'name' => $profile->full_name,
            'first_name' => $profile->first_name,
            'last_name' => $profile->last_name,
            'middle_name' => $profile->middle_name,
            'suffix' => $profile->suffix,
            'age' => $profile->age,
            'status' => $profile->status,
            'accessibility_needs' => $profile->accessibility_needs,
            'service_needs' => $profile->service_needs,
            'card_printed' => (bool) $profile->card_printed,
            'card_printed_at' => $profile->card_printed_at,
            'applied_online' => $appliedOnline,
            'barangay' => $profile->address?->barangay ? [
                'id' => $profile->address->barangay->id,
                'name' => $profile->address->barangay->name,
            ] : null,
            'disabilities' => $profile->disabilities->map(fn($d) => [
                'id' => $d->id,
                'disability_type_id' => $d->disability_type_id,
                'disability_type' => $d->disabilityType ? [
                    'id' => $d->disabilityType->id,
                    'name' => $d->disabilityType->name,
                ] : null,
                'cause' => $d->cause,
                'is_primary' => $d->is_primary,
            ])->toArray(),
            'disability_type' => (($primary = $profile->disabilities->first()) && $primary->disabilityType?->name === 'Other' && $primary->cause_details) 
                ? $primary->cause_details 
                : $profile->disabilities->first()?->disabilityType?->name,
            'sex' => $profile->personalInfo?->sex,
            'date_applied' => $profile->date_applied,
            'created_at' => $profile->created_at,
        ];
    }

    protected function transformProfileFull(PwdProfile $profile): array
    {
        return [
            'id' => $profile->id,
            'pwd_number' => $profile->pwd_number,
            'first_name' => $profile->first_name,
            'last_name' => $profile->last_name,
            'middle_name' => $profile->middle_name,
            'suffix' => $profile->suffix,
            'status' => $profile->status,
            'current_version' => $profile->current_version,
            'remarks' => $profile->remarks,
            'accessibility_needs' => $profile->accessibility_needs,
            'service_needs' => $profile->service_needs,
            'date_applied' => $profile->date_applied,
            'personal_info' => $profile->personalInfo,
            'address' => [
                ...$profile->address?->toArray() ?? [],
                'barangay_name' => $profile->address?->barangay?->name,
            ],
            'contacts' => $profile->contacts,
            'disabilities' => $profile->disabilities->map(fn($d) => [
                'id' => $d->id,
                'disability_type_id' => $d->disability_type_id,
                'disability_type_name' => $d->disabilityType?->name,
                'cause' => $d->cause,
                'cause_details' => $d->cause_details,
                'is_primary' => $d->is_primary,
            ]),
            'employment' => $profile->employment,
            'education' => $profile->education,
            'family_members' => $profile->familyMembers,
            'government_ids' => $profile->governmentIds,
            'household_info' => $profile->householdInfo,
            'organization' => $profile->organization,
            'created_at' => $profile->created_at,
            'updated_at' => $profile->updated_at,
        ];
    }

    protected function createVersionSnapshot(PwdProfile $profile, string $summary): void
    {
        $profile->loadFullProfile();
        
        PwdProfileVersion::create([
            'pwd_profile_id' => $profile->id,
            'version_number' => $profile->current_version + 1,
            'snapshot' => $profile->toArray(),
            'changed_by' => auth()->id(),
            'change_summary' => $summary,
            'changed_at' => now(),
        ]);

        $profile->increment('current_version');
    }
}
