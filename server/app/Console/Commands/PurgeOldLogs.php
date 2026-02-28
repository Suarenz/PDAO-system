<?php

namespace App\Console\Commands;

use App\Models\ActivityLogArchive;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class PurgeOldLogs extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'logs:purge 
                            {--years=7 : Number of years to retain logs (default: 7)}
                            {--dry-run : Show what would be purged without actually deleting}';

    /**
     * The console command description.
     */
    protected $description = 'Purge archived activity logs older than the retention period';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $years = (int) $this->option('years');
        $dryRun = $this->option('dry-run');

        if ($years < 1) {
            $this->error("Retention period must be at least 1 year");
            return Command::FAILURE;
        }

        $cutoffDate = now()->subYears($years)->startOfMonth();
        $cutoffMonth = $cutoffDate->format('Y-m');

        $this->info("Purging archived logs older than {$years} years");
        $this->info("Cutoff month: {$cutoffMonth}");

        // Get logs to purge
        $query = ActivityLogArchive::where('archive_month', '<', $cutoffMonth);
        $count = $query->count();

        if ($count === 0) {
            $this->info("No logs found older than {$cutoffMonth}");
            return Command::SUCCESS;
        }

        // Get months that will be affected
        $affectedMonths = ActivityLogArchive::where('archive_month', '<', $cutoffMonth)
            ->distinct()
            ->pluck('archive_month')
            ->sort();

        $this->info("Found {$count} logs to purge");
        $this->newLine();
        $this->info("Months that will be purged:");
        foreach ($affectedMonths as $month) {
            $monthCount = ActivityLogArchive::where('archive_month', $month)->count();
            $this->line("  - {$month}: {$monthCount} logs");
        }

        if ($dryRun) {
            $this->newLine();
            $this->warn("[DRY RUN] Would purge {$count} logs from {$affectedMonths->count()} months");
            return Command::SUCCESS;
        }

        if (!$this->confirm("Are you sure you want to permanently delete {$count} logs?")) {
            $this->info("Purge cancelled");
            return Command::FAILURE;
        }

        // Purge logs
        $this->info("Purging logs...");
        $bar = $this->output->createProgressBar($affectedMonths->count());
        $bar->start();

        $totalDeleted = 0;
        foreach ($affectedMonths as $month) {
            $deleted = ActivityLogArchive::where('archive_month', $month)->delete();
            $totalDeleted += $deleted;
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();

        $this->info("Successfully purged {$totalDeleted} logs from {$affectedMonths->count()} months");

        return Command::SUCCESS;
    }
}
