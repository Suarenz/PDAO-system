<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Barangay extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get PWD addresses in this barangay.
     */
    public function pwdAddresses()
    {
        return $this->hasMany(PwdAddress::class);
    }

    /**
     * Get count of PWDs in this barangay.
     */
    public function getPwdCountAttribute(): int
    {
        return $this->pwdAddresses()->count();
    }
}
