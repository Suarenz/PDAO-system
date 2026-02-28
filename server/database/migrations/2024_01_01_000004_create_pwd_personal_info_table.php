<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * PWD demographic information
     */
    public function up(): void
    {
        Schema::create('pwd_personal_info', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pwd_profile_id')->constrained('pwd_profiles')->onDelete('cascade');
            $table->date('birth_date')->nullable();
            $table->string('birth_place')->nullable();
            $table->enum('sex', ['Male', 'Female'])->nullable();
            $table->string('religion')->nullable();
            $table->string('ethnic_group')->nullable();
            $table->enum('civil_status', ['Single', 'Married', 'Widowed', 'Separated', 'Divorced'])->nullable();
            $table->enum('blood_type', ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'])->nullable();
            $table->timestamps();

            // Indexes
            $table->index('birth_date');
            $table->index('sex');
            $table->index('civil_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pwd_personal_info');
    }
};
