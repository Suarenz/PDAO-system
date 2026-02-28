<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PwdAddress extends Model
{
    use HasFactory;

    protected $fillable = [
        'pwd_profile_id',
        'house_street',
        'barangay_id',
        'city',
        'province',
        'region',
    ];

    /**
     * Get the PWD profile.
     */
    public function pwdProfile()
    {
        return $this->belongsTo(PwdProfile::class);
    }

    /**
     * Get the barangay.
     */
    public function barangay()
    {
        return $this->belongsTo(Barangay::class);
    }

    /**
     * Get full address string.
     */
    public function getFullAddressAttribute(): string
    {
        $parts = [];
        
        if ($this->house_street) {
            $parts[] = $this->house_street;
        }
        if ($this->barangay) {
            $parts[] = $this->barangay->name;
        }
        if ($this->city) {
            $parts[] = $this->city;
        }
        if ($this->province) {
            $parts[] = $this->province;
        }
        if ($this->region) {
            $parts[] = $this->region;
        }
        
        return implode(', ', $parts);
    }
}
