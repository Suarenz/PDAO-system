<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\ServiceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceRequestController extends Controller
{
    /**
     * List service requests (admin sees all, user sees own)
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = ServiceRequest::with(['user', 'pwdProfile.contacts', 'processedByUser']);

        if (!in_array($user->role, ['ADMIN', 'STAFF'])) {
            $query->where('user_id', $user->id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $requests = $query->orderBy('created_at', 'desc')
                         ->paginate($request->per_page ?? 15);

        $data = $requests->map(function ($sr) {
            // Try direct relationship first, then fallback via PendingRegistration
            $contacts = $sr->pwdProfile?->contacts;
            if (!$contacts && $sr->user_id) {
                $pendingReg = \App\Models\PendingRegistration::where('user_id', $sr->user_id)
                    ->whereNotNull('pwd_profile_id')
                    ->latest()
                    ->first();
                if ($pendingReg && $pendingReg->pwd_profile_id) {
                    $contacts = \App\Models\PwdContact::where('pwd_profile_id', $pendingReg->pwd_profile_id)->first();
                }
            }
            return [
                'id' => $sr->id,
                'user_id' => $sr->user_id,
                'user_name' => $sr->user?->full_name ?? $sr->user?->name,
                'user_phone' => $contacts?->mobile ?? null,
                'user_email' => $contacts?->email ?? null,
                'pwd_profile_id' => $sr->pwd_profile_id,
                'type' => $sr->type,
                'type_label' => $sr->getTypeLabel(),
                'status' => $sr->status,
                'notes' => $sr->notes,
                'affidavit_path' => $sr->affidavit_path,
                'admin_notes' => $sr->admin_notes,
                'processed_by' => $sr->processedByUser?->full_name ?? $sr->processedByUser?->name,
                'processed_at' => $sr->processed_at,
                'created_at' => $sr->created_at,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
            'meta' => [
                'current_page' => $requests->currentPage(),
                'last_page' => $requests->lastPage(),
                'per_page' => $requests->perPage(),
                'total' => $requests->total(),
            ],
        ]);
    }

    /**
     * Submit a new service request
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'type' => 'required|in:LOST_ID,DAMAGED_ID,RENEWAL',
            'notes' => 'nullable|string|max:1000',
            'affidavit' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        // Check for existing pending/processing request of the same type
        $existingRequest = ServiceRequest::where('user_id', $request->user()->id)
            ->where('type', $request->type)
            ->whereIn('status', ['PENDING', 'PROCESSING'])
            ->first();

        if ($existingRequest) {
            $typeLabel = $existingRequest->getTypeLabel();
            return response()->json([
                'success' => false,
                'message' => "You already have a pending {$typeLabel} request. Please wait for it to be processed before submitting a new one.",
            ], 422);
        }

        // For RENEWAL: validate eligibility (within 60 days of expiry or expired)
        if ($request->type === 'RENEWAL') {
            $pendingReg = \App\Models\PendingRegistration::where('user_id', $request->user()->id)
                ->whereNotNull('pwd_profile_id')
                ->where('status', 'APPROVED')
                ->latest()
                ->first();

            if ($pendingReg && $pendingReg->pwdProfile) {
                $expiryDate = $pendingReg->pwdProfile->expiry_date;
                if ($expiryDate) {
                    $daysUntilExpiry = now()->diffInDays($expiryDate, false);
                    if ($daysUntilExpiry > 60) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Renewal is not yet available. Your ID expires on ' . $expiryDate->format('M d, Y') . ' (' . (int)$daysUntilExpiry . ' days remaining). Renewal becomes available 60 days before expiration.',
                        ], 422);
                    }
                }
            }
        }

        // Require affidavit for Lost/Damaged ID requests
        if (in_array($request->type, ['LOST_ID', 'DAMAGED_ID']) && !$request->hasFile('affidavit')) {
            return response()->json([
                'success' => false,
                'message' => 'An Affidavit of Loss document is required for Lost/Damaged ID requests.',
            ], 422);
        }

        $affidavitPath = null;
        if ($request->hasFile('affidavit')) {
            $affidavitPath = $request->file('affidavit')->store('affidavits', 'public');
        }

        // Resolve the user's PWD profile for contact info linkage
        $pwdProfileId = null;
        $pendingReg = \App\Models\PendingRegistration::where('user_id', $request->user()->id)
            ->whereNotNull('pwd_profile_id')
            ->latest()
            ->first();
        if ($pendingReg) {
            $pwdProfileId = $pendingReg->pwd_profile_id;
        }

        $serviceRequest = ServiceRequest::create([
            'user_id' => $request->user()->id,
            'pwd_profile_id' => $pwdProfileId,
            'type' => $request->type,
            'notes' => $request->notes,
            'affidavit_path' => $affidavitPath,
            'status' => 'PENDING',
        ]);

        // Notify admins
        $typeLabel = $serviceRequest->getTypeLabel();
        $this->notifyAdmins(
            'update',
            'New Service Request: ' . $typeLabel,
            ($request->user()->name ?? 'A user') . ' has submitted a ' . $typeLabel . ' request.',
            $request->user()->name ?? 'User'
        );

        return response()->json([
            'success' => true,
            'message' => 'Service request submitted successfully.',
            'data' => $serviceRequest,
        ], 201);
    }

    /**
     * Admin: Update service request status
     */
    public function updateStatus(Request $request, ServiceRequest $serviceRequest): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:PENDING,PROCESSING,COMPLETED,REJECTED',
            'admin_notes' => 'nullable|string|max:500',
        ]);

        $serviceRequest->update([
            'status' => $request->status,
            'admin_notes' => $request->admin_notes,
            'processed_by' => $request->user()->id,
            'processed_at' => now(),
        ]);

        $statusMessages = [
            'PROCESSING' => 'Your ' . $serviceRequest->getTypeLabel() . ' request is now being processed.',
            'COMPLETED' => 'An admin has contacted you regarding your ' . $serviceRequest->getTypeLabel() . ' report. Your report has now been marked as completed.',
            'REJECTED' => 'Your ' . $serviceRequest->getTypeLabel() . ' request has been declined.' . ($request->admin_notes ? ' Reason: ' . $request->admin_notes : ''),
        ];

        if (isset($statusMessages[$request->status])) {
            Notification::notify(
                $serviceRequest->user_id,
                $request->status === 'COMPLETED' ? 'approval' : ($request->status === 'REJECTED' ? 'rejection' : 'update'),
                'Service Request ' . ucfirst(strtolower($request->status)),
                $statusMessages[$request->status],
                $request->user()->name ?? 'Admin',
                'service_request',
                $serviceRequest->id
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Service request status updated.',
        ]);
    }

    /**
     * Get service request statistics
     */
    public function stats(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'total_pending' => ServiceRequest::where('status', 'PENDING')->count(),
                'total_processing' => ServiceRequest::where('status', 'PROCESSING')->count(),
                'total_completed' => ServiceRequest::where('status', 'COMPLETED')->count(),
                'total_rejected' => ServiceRequest::where('status', 'REJECTED')->count(),
                'lost_id_count' => ServiceRequest::where('type', 'LOST_ID')->where('status', '!=', 'COMPLETED')->count(),
                'damaged_id_count' => ServiceRequest::where('type', 'DAMAGED_ID')->where('status', '!=', 'COMPLETED')->count(),
                'renewal_count' => ServiceRequest::where('type', 'RENEWAL')->where('status', '!=', 'COMPLETED')->count(),
            ],
        ]);
    }

    private function notifyAdmins(string $type, string $title, string $message, string $actionBy): void
    {
        $admins = \App\Models\User::whereIn('role', ['ADMIN', 'STAFF'])->get();
        foreach ($admins as $admin) {
            Notification::notify(
                $admin->id,
                $type,
                $title,
                $message,
                $actionBy,
                'service_request',
                null
            );
        }
    }
}
