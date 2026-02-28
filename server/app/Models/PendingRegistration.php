<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PendingRegistration extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'pwd_profile_id',
        'user_id',
        'submission_type',
        'status',
        'reviewed_by',
        'reviewed_at',
        'review_notes',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    /**
     * Get the PWD profile.
     */
    public function pwdProfile()
    {
        return $this->belongsTo(PwdProfile::class);
    }

    /**
     * Get the user who owns this registration application.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the user who reviewed this registration.
     */
    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * Scope for pending registrations.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'PENDING');
    }

    /**
     * Scope for approved registrations.
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'APPROVED');
    }

    /**
     * Scope for rejected registrations.
     */
    public function scopeRejected($query)
    {
        return $query->where('status', 'REJECTED');
    }

    /**
     * Approve this registration.
     */
    public function approve(User $reviewer, ?string $notes = null, ?string $pwdNumber = null): bool
    {
        $this->status = 'APPROVED';
        $this->reviewed_by = $reviewer->id;
        $this->reviewed_at = now();
        $this->review_notes = $notes;
        
        // Update PWD profile status to ACTIVE and set PWD number + expiry
        $profileData = [
            'status' => 'ACTIVE',
            'date_approved' => now()->toDateString(),
            'expiry_date' => now()->addYears(5)->toDateString(),
        ];
        if ($pwdNumber) {
            $profileData['pwd_number'] = $pwdNumber;
        }
        $this->pwdProfile->update($profileData);
        
        $result = $this->save();

        // Send notification to the applicant if they have a linked user account
        $this->notifyApplicant(
            'approval',
            'Registration Approved',
            'Your PWD registration has been approved and you are now officially registered in the masterlist.',
            $reviewer
        );

        return $result;
    }

    /**
     * Reject this registration.
     */
    public function reject(User $reviewer, ?string $notes = null): bool
    {
        $this->status = 'REJECTED';
        $this->reviewed_by = $reviewer->id;
        $this->reviewed_at = now();
        $this->review_notes = $notes;
        
        $result = $this->save();

        // Send notification with rejection reason
        $message = 'Your PWD registration has been declined.';
        if ($notes) {
            $message .= ' Reason: ' . $notes;
        }

        $this->notifyApplicant(
            'rejection',
            'Registration Declined',
            $message,
            $reviewer
        );

        return $result;
    }

    /**
     * Mark this registration for review (request changes).
     */
    public function markForReview(User $reviewer, ?string $notes = null): bool
    {
        $this->status = 'UNDER_REVIEW';
        $this->reviewed_by = $reviewer->id;
        $this->reviewed_at = now();
        $this->review_notes = $notes;
        
        $result = $this->save();

        // Send notification for correction request
        $message = 'The administrator has requested changes for your PWD registration application.';
        if ($notes) {
            $message .= ' Remarks: ' . $notes;
        }

        $this->notifyApplicant(
            'correction_request',
            'Changes Required',
            $message,
            $reviewer
        );

        return $result;
    }

    /**
     * Send notification to the applicant.
     */
    protected function notifyApplicant(string $type, string $title, string $message, User $actionBy): void
    {
        $user = null;

        // 1. Try to use the linked user directly
        if ($this->user_id) {
            $user = User::find($this->user_id);
        }

        // 2. Fallback to profile-based matching
        if (!$user && $this->pwdProfile) {
            $user = $this->pwdProfile->findUser();
        }
        
        if ($user) {
            Notification::notify(
                $user->id,
                $type,
                $title,
                $message,
                $actionBy->full_name,
                'pending_registration',
                $this->id
            );
        }
    }
}
