<?php

namespace App\Console\Commands;

use App\Models\ActivityLog;
use App\Models\Backup;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;

class DailyBackup extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'backup:daily 
                            {--keep=30 : Number of daily backups to keep}';

    /**
     * The console command description.
     */
    protected $description = 'Create a daily database backup';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $timestamp = now()->format('Y-m-d_His');
        $fileName = "daily_backup_{$timestamp}.sql";
        $filePath = "daily/{$fileName}";

        $this->info("Creating daily backup: {$fileName}");

        try {
            // Ensure backups directory exists
            Storage::disk('backups')->makeDirectory('daily');

            // Get database config
            $host = config('database.connections.mysql.host');
            $port = config('database.connections.mysql.port');
            $database = config('database.connections.mysql.database');
            $username = config('database.connections.mysql.username');
            $password = config('database.connections.mysql.password');

            // Build mysqldump command
            $command = sprintf(
                'mysqldump --host=%s --port=%s --user=%s --password=%s %s',
                escapeshellarg($host),
                escapeshellarg($port),
                escapeshellarg($username),
                escapeshellarg($password),
                escapeshellarg($database)
            );

            $fullPath = Storage::disk('backups')->path($filePath);

            // Execute mysqldump
            $process = Process::fromShellCommandline($command . ' > ' . escapeshellarg($fullPath));
            $process->setTimeout(300);
            $process->run();

            if (!$process->isSuccessful()) {
                throw new \Exception('Backup failed: ' . $process->getErrorOutput());
            }

            // Get file size
            $size = Storage::disk('backups')->size($filePath);

            // Create backup record
            Backup::create([
                'file_name' => $fileName,
                'file_path' => $filePath,
                'size' => $this->formatBytes($size),
                'status' => 'COMPLETED',
                'notes' => 'Automated daily backup',
            ]);

            // Log activity
            ActivityLog::create([
                'action_type' => 'backup',
                'description' => "Created daily backup: {$fileName}",
            ]);

            $this->info("Backup created successfully: {$this->formatBytes($size)}");

            // Clean up old backups
            $this->cleanupOldBackups((int) $this->option('keep'));

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error("Backup failed: " . $e->getMessage());
            return Command::FAILURE;
        }
    }

    /**
     * Clean up old daily backups
     */
    protected function cleanupOldBackups(int $keep): void
    {
        $files = Storage::disk('backups')->files('daily');
        
        // Sort by name (which includes date) descending
        rsort($files);

        // Remove files beyond keep limit
        $toDelete = array_slice($files, $keep);

        foreach ($toDelete as $file) {
            Storage::disk('backups')->delete($file);
            $this->line("Deleted old backup: " . basename($file));
        }

        if (count($toDelete) > 0) {
            $this->info("Cleaned up " . count($toDelete) . " old backups");
        }
    }

    /**
     * Format bytes to human readable
     */
    protected function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));
        
        return round($bytes, 2) . ' ' . $units[$pow];
    }
}
