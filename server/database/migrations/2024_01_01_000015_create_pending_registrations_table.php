<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Pending registrations - approval queue for new/existing PWD applications
     */
    public function up(): void
    {
        Schema::create('pending_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pwd_profile_id')->constrained('pwd_profiles')->onDelete('cascade');
            $table->enum('submission_type', ['NEW', 'EXISTING', 'RENEWAL'])->default('NEW');
            $table->enum('status', ['PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW'])->default('PENDING');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('status');
            $table->index('submission_type');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pending_registrations');
    }
};
