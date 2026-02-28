<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PendingRegistration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ApprovalController extends Controller
{
    /**
     * Get all pending registrations
     */
    public function index(Request $request): JsonResponse
    {
        $query = PendingRegistration::with([
            'pwdProfile.personalInfo',
            'pwdProfile.address.barangay',
            'pwdProfile.disabilities.disabilityType',
            'reviewer',
        ]);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        } else {
            // Default to pending
            $query->where('status', 'PENDING');
        }

        // Filter by submission type
        if ($request->has('submission_type')) {
            $query->where('submission_type', $request->submission_type);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('pwdProfile', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('pwd_number', 'like', "%{$search}%");
            });
        }

        $registrations = $query->orderBy('created_at', 'desc')
                              ->paginate($request->per_page ?? 15);

        $data = $registrations->map(function ($reg) {
            $primaryDisability = $reg->pwdProfile?->disabilities->first();
            $disabilityName = $primaryDisability?->disabilityType?->name;
            
            // If the disability type is 'Other', show the cause details instead if available
            if ($disabilityName === 'Other' && $primaryDisability?->cause_details) {
                $disabilityName = $primaryDisability->cause_details;
            }

            return [
                'id' => $reg->id,
                'pwd_profile_id' => $reg->pwd_profile_id,
                'name' => $reg->pwdProfile?->full_name,
                'submission_type' => $reg->submission_type,
                'status' => $reg->status,
                'barangay' => $reg->pwdProfile?->address?->barangay?->name,
                'disability_type' => $disabilityName,
                'date_submitted' => $reg->created_at,
                'reviewed_by' => $reg->reviewer?->full_name,
                'reviewed_at' => $reg->reviewed_at,
                'review_notes' => $reg->review_notes,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
            'meta' => [
                'current_page' => $registrations->currentPage(),
                'last_page' => $registrations->lastPage(),
                'per_page' => $registrations->perPage(),
                'total' => $registrations->total(),
            ],
        ]);
    }

    /**
     * Get a single pending registration with full details
     */
    public function show(PendingRegistration $approval): JsonResponse
    {
        $approval->load([
            'pwdProfile.personalInfo',
            'pwdProfile.address.barangay',
            'pwdProfile.contacts',
            'pwdProfile.disabilities.disabilityType',
            'pwdProfile.employment',
            'pwdProfile.education',
            'pwdProfile.familyMembers',
            'pwdProfile.governmentIds',
            'pwdProfile.householdInfo',
            'reviewer',
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $approval->id,
                'submission_type' => $approval->submission_type,
                'status' => $approval->status,
                'date_submitted' => $approval->created_at,
                'reviewed_by' => $approval->reviewer?->full_name,
                'reviewed_at' => $approval->reviewed_at,
                'review_notes' => $approval->review_notes,
                'pwd_profile' => $approval->pwdProfile,
            ],
        ]);
    }

    /**
     * Approve a registration
     */
    public function approve(Request $request, PendingRegistration $approval): JsonResponse
    {
        $request->validate([
            'notes' => 'nullable|string|max:1000',
            'pwd_number' => 'nullable|string|max:255',
        ]);

        if ($approval->status !== 'PENDING' && $approval->status !== 'UNDER_REVIEW') {
            return response()->json([
                'success' => false,
                'message' => 'This registration has already been processed',
            ], 400);
        }

        $approval->approve($request->user(), $request->notes, $request->pwd_number);

        return response()->json([
            'success' => true,
            'message' => 'Registration approved successfully',
        ]);
    }

    /**
     * Reject a registration
     */
    public function reject(Request $request, PendingRegistration $approval): JsonResponse
    {
        $request->validate([
            'notes' => 'required|string|max:1000',
        ]);

        if ($approval->status !== 'PENDING' && $approval->status !== 'UNDER_REVIEW') {
            return response()->json([
                'success' => false,
                'message' => 'This registration has already been processed',
            ], 400);
        }

        $approval->reject($request->user(), $request->notes);

        return response()->json([
            'success' => true,
            'message' => 'Registration rejected',
        ]);
    }

    /**
     * Mark registration for review
     */
    public function markForReview(Request $request, PendingRegistration $approval): JsonResponse
    {
        $request->validate([
            'notes' => 'nullable|string|max:1000',
        ]);

        $approval->markForReview($request->user(), $request->notes);

        return response()->json([
            'success' => true,
            'message' => 'Registration marked for review',
        ]);
    }

    /**
     * Get approval statistics
     */
    public function stats(): JsonResponse
    {
        $stats = [
            'pending' => PendingRegistration::where('status', 'PENDING')->count(),
            'under_review' => PendingRegistration::where('status', 'UNDER_REVIEW')->count(),
            'approved_today' => PendingRegistration::where('status', 'APPROVED')
                ->whereDate('reviewed_at', today())
                ->count(),
            'rejected_today' => PendingRegistration::where('status', 'REJECTED')
                ->whereDate('reviewed_at', today())
                ->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}
