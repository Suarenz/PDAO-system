<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PwdDisability extends Model
{
    use HasFactory;

    protected $fillable = [
        'pwd_profile_id',
        'disability_type_id',
        'cause',
        'cause_details',
        'is_primary',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    /**
     * Get the PWD profile.
     */
    public function pwdProfile()
    {
        return $this->belongsTo(PwdProfile::class);
    }

    /**
     * Get the disability type.
     */
    public function disabilityType()
    {
        return $this->belongsTo(DisabilityType::class);
    }
}
