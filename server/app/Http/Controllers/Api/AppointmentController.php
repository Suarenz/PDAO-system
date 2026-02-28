<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    /**
     * List appointments (admin sees all, user sees own)
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Appointment::with(['user', 'pwdProfile', 'processedByUser']);

        if (!in_array($user->role, ['ADMIN', 'STAFF'])) {
            $query->where('user_id', $user->id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('date')) {
            $query->where('appointment_date', $request->date);
        }

        $appointments = $query->orderBy('appointment_date', 'asc')
                             ->orderBy('appointment_time', 'asc')
                             ->paginate($request->per_page ?? 15);

        $data = $appointments->map(function ($apt) {
            return [
                'id' => $apt->id,
                'user_id' => $apt->user_id,
                'user_name' => $apt->user?->full_name ?? $apt->user?->name,
                'pwd_profile_id' => $apt->pwd_profile_id,
                'appointment_date' => $apt->appointment_date->format('Y-m-d'),
                'appointment_time' => $apt->appointment_time,
                'status' => $apt->status,
                'proxy_name' => $apt->proxy_name,
                'proxy_relationship' => $apt->proxy_relationship,
                'notes' => $apt->notes,
                'admin_notes' => $apt->admin_notes,
                'processed_by' => $apt->processedByUser?->full_name ?? $apt->processedByUser?->name,
                'processed_at' => $apt->processed_at,
                'created_at' => $apt->created_at,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
            'meta' => [
                'current_page' => $appointments->currentPage(),
                'last_page' => $appointments->lastPage(),
                'per_page' => $appointments->perPage(),
                'total' => $appointments->total(),
            ],
        ]);
    }

    public function my(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $appointment = Appointment::where('user_id', $user->id)
            ->where('status', 'SCHEDULED')
            ->orderBy('appointment_date', 'asc')
            ->orderBy('appointment_time', 'asc')
            ->first();

        if (!$appointment) {
            return response()->json([
                'success' => true,
                'data' => null,
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $appointment->id,
                'user_id' => $appointment->user_id,
                'appointment_date' => $appointment->appointment_date->format('Y-m-d'),
                'appointment_time' => $appointment->appointment_time,
                'status' => $appointment->status,
                'proxy_name' => $appointment->proxy_name,
                'proxy_relationship' => $appointment->proxy_relationship,
                'notes' => $appointment->notes,
                'created_at' => $appointment->created_at,
            ],
        ]);
    }

    /**
     * Book a new appointment
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'appointment_date' => 'required|date|after_or_equal:today',
            'appointment_time' => 'required|string',
            'proxy_name' => 'nullable|string|max:255',
            'proxy_relationship' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
        ]);

        // Check slot availability
        $bookedCount = Appointment::bookedSlotsCount(
            $request->appointment_date,
            $request->appointment_time
        );

        if ($bookedCount >= Appointment::$maxPerSlot) {
            return response()->json([
                'success' => false,
                'message' => 'This time slot is fully booked. Please select another slot.',
            ], 422);
        }

        $appointment = Appointment::create([
            'user_id' => $request->user()->id,
            'appointment_date' => $request->appointment_date,
            'appointment_time' => $request->appointment_time,
            'proxy_name' => $request->proxy_name,
            'proxy_relationship' => $request->proxy_relationship,
            'notes' => $request->notes,
            'status' => 'SCHEDULED',
        ]);

        // Notify admins about new appointment
        $this->notifyAdmins(
            'update',
            'New Appointment Scheduled',
            ($request->user()->name ?? 'A user') . ' has scheduled an appointment for ' . $request->appointment_date . ' at ' . $request->appointment_time . '.',
            $request->user()->name ?? 'User'
        );

        return response()->json([
            'success' => true,
            'message' => 'Appointment booked successfully.',
            'data' => $appointment,
        ], 201);
    }

    /**
     * Get available slots for a date
     */
    public function availableSlots(Request $request): JsonResponse
    {
        $request->validate([
            'date' => 'required|date',
        ]);

        $timeSlots = [
            '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM',
            '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
            '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
            '3:00 PM', '3:30 PM', '4:00 PM',
        ];

        $date = $request->date;
        $slots = [];

        foreach ($timeSlots as $time) {
            $booked = Appointment::bookedSlotsCount($date, $time);
            $slots[] = [
                'time' => $time,
                'booked' => $booked,
                'max' => Appointment::$maxPerSlot,
                'available' => $booked < Appointment::$maxPerSlot,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $slots,
            'date' => $date,
        ]);
    }

    /**
     * Cancel an appointment
     */
    public function cancel(Request $request, Appointment $appointment): JsonResponse
    {
        $user = $request->user();

        // Users can only cancel their own, admins can cancel any
        if (!in_array($user->role, ['ADMIN', 'STAFF']) && $appointment->user_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $appointment->update([
            'status' => 'CANCELLED',
            'processed_by' => $user->id,
            'processed_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Appointment cancelled.',
        ]);
    }

    /**
     * Admin: Update appointment status (complete, no-show, etc.)
     */
    public function updateStatus(Request $request, Appointment $appointment): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:SCHEDULED,COMPLETED,CANCELLED,NO_SHOW',
            'admin_notes' => 'nullable|string|max:500',
        ]);

        $appointment->update([
            'status' => $request->status,
            'admin_notes' => $request->admin_notes,
            'processed_by' => $request->user()->id,
            'processed_at' => now(),
        ]);

        // Notify the user about status change
        $statusMessages = [
            'COMPLETED' => 'Your appointment has been marked as completed. Thank you for visiting!',
            'CANCELLED' => 'Your appointment has been cancelled by the admin.',
            'NO_SHOW' => 'You were marked as a no-show for your scheduled appointment.',
        ];

        if (isset($statusMessages[$request->status])) {
            Notification::notify(
                $appointment->user_id,
                'update',
                'Appointment ' . ucfirst(strtolower($request->status)),
                $statusMessages[$request->status] . ($request->admin_notes ? ' Note: ' . $request->admin_notes : ''),
                $request->user()->name ?? 'Admin',
                'appointment',
                $appointment->id
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Appointment status updated.',
        ]);
    }

    /**
     * Admin: Notify user that their ID is ready for pickup
     */
    public function notifyIdReady(Request $request, Appointment $appointment): JsonResponse
    {
        $request->validate([
            'message' => 'nullable|string|max:500',
        ]);

        $message = $request->message ?? 'Your PWD ID is ready for pickup! Please visit the PDAO office during your scheduled appointment.';

        Notification::notify(
            $appointment->user_id,
            'approval',
            'PWD ID Ready for Pickup',
            $message,
            $request->user()->name ?? 'Admin',
            'appointment',
            $appointment->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Notification sent to user.',
        ]);
    }

    /**
     * Get appointment statistics for admin
     */
    public function stats(): JsonResponse
    {
        $today = now()->toDateString();

        return response()->json([
            'success' => true,
            'data' => [
                'today_count' => Appointment::where('appointment_date', $today)->where('status', 'SCHEDULED')->count(),
                'total_scheduled' => Appointment::where('status', 'SCHEDULED')->count(),
                'total_completed' => Appointment::where('status', 'COMPLETED')->count(),
                'total_cancelled' => Appointment::where('status', 'CANCELLED')->count(),
                'total_no_show' => Appointment::where('status', 'NO_SHOW')->count(),
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
                'appointment',
                null
            );
        }
    }
}
