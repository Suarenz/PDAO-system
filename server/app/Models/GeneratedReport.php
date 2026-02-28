<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class GeneratedReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'file_name',
        'file_path',
        'file_type',
        'report_type',
        'size',
        'parameters',
        'generated_by',
    ];

    protected $casts = [
        'parameters' => 'array',
    ];

    /**
     * Get the user who generated this report.
     */
    public function generatedByUser()
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    /**
     * Get the full file path for download.
     */
    public function getFullPathAttribute(): string
    {
        return Storage::disk('reports')->path($this->file_path);
    }

    /**
     * Check if the file exists.
     */
    public function fileExists(): bool
    {
        return Storage::disk('reports')->exists($this->file_path);
    }

    /**
     * Delete the file from storage.
     */
    public function deleteFile(): bool
    {
        if ($this->fileExists()) {
            return Storage::disk('reports')->delete($this->file_path);
        }
        return true;
    }
}
