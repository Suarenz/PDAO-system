<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * PWD educational background
     */
    public function up(): void
    {
        Schema::create('pwd_education', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pwd_profile_id')->constrained('pwd_profiles')->onDelete('cascade');
            $table->enum('attainment', [
                'None',
                'Elementary',
                'Highschool',
                'High School Education',
                'College',
                'Postgraduate',
                'Non-formal',
                'Vocational'
            ])->nullable();
            $table->timestamps();

            // Indexes
            $table->index('attainment');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pwd_education');
    }
};
