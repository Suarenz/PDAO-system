<?php

namespace App\Console\Commands;

use App\Models\ActivityLog;
use App\Models\ActivityLogArchive;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ArchiveActivityLogs extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'logs:archive 
                            {--month= : The month to archive (YYYY-MM format). Defaults to previous month}
                            {--dry-run : Show what would be archived without actually archiving}';

    /**
     * The console command description.
     */
    protected $description = 'Archive activity logs from previous month to the archive table';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $month = $this->option('month');

        if ($month) {
            try {
                $archiveDate = Carbon::createFromFormat('Y-m', $month);
            } catch (\Exception $e) {
                $this->error("Invalid month format. Use YYYY-MM (e.g., 2026-01)");
                return Command::FAILURE;
            }
        } else {
            // Default to previous month
            $archiveDate = now()->subMonth();
        }

        $archiveMonth = $archiveDate->format('Y-m');
        $startDate = $archiveDate->startOfMonth()->toDateTimeString();
        $endDate = $archiveDate->endOfMonth()->toDateTimeString();

        $this->info("Archiving activity logs for: {$archiveMonth}");
        $this->info("Date range: {$startDate} to {$endDate}");

        // Get logs to archive
        $logs = ActivityLog::whereBetween('created_at', [$startDate, $endDate])->get();
        $count = $logs->count();

        if ($count === 0) {
            $this->info("No logs found for {$archiveMonth}");
            return Command::SUCCESS;
        }

        $this->info("Found {$count} logs to archive");

        if ($dryRun) {
            $this->warn("[DRY RUN] Would archive {$count} logs to archive table");
            $this->newLine();
            
            // Show sample
            $this->info("Sample of logs that would be archived:");
            $this->table(
                ['ID', 'Action', 'Model', 'Description', 'Created At'],
                $logs->take(10)->map(fn($log) => [
                    $log->id,
                    $log->action_type,
                    $log->model_type ? class_basename($log->model_type) : '-',
                    \Str::limit($log->description, 40),
                    $log->created_at->format('Y-m-d H:i'),
                ])
            );
            
            return Command::SUCCESS;
        }

        // Check if already archived
        $existingCount = ActivityLogArchive::where('archive_month', $archiveMonth)->count();
        if ($existingCount > 0) {
            if (!$this->confirm("Found {$existingCount} existing archived logs for {$archiveMonth}. Continue and add more?")) {
                return Command::FAILURE;
            }
        }

        // Archive logs
        $this->info("Archiving logs...");
        $bar = $this->output->createProgressBar($count);
        $bar->start();

        DB::transaction(function () use ($logs, $archiveMonth, $bar) {
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
                
                // Delete from main table
                $log->delete();
                
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine();

        $this->info("Successfully archived {$count} logs for {$archiveMonth}");

        return Command::SUCCESS;
    }
}
