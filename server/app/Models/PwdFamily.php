<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PwdFamily extends Model
{
    use HasFactory;

    protected $table = 'pwd_family';

    protected $fillable = [
        'pwd_profile_id',
        'relation_type',
        'first_name',
        'last_name',
        'middle_name',
        'age',
    ];

    protected $casts = [
        'age' => 'integer',
    ];

    /**
     * Get the PWD profile.
     */
    public function pwdProfile()
    {
        return $this->belongsTo(PwdProfile::class);
    }

    /**
     * Get the full name of the family member.
     */
    public function getFullNameAttribute(): string
    {
        $name = $this->first_name ?? '';
        if ($this->middle_name) {
            $name .= ' ' . $this->middle_name;
        }
        if ($this->last_name) {
            $name .= ' ' . $this->last_name;
        }
        return trim($name);
    }
}
