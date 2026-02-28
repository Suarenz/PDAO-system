<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PwdProfileVersion extends Model
{
    use HasFactory;

    protected $fillable = [
        'pwd_profile_id',
        'version_number',
        'snapshot',
        'changed_by',
        'change_summary',
        'changed_at',
    ];

    protected $casts = [
        'snapshot' => 'array',
        'version_number' => 'integer',
        'changed_at' => 'datetime',
    ];

    /**
     * Get the PWD profile.
     */
    public function pwdProfile()
    {
        return $this->belongsTo(PwdProfile::class);
    }

    /**
     * Get the user who made the change.
     */
    public function changedByUser()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
