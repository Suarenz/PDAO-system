<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IdCardTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'template_name',
        'side',
        'styles',
        'image_path',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'styles'    => 'array',
        'is_active' => 'boolean',
    ];

    /* ---- Relationships ---- */

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /* ---- Scopes ---- */

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeFront($query)
    {
        return $query->where('side', 'front');
    }

    public function scopeBack($query)
    {
        return $query->where('side', 'back');
    }
}
