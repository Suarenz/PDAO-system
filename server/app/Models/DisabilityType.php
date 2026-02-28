<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DisabilityType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get PWD disabilities of this type.
     */
    public function pwdDisabilities()
    {
        return $this->hasMany(PwdDisability::class);
    }

    /**
     * Get count of PWDs with this disability type.
     */
    public function getPwdCountAttribute(): int
    {
        return $this->pwdDisabilities()->count();
    }
}
