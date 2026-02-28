<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * PWD contact information
     */
    public function up(): void
    {
        Schema::create('pwd_contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pwd_profile_id')->constrained('pwd_profiles')->onDelete('cascade');
            $table->string('mobile')->nullable();
            $table->string('landline')->nullable();
            $table->string('email')->nullable();
            $table->string('guardian_contact')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('mobile');
            $table->index('email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pwd_contacts');
    }
};
