<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\ActivityLogArchive;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    /**
     * Get activity logs (current or archived)
     */
    public function index(Request $request): JsonResponse
    {
        $month = $request->get('month'); // Format: YYYY-MM

        if ($month && $month !== now()->format('Y-m')) {
            // Get from archive
            $query = ActivityLogArchive::with('user')
                ->where('archive_month', $month);
            $isArchive = true;
        } else {
            // Get from current logs
            $query = ActivityLog::with('user');
            $isArchive = false;
        }

        // Filter by action type
        if ($request->has('action_type')) {
            $query->where('action_type', $request->action_type);
        }

        // Filter by user
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by model type
        if ($request->has('model_type')) {
            $query->where('model_type', 'like', "%{$request->model_type}%");
        }

        // Date range filter
        if ($request->has('start_date') && $request->has('end_date')) {
            $dateColumn = $isArchive ? 'original_created_at' : 'created_at';
            $query->whereBetween($dateColumn, [$request->start_date, $request->end_date]);
        }

        $orderColumn = $isArchive ? 'original_created_at' : 'created_at';
        $logs = $query->orderBy($orderColumn, 'desc')
                     ->paginate($request->per_page ?? 20);

        $data = $logs->map(function ($log) use ($isArchive) {
            return [
                'id' => $log->id,
                'action_type' => $log->action_type,
                'model_type' => $log->model_type ? class_basename($log->model_type) : null,
                'model_id' => $log->model_id,
                'description' => $log->description,
                'user' => $log->user?->full_name ?? 'System',
                'ip_address' => $log->ip_address,
                'created_at' => $isArchive ? $log->original_created_at : $log->created_at,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
                'is_archive' => $isArchive,
                'month' => $month ?? now()->format('Y-m'),
            ],
        ]);
    }

    /**
     * Get a single log entry with details
     */
    public function show(Request $request, $id): JsonResponse
    {
        $month = $request->get('month');

        if ($month && $month !== now()->format('Y-m')) {
            $log = ActivityLogArchive::with('user')->findOrFail($id);
        } else {
            $log = ActivityLog::with('user')->findOrFail($id);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $log->id,
                'action_type' => $log->action_type,
                'model_type' => $log->model_type,
                'model_id' => $log->model_id,
                'old_values' => $log->old_values,
                'new_values' => $log->new_values,
                'description' => $log->description,
                'user' => $log->user?->full_name ?? 'System',
                'ip_address' => $log->ip_address,
                'user_agent' => $log->user_agent,
                'created_at' => $log->created_at,
            ],
        ]);
    }

    /**
     * Get available archive months
     */
    public function archiveMonths(): JsonResponse
    {
        $months = ActivityLogArchive::select('archive_month')
            ->distinct()
            ->orderBy('archive_month', 'desc')
            ->pluck('archive_month');

        // Add current month
        $currentMonth = now()->format('Y-m');
        if (!$months->contains($currentMonth)) {
            $months->prepend($currentMonth);
        }

        return response()->json([
            'success' => true,
            'data' => $months,
        ]);
    }

    /**
     * Clear current month logs (admin only, triggers archive)
     */
    public function clearCurrent(Request $request): JsonResponse
    {
        $count = ActivityLog::count();
        
        // Archive current logs first
        $this->archiveCurrentLogs();
        
        // Clear the table
        ActivityLog::truncate();

        ActivityLog::log('deleted', null, null, null, null, "Cleared {$count} activity logs");

        return response()->json([
            'success' => true,
            'message' => "Cleared and archived {$count} log entries",
        ]);
    }

    /**
     * Archive current logs to archive table
     */
    protected function archiveCurrentLogs(): void
    {
        $archiveMonth = now()->format('Y-m');
        
        ActivityLog::chunk(100, function ($logs) use ($archiveMonth) {
            foreach ($logs as $log) {
                ActivityLogArchive::create([
                    'archive_month' => $archiveMonth,
                    'original_id' => $log->id,
                    'user_id' => $log->user_id,
                    'action_type' => $log->action_type,
                    'model_type' => $log->model_type,
                    'model_id' => $log->model_id,
                    'old_values' => $log->old_values,
                    'new_values' => $log->new_values,
                    'ip_address' => $log->ip_address,
                    'user_agent' => $log->user_agent,
                    'description' => $log->description,
                    'original_created_at' => $log->created_at,
                ]);
            }
        });
    }
}
