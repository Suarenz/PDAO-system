<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ServiceRequest extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'pwd_profile_id',
        'type',
        'status',
        'notes',
        'affidavit_path',
        'admin_notes',
        'processed_by',
        'processed_at',
    ];

    protected $casts = [
        'processed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function pwdProfile()
    {
        return $this->belongsTo(PwdProfile::class);
    }

    public function processedByUser()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'PENDING');
    }

    public function getTypeLabel(): string
    {
        return match($this->type) {
            'LOST_ID' => 'Lost ID',
            'DAMAGED_ID' => 'Damaged ID',
            'RENEWAL' => 'Renewal',
            default => $this->type,
        };
    }
}
