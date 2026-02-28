<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PwdEducation extends Model
{
    use HasFactory;

    protected $table = 'pwd_education';

    protected $fillable = [
        'pwd_profile_id',
        'attainment',
    ];

    /**
     * Get the PWD profile.
     */
    public function pwdProfile()
    {
        return $this->belongsTo(PwdProfile::class);
    }
}
