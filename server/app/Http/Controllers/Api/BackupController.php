<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Backup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\Process\Process;

class BackupController extends Controller
{
    /**
     * Get all backups
     */
    public function index(Request $request): JsonResponse
    {
        $backups = Backup::with('createdByUser')
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        $data = $backups->map(function ($backup) {
            return [
                'id' => $backup->id,
                'file_name' => $backup->file_name,
                'size' => $backup->size,
                'status' => $backup->status,
                'notes' => $backup->notes,
                'created_by' => $backup->createdByUser?->full_name ?? 'System',
                'created_at' => $backup->created_at,
                'file_exists' => $backup->fileExists(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
            'meta' => [
                'current_page' => $backups->currentPage(),
                'last_page' => $backups->lastPage(),
                'per_page' => $backups->perPage(),
                'total' => $backups->total(),
            ],
        ]);
    }

    /**
     * Create a new backup
     */
    public function store(Request $request): JsonResponse
    {
        \Log::info("Backup store request received. User ID: " . ($request->user()?->id ?? 'None'));

        $request->validate([
            'notes' => 'nullable|string|max:500',
        ]);

        $timestamp = now()->format('Y-m-d_His');
        $fileName = "pdao_backup_{$timestamp}.sql";
        $filePath = $fileName;

        // Create backup record first
        $backup = Backup::create([
            'file_name' => $fileName,
            'file_path' => $filePath,
            'status' => 'IN_PROGRESS',
            'notes' => $request->notes,
            'created_by' => $request->user()?->id ?? 1, // Fallback for testing
        ]);

        // Ensure backups directory exists and is writable
        if (!Storage::disk('backups')->exists('')) {
            Storage::disk('backups')->makeDirectory('');
        }
        
        $backupDir = Storage::disk('backups')->path('');
        if (!is_writable($backupDir)) {
            \Log::error("Backup directory is not writable: " . $backupDir);
            $backup->update(['status' => 'FAILED']);
            return response()->json([
                'success' => false,
                'message' => 'Backup directory is not writable.',
            ], 500);
        }
        
        $fullPath = Storage::disk('backups')->path($filePath);

        try {
            // Get database config
            $host = config('database.connections.mysql.host');
            $port = config('database.connections.mysql.port');
            $database = config('database.connections.mysql.database');
            $username = config('database.connections.mysql.username');
            $password = config('database.connections.mysql.password');

            $mysqldump = $this->getBinaryPath('mysqldump');
            
            // On Windows with XAMPP, "localhost" can sometimes avoid TCP socket issues
            // that occur with "127.0.0.1" in certain security configurations.
            $backupHost = ($host === '127.0.0.1') ? 'localhost' : $host;

            // Using --password= directly WITHOUT quotes if blank is often required on Windows
            $passArg = $password !== '' ? '--password=' . escapeshellarg($password) : '--password=';

            // Build mysqldump command
            $command = sprintf(
                '%s --host=%s --port=%s --user=%s %s %s',
                escapeshellarg($mysqldump),
                escapeshellarg($backupHost),
                escapeshellarg($port),
                escapeshellarg($username),
                $passArg,
                escapeshellarg($database)
            );

            \Log::info("Executing backup: " . $command . " > " . $fullPath);

            // Execute mysqldump
            // We pass the current environment variables (like SystemRoot) which is
            // required on Windows to initialize networking sockets correctly (Error 10106).
            $process = Process::fromShellCommandline(
                $command . ' > ' . escapeshellarg($fullPath),
                null,
                array_merge($_ENV, $_SERVER, [
                    'SystemRoot' => getenv('SystemRoot') ?: 'C:\\Windows',
                ])
            );
            $process->setTimeout(300); // 5 minutes timeout
            $process->run();

            if (!$process->isSuccessful()) {
                $error = $process->getErrorOutput() ?: $process->getOutput();
                \Log::error("Backup failed: " . $error);
                throw new \Exception('Process failed: ' . $error);
            }

            // Update backup record with file size
            $size = Storage::disk('backups')->size($filePath);
            $backup->update([
                'status' => 'COMPLETED',
                'size' => $this->formatBytes($size),
            ]);

            // Log activity
            ActivityLog::log('backup', Backup::class, $backup->id, null, null, "Created backup: {$fileName}");

            return response()->json([
                'success' => true,
                'message' => 'Backup created successfully',
                'data' => [
                    'id' => $backup->id,
                    'file_name' => $backup->file_name,
                    'size' => $backup->size,
                ],
            ]);

        } catch (\Exception $e) {
            $backup->update(['status' => 'FAILED']);

            return response()->json([
                'success' => false,
                'message' => 'Backup failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Download a backup file
     */
    public function download(Backup $backup): BinaryFileResponse|JsonResponse
    {
        if (!$backup->fileExists()) {
            return response()->json([
                'success' => false,
                'message' => 'Backup file not found',
            ], 404);
        }

        return response()->download(
            $backup->full_path,
            $backup->file_name,
            ['Content-Type' => 'application/sql']
        );
    }

    /**
     * Restore from a backup
     */
    public function restore(Request $request): JsonResponse
    {
        // Validate: either backup_id or file must be provided
        $request->validate([
            'backup_id' => 'nullable|exists:backups,id',
            'file' => 'nullable|file|max:512000', // 500MB max
        ]);

        // Ensure at least one of backup_id or file is provided
        if (!$request->filled('backup_id') && !$request->hasFile('file')) {
            return response()->json([
                'success' => false,
                'message' => 'Please provide either a backup ID or upload a file.',
            ], 422);
        }

        try {
            if ($request->filled('backup_id')) {
                $backup = Backup::findOrFail($request->backup_id);
                
                if (!$backup->fileExists()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Backup file not found',
                    ], 404);
                }
                
                $filePath = $backup->full_path;
            } else {
                $uploadedFile = $request->file('file');
                
                // Validate file extension manually (MIME detection unreliable for .sql)
                $extension = strtolower($uploadedFile->getClientOriginalExtension());
                if (!in_array($extension, ['sql', 'txt', 'zip', 'gz'])) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid file type. Please upload a .sql, .txt, .zip, or .gz file.',
                    ], 422);
                }

                $filePath = $uploadedFile->getPathname();

                // Handle compressed files: extract first
                if (in_array($extension, ['zip', 'gz'])) {
                    $extractedPath = $this->extractCompressedBackup($uploadedFile);
                    if (!$extractedPath) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Failed to extract compressed backup file. Ensure it contains a valid .sql file.',
                        ], 422);
                    }
                    $filePath = $extractedPath;
                }
            }

