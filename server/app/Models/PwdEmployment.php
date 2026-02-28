<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PwdEmployment extends Model
{
    use HasFactory;

    protected $table = 'pwd_employment';

    protected $fillable = [
        'pwd_profile_id',
        'status',
        'category',
        'type',
        'occupation',
    ];

    /**
     * Get the PWD profile.
     */
    public function pwdProfile()
    {
        return $this->belongsTo(PwdProfile::class);
    }
}
