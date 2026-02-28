<?php

namespace App\Observers;

use App\Models\PwdProfile;
use App\Models\PwdProfileVersion;

class VersionObserver
{
    /**
     * Fields that trigger a new version when changed.
     */
    protected array $versionTriggerFields = [
        'status',
        'pwd_number',
    ];

    /**
     * Related models that trigger versioning when changed.
     */
    protected array $versionTriggerRelations = [
        'disabilities',
        'address',
    ];

    /**
     * Handle the PwdProfile "created" event.
     * Create initial version (version 1).
     */
    public function created(PwdProfile $profile): void
    {
        $this->createVersion($profile, 'Initial registration');
    }

    /**
     * Handle the PwdProfile "updated" event.
     * Create new version if major fields changed.
     */
    public function updated(PwdProfile $profile): void
    {
        $changedFields = array_keys($profile->getChanges());
        
        // Check if any version-triggering fields were changed
        $triggerFields = array_intersect($changedFields, $this->versionTriggerFields);
        
        if (!empty($triggerFields)) {
            $changeSummary = 'Updated: ' . implode(', ', $triggerFields);
            $this->createVersion($profile, $changeSummary);
        }
    }

    /**
     * Create a new version snapshot.
     */
    public function createVersion(PwdProfile $profile, string $changeSummary): void
    {
        // Load full profile data for snapshot
        $profile->loadFullProfile();
        
        $version = new PwdProfileVersion([
            'pwd_profile_id' => $profile->id,
            'version_number' => $profile->current_version,
            'snapshot' => $profile->createSnapshot(),
            'changed_by' => auth()->id(),
            'change_summary' => $changeSummary,
            'changed_at' => now(),
        ]);
        
        $version->save();
        
        // Increment version counter (without triggering observer again)
        PwdProfile::withoutEvents(function () use ($profile) {
            $profile->increment('current_version');
        });
    }

    /**
     * Create version when disabilities are modified.
     * This should be called from the controller after disability changes.
     */
    public static function versionOnDisabilityChange(PwdProfile $profile): void
    {
        $observer = new self();
        $observer->createVersion($profile, 'Updated: disabilities');
    }

    /**
     * Create version when address is modified.
     * This should be called from the controller after address changes.
     */
    public static function versionOnAddressChange(PwdProfile $profile): void
    {
        $observer = new self();
        $observer->createVersion($profile, 'Updated: address');
    }
}
