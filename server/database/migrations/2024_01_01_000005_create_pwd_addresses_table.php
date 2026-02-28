<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * PWD address/residence information
     */
    public function up(): void
    {
        Schema::create('pwd_addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pwd_profile_id')->constrained('pwd_profiles')->onDelete('cascade');
            $table->string('house_street')->nullable();
            $table->foreignId('barangay_id')->nullable()->constrained('barangays')->onDelete('set null');
            $table->string('city')->default('Pagsanjan');
            $table->string('province')->default('Laguna');
            $table->string('region')->default('Region 4A');
            $table->timestamps();

            // Indexes
            $table->index('barangay_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pwd_addresses');
    }
};
