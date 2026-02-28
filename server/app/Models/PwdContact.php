<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PwdContact extends Model
{
    use HasFactory;

    protected $fillable = [
        'pwd_profile_id',
        'mobile',
        'landline',
        'email',
        'guardian_contact',
    ];

    /**
     * Get the PWD profile.
     */
    public function pwdProfile()
    {
        return $this->belongsTo(PwdProfile::class);
    }
}
