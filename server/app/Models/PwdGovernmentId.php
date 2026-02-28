<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PwdGovernmentId extends Model
{
    use HasFactory;

    protected $fillable = [
        'pwd_profile_id',
        'id_type',
        'id_number',
    ];

    /**
     * Get the PWD profile.
     */
    public function pwdProfile()
    {
        return $this->belongsTo(PwdProfile::class);
    }
}
