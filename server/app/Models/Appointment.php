<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Appointment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'pwd_profile_id',
        'appointment_date',
        'appointment_time',
        'status',
        'proxy_name',
        'proxy_relationship',
        'notes',
        'admin_notes',
        'processed_by',
        'processed_at',
    ];

    protected $casts = [
        'appointment_date' => 'date',
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

    public function scopeScheduled($query)
    {
        return $query->where('status', 'SCHEDULED');
    }

    public function scopeForDate($query, $date)
    {
        return $query->where('appointment_date', $date);
    }

    /**
     * Get the count of booked slots for a given date and time
     */
    public static function bookedSlotsCount(string $date, string $time): int
    {
        return self::where('appointment_date', $date)
            ->where('appointment_time', $time)
            ->where('status', 'SCHEDULED')
            ->count();
    }

    /**
     * Max appointments per time slot
     */
    public static int $maxPerSlot = 3;
}
