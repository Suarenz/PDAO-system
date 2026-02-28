<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PwdPersonalInfo extends Model
{
    use HasFactory;

    protected $table = 'pwd_personal_info';

    protected $fillable = [
        'pwd_profile_id',
        'birth_date',
        'birth_place',
        'sex',
        'religion',
        'ethnic_group',
        'civil_status',
        'blood_type',
    ];

    protected $casts = [
        'birth_date' => 'date',
    ];

    /**
     * Get the PWD profile.
     */
    public function pwdProfile()
    {
        return $this->belongsTo(PwdProfile::class);
    }

    /**
     * Get the age based on birth date.
     */
    public function getAgeAttribute(): ?int
    {
        if ($this->birth_date) {
            return $this->birth_date->age;
        }
        return null;
    }
}
