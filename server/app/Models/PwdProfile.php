<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PwdProfile extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'pwd_number',
        'first_name',
        'last_name',
        'middle_name',
        'suffix',
        'date_applied',
        'date_approved',
        'expiry_date',
        'status',
        'current_version',
        'remarks',
        'accessibility_needs',
        'service_needs',
        'card_printed',
        'card_printed_at',
    ];

    protected $casts = [
        'date_applied' => 'date',
        'date_approved' => 'date',
        'expiry_date' => 'date',
        'current_version' => 'integer',
        'accessibility_needs' => 'string',
        'service_needs' => 'string',
        'card_printed' => 'boolean',
        'card_printed_at' => 'datetime',
    ];

    /**
     * Get the full name of the PWD.
     */
    public function getFullNameAttribute(): string
    {
        $name = $this->first_name;
        if ($this->middle_name) {
            $name .= ' ' . $this->middle_name;
        }
        $name .= ' ' . $this->last_name;
        if ($this->suffix) {
            $name .= ' ' . $this->suffix;
        }
        return $name;
    }

    /**
     * Get the age of the PWD based on birth date.
     */
    public function getAgeAttribute(): ?int
    {
        if ($this->personalInfo && $this->personalInfo->birth_date) {
            return $this->personalInfo->birth_date->age;
        }
        return null;
    }

    /**
     * Get personal information.
     */
    public function personalInfo()
    {
        return $this->hasOne(PwdPersonalInfo::class);
    }

    /**
     * Get address information.
     */
    public function address()
    {
        return $this->hasOne(PwdAddress::class);
    }

    /**
     * Get contact information.
     */
    public function contacts()
    {
        return $this->hasOne(PwdContact::class);
    }

    /**
     * Get disabilities (one-to-many).
     */
    public function disabilities()
    {
        return $this->hasMany(PwdDisability::class);
    }

    /**
     * Get primary disability.
     */
    public function primaryDisability()
    {
        return $this->hasOne(PwdDisability::class)->where('is_primary', true);
    }

    /**
     * Find the user account associated with this PWD profile.
     */
    public function findUser()
    {
        // Try matching by PWD number to User's id_number
        if ($this->pwd_number) {
            $user = User::where('id_number', $this->pwd_number)->first();
            if ($user) return $user;
        }

        // Try matching via pending registration user_id
        $pending = $this->pendingRegistration;
        if ($pending && $pending->user_id) {
            $user = User::find($pending->user_id);
            if ($user) return $user;
        }

        return null;
    }

    /**
     * Check if this profile was applied online (has a pending registration with a user_id).
     */
    public function isAppliedOnline(): bool
    {
        return $this->pendingRegistration && $this->pendingRegistration->user_id !== null;
    }

    /**
     * Get employment information.
     */
    public function employment()
    {
        return $this->hasOne(PwdEmployment::class);
    }

    /**
     * Get education information.
     */
    public function education()
    {
        return $this->hasOne(PwdEducation::class);
    }

    /**
     * Get family members.
     */
    public function familyMembers()
    {
        return $this->hasMany(PwdFamily::class);
    }

    /**
     * Get government IDs.
     */
    public function governmentIds()
    {
        return $this->hasMany(PwdGovernmentId::class);
    }

    /**
     * Get household information.
     */
    public function householdInfo()
    {
        return $this->hasOne(PwdHouseholdInfo::class);
    }

    /**
     * Get organization affiliation.
     */
    public function organization()
    {
        return $this->hasOne(PwdOrganization::class);
    }

    /**
     * Get profile versions (history).
     */
    public function versions()
    {
        return $this->hasMany(PwdProfileVersion::class)->orderBy('version_number', 'desc');
    }

    /**
     * Get pending registration.
     */
    public function pendingRegistration()
    {
        return $this->hasOne(PendingRegistration::class);
    }

    /**
     * Load all related data for complete profile.
     */
    public function loadFullProfile(): self
    {
        return $this->load([
            'personalInfo',
            'address.barangay',
            'contacts',
            'disabilities.disabilityType',
            'employment',
            'education',
            'familyMembers',
            'governmentIds',
            'householdInfo',
            'organization',
        ]);
    }

    /**
     * Create a snapshot of the current profile for versioning.
     */
    public function createSnapshot(): array
    {
        $this->loadFullProfile();
        return $this->toArray();
    }
}
