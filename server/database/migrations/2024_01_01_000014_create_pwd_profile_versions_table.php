<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * PWD profile version history - stores snapshots for rollback capability
     */
    public function up(): void
    {
        Schema::create('pwd_profile_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pwd_profile_id')->constrained('pwd_profiles')->onDelete('cascade');
            $table->unsignedInteger('version_number');
            $table->json('snapshot'); // Complete profile data as JSON
            $table->foreignId('changed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->string('change_summary')->nullable();
            $table->timestamp('changed_at');
            $table->timestamps();

            // Indexes
            $table->index(['pwd_profile_id', 'version_number']);
            $table->index('changed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pwd_profile_versions');
    }
};