            \Log::info("Starting database restore from: " . $filePath);

            // Verify the file exists and is readable
            if (!file_exists($filePath) || !is_readable($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Backup file is not accessible.',
                ], 500);
            }

            // Get database config
            $host = config('database.connections.mysql.host');
            $port = config('database.connections.mysql.port');
            $database = config('database.connections.mysql.database');
            $username = config('database.connections.mysql.username');
            $password = config('database.connections.mysql.password');

            $mysql = $this->getBinaryPath('mysql');

            // On Windows with XAMPP, "localhost" can sometimes avoid TCP socket issues
            $backupHost = ($host === '127.0.0.1') ? 'localhost' : $host;

            // Handle empty password correctly (common in XAMPP)
            // Using --password= directly WITHOUT quotes if blank is required on Windows
            $passArg = $password !== '' ? '--password=' . escapeshellarg($password) : '--password=';

            // Build mysql restore command
            $command = sprintf(
                '%s --host=%s --port=%s --user=%s %s %s < %s',
                escapeshellarg($mysql),
                escapeshellarg($backupHost),
                escapeshellarg($port),
                escapeshellarg($username),
                $passArg,
                escapeshellarg($database),
                escapeshellarg($filePath)
            );

            \Log::info("Executing restore command: " . preg_replace('/--password=\S+/', '--password=***', $command));

            // Execute restore
            $process = Process::fromShellCommandline(
                $command,
                null,
                array_merge($_ENV, $_SERVER, [
                    'SystemRoot' => getenv('SystemRoot') ?: 'C:\\Windows',
                ])
            );
            $process->setTimeout(600); // 10 minutes timeout
            $process->run();

            if (!$process->isSuccessful()) {
                $errorOutput = $process->getErrorOutput();
                \Log::error("Restore failed: " . $errorOutput);
                // Sanitize error message before returning to frontend
                $safeError = preg_replace('/--password=\S+/', '--password=***', $errorOutput);
                throw new \Exception('Restore process failed: ' . $safeError);
            }

            \Log::info("Database restore completed successfully.");

            // Log activity
            ActivityLog::log('restore', null, null, null, null, 'Database restored from backup');

            return response()->json([
                'success' => true,
                'message' => 'Database restored successfully',
            ]);

        } catch (\Exception $e) {
            \Log::error("Restore exception: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Restore failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a backup
     */
    public function destroy(Backup $backup): JsonResponse
    {
        // Delete file if exists
        $backup->deleteFile();
        
        // Delete record
        $backup->delete();

        return response()->json([
            'success' => true,
            'message' => 'Backup deleted successfully',
        ]);
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

    /**
     * Extract a compressed backup file (.zip or .gz) and return path to the .sql file inside
     */
    protected function extractCompressedBackup($uploadedFile): ?string
    {
        $extension = strtolower($uploadedFile->getClientOriginalExtension());
        $tempDir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'pdao_restore_' . uniqid();
        @mkdir($tempDir, 0777, true);

        try {
            if ($extension === 'zip') {
                $zip = new \ZipArchive();
                if ($zip->open($uploadedFile->getPathname()) === true) {
                    $zip->extractTo($tempDir);
                    $zip->close();
                } else {
                    return null;
                }
            } elseif ($extension === 'gz') {
                $gzContent = gzdecode(file_get_contents($uploadedFile->getPathname()));
                if ($gzContent === false) {
                    return null;
                }
                $sqlPath = $tempDir . DIRECTORY_SEPARATOR . 'restore.sql';
                file_put_contents($sqlPath, $gzContent);
                return $sqlPath;
            }

            // Find .sql file in extracted directory
            $files = glob($tempDir . DIRECTORY_SEPARATOR . '*.sql');
            return !empty($files) ? $files[0] : null;
        } catch (\Exception $e) {
            \Log::error('Failed to extract compressed backup: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get binary path for mysql or mysqldump
     */
    protected function getBinaryPath(string $binary): string
    {
        // Check if in PATH
        $path = exec("where $binary 2>NUL");
        if ($path && file_exists(trim($path))) {
            return trim($path);
        }

        // Common XAMPP paths on Windows (check multiple locations)
        $possiblePaths = [
            "C:\\xampp\\mysql\\bin\\$binary.exe",
            "D:\\xampp\\mysql\\bin\\$binary.exe",
            "D:\\downloads\\Downloads from web\\xampp\\mysql\\bin\\$binary.exe",
        ];

        foreach ($possiblePaths as $xamppPath) {
            if (file_exists($xamppPath)) {
                return $xamppPath;
            }
        }

        return $binary; // Fallback to raw binary name
    }
}
