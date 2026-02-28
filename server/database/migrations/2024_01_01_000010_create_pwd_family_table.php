<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * PWD family members - one-to-many relationship (father, mother, guardian, spouse)
     */
    public function up(): void
    {
        Schema::create('pwd_family', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pwd_profile_id')->constrained('pwd_profiles')->onDelete('cascade');
            $table->enum('relation_type', ['Father', 'Mother', 'Guardian', 'Spouse']);
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('middle_name')->nullable();
            $table->unsignedInteger('age')->nullable();
            $table->timestamps();

            // Indexes
            $table->index(['pwd_profile_id', 'relation_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pwd_family');
    }
};
