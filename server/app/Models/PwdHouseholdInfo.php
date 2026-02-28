<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PwdHouseholdInfo extends Model
{
    use HasFactory;

    protected $table = 'pwd_household_info';

    protected $fillable = [
        'pwd_profile_id',
        'living_arrangement',
        'receiving_support',
        'is_pensioner',
        'pension_type',
        'monthly_pension',
        'income_source',
        'monthly_income',
    ];

    protected $casts = [
        'receiving_support' => 'boolean',
        'is_pensioner' => 'boolean',
        'monthly_pension' => 'decimal:2',
        'monthly_income' => 'decimal:2',
    ];

    /**
     * Get the PWD profile.
     */
    public function pwdProfile()
    {
        return $this->belongsTo(PwdProfile::class);
    }
}
