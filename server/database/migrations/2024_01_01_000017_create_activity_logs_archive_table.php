<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Activity logs archive - monthly archived audit logs (7-year retention)
     */
    public function up(): void
    {
        Schema::create('activity_logs_archive', function (Blueprint $table) {
            $table->id();
            $table->string('archive_month', 7); // Format: YYYY-MM
            $table->unsignedBigInteger('original_id'); // Original activity_logs.id
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('action_type');
            $table->string('model_type')->nullable();
            $table->unsignedBigInteger('model_id')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->text('description')->nullable();
            $table->timestamp('original_created_at');
            $table->timestamps();

            // Indexes
            $table->index('archive_month');
            $table->index('user_id');
            $table->index('action_type');
            $table->index(['model_type', 'model_id']);
            $table->index('original_created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs_archive');
    }
};
