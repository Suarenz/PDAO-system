<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PwdOrganization extends Model
{
    use HasFactory;

    protected $fillable = [
        'pwd_profile_id',
        'organization_name',
        'contact_person',
        'address',
        'telephone',
    ];

    /**
     * Get the PWD profile.
     */
    public function pwdProfile()
    {
        return $this->belongsTo(PwdProfile::class);
    }
}
