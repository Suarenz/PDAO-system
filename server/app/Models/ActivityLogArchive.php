<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityLogArchive extends Model
{
    use HasFactory;

    protected $table = 'activity_logs_archive';

    protected $fillable = [
        'archive_month',
        'original_id',
        'user_id',
        'action_type',
        'model_type',
        'model_id',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'description',
        'original_created_at',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'original_created_at' => 'datetime',
    ];

    /**
     * Get the user who performed the action.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope for filtering by archive month.
     */
    public function scopeForMonth($query, string $month)
    {
        return $query->where('archive_month', $month);
    }

    /**
     * Scope for records older than a specific date.
     */
    public function scopeOlderThan($query, $date)
    {
        return $query->where('original_created_at', '<', $date);
    }
}
