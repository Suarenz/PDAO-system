<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Archive activity logs monthly (run at 1 AM on the first day of each month)
Schedule::command('logs:archive')
    ->monthlyOn(1, '01:00')
    ->timezone('Asia/Manila');

// Purge old archives yearly (run at 2 AM on January 1st)
Schedule::command('logs:purge --years=7')
    ->yearly()
    ->timezone('Asia/Manila');

// Daily backup at 2 AM
Schedule::command('backup:daily')
    ->dailyAt('02:00')
    ->timezone('Asia/Manila');
