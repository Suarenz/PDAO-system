<?php

namespace App\Providers;

use App\Models\Backup;
use App\Models\GeneratedReport;
use App\Models\PendingRegistration;
use App\Models\PwdProfile;
use App\Models\User;
use App\Observers\AuditObserver;
use App\Observers\VersionObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register Audit Observer for models that need activity logging
        User::observe(AuditObserver::class);
        PwdProfile::observe(AuditObserver::class);
        PendingRegistration::observe(AuditObserver::class);
        GeneratedReport::observe(AuditObserver::class);
        Backup::observe(AuditObserver::class);

        // Register Version Observer for PWD profiles
        PwdProfile::observe(VersionObserver::class);
    }
}
