<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Backup extends Model
{
    use HasFactory;

    protected $fillable = [
        'file_name',
        'file_path',
        'size',
        'status',
        'notes',
        'created_by',
    ];

    /**
     * Get the user who created this backup.
     */
    public function createdByUser()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the full file path for download.
     */
    public function getFullPathAttribute(): string
    {
        return Storage::disk('backups')->path($this->file_path);
    }

    /**
     * Check if the file exists.
     */
    public function fileExists(): bool
    {
        return Storage::disk('backups')->exists($this->file_path);
    }

    /**
     * Delete the file from storage.
     */
    public function deleteFile(): bool
    {
        if ($this->fileExists()) {
            return Storage::disk('backups')->delete($this->file_path);
        }
        return true;
    }

    /**
     * Scope for completed backups.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'COMPLETED');
    }
}
