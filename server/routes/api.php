<?php

use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\ApprovalController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BackupController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MayorDashboardController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PwdController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ServiceRequestController;
use App\Http\Controllers\Api\IdCardTemplateController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group.
|
*/

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::get('/pwd/lookups', [PwdController::class, 'lookups']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/me/application', [AuthController::class, 'getApplication']);
    Route::post('/me/application/resubmit', [AuthController::class, 'resubmitApplication']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::put('/me/contact', [AuthController::class, 'updateContact']);

    // PWD Profiles & Submissions
    Route::post('/pwd', [PwdController::class, 'store']); 
    Route::get('/pwd/search-by-number', [PwdController::class, 'searchByPwdNumber']);
    Route::get('/pwd', [PwdController::class, 'index']);
    Route::get('/pwd/{pwd}', [PwdController::class, 'show']);
    Route::put('/pwd/{pwd}', [PwdController::class, 'update']);
    Route::delete('/pwd/{pwd}', [PwdController::class, 'destroy']);
    Route::patch('/pwd/{pwd}/status', [PwdController::class, 'updateStatus']);
    Route::patch('/pwd/{pwd}/mark-printed', [PwdController::class, 'markAsPrinted']);
    Route::post('/pwd/{pwd}/generate-number', [PwdController::class, 'generateNumber']);
    Route::get('/pwd/{pwd}/versions', [PwdController::class, 'versions']);
    Route::post('/pwd/{pwd}/restore-version/{versionNumber}', [PwdController::class, 'restoreVersion'])
        ->middleware('admin');

    // Approval Queue
    Route::prefix('approvals')->group(function () {
        Route::get('/', [ApprovalController::class, 'index']);
        Route::get('/stats', [ApprovalController::class, 'stats']);
        Route::get('/{approval}', [ApprovalController::class, 'show']);
        Route::post('/{approval}/approve', [ApprovalController::class, 'approve']);
        Route::post('/{approval}/reject', [ApprovalController::class, 'reject']);
        Route::post('/{approval}/mark-review', [ApprovalController::class, 'markForReview']);
    });

    // Activity Logs
    Route::prefix('logs')->group(function () {
        Route::get('/', [ActivityLogController::class, 'index']);
        Route::get('/archive-months', [ActivityLogController::class, 'archiveMonths']);
        Route::get('/{id}', [ActivityLogController::class, 'show']);
        Route::delete('/clear', [ActivityLogController::class, 'clearCurrent'])->middleware('admin');
    });

    // Reports
    Route::prefix('reports')->group(function () {
        Route::get('/', [ReportController::class, 'index']);
        Route::post('/generate', [ReportController::class, 'generate']);
        Route::post('/preview', [ReportController::class, 'preview']);
        Route::get('/{report}/download', [ReportController::class, 'download']);
        Route::delete('/{report}', [ReportController::class, 'destroy']);
    });

    // Backups (Admin only)
    Route::middleware('admin')->prefix('backups')->group(function () {
        Route::get('/', [BackupController::class, 'index']);
        Route::post('/', [BackupController::class, 'store']);
        Route::post('/restore', [BackupController::class, 'restore']);
        Route::get('/{backup}/download', [BackupController::class, 'download']);
        Route::delete('/{backup}', [BackupController::class, 'destroy']);
    });

    // Users (Admin only)
    Route::middleware('admin')->group(function () {
        Route::apiResource('users', UserController::class);
        Route::post('/users/{id}/restore', [UserController::class, 'restore']);
    });

    // Notifications
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/{notification}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::delete('/{notification}', [NotificationController::class, 'destroy']);
        Route::delete('/clear-read', [NotificationController::class, 'clearRead']);
    });

    // Appointments
    Route::prefix('appointments')->group(function () {
        Route::get('/', [AppointmentController::class, 'index']);
        Route::post('/', [AppointmentController::class, 'store']);
        Route::get('/available-slots', [AppointmentController::class, 'availableSlots']);
        Route::get('/stats', [AppointmentController::class, 'stats']);
        Route::get('/my', [AppointmentController::class, 'my']);
        Route::post('/{appointment}/cancel', [AppointmentController::class, 'cancel']);
        Route::patch('/{appointment}/status', [AppointmentController::class, 'updateStatus']);
        Route::post('/{appointment}/notify-id-ready', [AppointmentController::class, 'notifyIdReady']);
    });

    // Service Requests (Lost ID, Damaged ID, Renewal)
    Route::prefix('service-requests')->group(function () {
        Route::get('/', [ServiceRequestController::class, 'index']);
        Route::post('/', [ServiceRequestController::class, 'store']);
        Route::get('/stats', [ServiceRequestController::class, 'stats']);
        Route::patch('/{serviceRequest}/status', [ServiceRequestController::class, 'updateStatus']);
    });

    // ID Card Templates — active template readable by any authenticated user
    Route::get('/id-templates/active', [IdCardTemplateController::class, 'active']);

    // Dashboard
    Route::prefix('dashboard')->group(function () {
        Route::get('/stats', [DashboardController::class, 'stats']);
        Route::get('/by-barangay', [DashboardController::class, 'byBarangay']);
        Route::get('/by-disability-type', [DashboardController::class, 'byDisabilityType']);
        Route::get('/by-age-group', [DashboardController::class, 'byAgeGroup']);
        Route::get('/by-employment', [DashboardController::class, 'byEmploymentStatus']);
        Route::get('/by-gender', [DashboardController::class, 'byGender']);
        Route::get('/by-income', [DashboardController::class, 'byIncome']);
        Route::get('/by-living-arrangement', [DashboardController::class, 'byLivingArrangement']);
        Route::get('/deceased-by-age', [DashboardController::class, 'deceasedByAge']);
        Route::get('/monthly-trend', [DashboardController::class, 'monthlyTrend']);
        Route::get('/recent-activity', [DashboardController::class, 'recentActivity']);
    });

    // Mayor Executive Dashboard
    Route::middleware('role:MAYOR,ADMIN')->prefix('mayor')->group(function () {
        Route::get('/executive-summary', [MayorDashboardController::class, 'executiveSummary']);
    });

    // ID Card Templates — admin-only management
    Route::middleware('admin')->prefix('id-templates')->group(function () {
        Route::get('/', [IdCardTemplateController::class, 'index']);
        Route::post('/', [IdCardTemplateController::class, 'store']);
        Route::post('/save-both', [IdCardTemplateController::class, 'saveBoth']);
        Route::post('/upload-image', [IdCardTemplateController::class, 'uploadImage']);
        Route::post('/revert-image', [IdCardTemplateController::class, 'revertImage']);
    });
});
