<?php

namespace App\Observers;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;

class AuditObserver
{
    /**
     * Handle the Model "created" event.
     */
    public function created(Model $model): void
    {
        $this->logActivity('created', $model, null, $model->toArray());
    }

    /**
     * Handle the Model "updated" event.
     */
    public function updated(Model $model): void
    {
        $oldValues = $model->getOriginal();
        $newValues = $model->getChanges();
        
        // Remove timestamps from tracked changes
        unset($newValues['updated_at']);
        
        if (!empty($newValues)) {
            // Only keep old values for fields that were changed
            $trackedOldValues = array_intersect_key($oldValues, $newValues);
            $this->logActivity('updated', $model, $trackedOldValues, $newValues);
        }
    }

    /**
     * Handle the Model "deleted" event.
     */
    public function deleted(Model $model): void
    {
        $this->logActivity('deleted', $model, $model->toArray(), null);
    }

    /**
     * Handle the Model "restored" event.
     */
    public function restored(Model $model): void
    {
        $this->logActivity('restored', $model, null, $model->toArray());
    }

    /**
     * Handle the Model "forceDeleted" event.
     */
    public function forceDeleted(Model $model): void
    {
        $this->logActivity('deleted', $model, $model->toArray(), null, 'Permanently deleted');
    }

    /**
     * Log the activity to the database.
     */
    protected function logActivity(
        string $actionType,
        Model $model,
        ?array $oldValues,
        ?array $newValues,
        ?string $description = null
    ): void {
        // Don't log ActivityLog changes to prevent infinite loop
        if ($model instanceof ActivityLog) {
            return;
        }

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action_type' => $actionType,
            'model_type' => get_class($model),
            'model_id' => $model->getKey(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'description' => $description ?? $this->generateDescription($actionType, $model),
        ]);
    }

    /**
     * Generate a human-readable description.
     */
    protected function generateDescription(string $actionType, Model $model): string
    {
        $modelName = class_basename($model);
        $identifier = $model->getKey();
        
        // Try to get a more descriptive identifier
        if (method_exists($model, 'getFullNameAttribute')) {
            $identifier = $model->full_name;
        } elseif (isset($model->name)) {
            $identifier = $model->name;
        } elseif (isset($model->title)) {
            $identifier = $model->title;
        }

        return ucfirst($actionType) . " {$modelName}: {$identifier}";
    }
}
