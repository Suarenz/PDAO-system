<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * PWD employment information
     */
    public function up(): void
    {
        Schema::create('pwd_employment', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pwd_profile_id')->constrained('pwd_profiles')->onDelete('cascade');
            $table->enum('status', ['Employed', 'Unemployed', 'Self-Employed'])->nullable();
            $table->string('category')->nullable(); // Government, Private, etc.
            $table->string('type')->nullable(); // Permanent, Temporary, Casual, etc.
            $table->string('occupation')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pwd_employment');
    }
};
