<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * PWD disabilities - one-to-many relationship (supports multiple disabilities per PWD)
     */
    public function up(): void
    {
        Schema::create('pwd_disabilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pwd_profile_id')->constrained('pwd_profiles')->onDelete('cascade');
            $table->foreignId('disability_type_id')->constrained('disability_types')->onDelete('restrict');
            $table->enum('cause', ['Acquired', 'Congenital'])->nullable();
            $table->text('cause_details')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->timestamps();

            // Indexes
            $table->index(['pwd_profile_id', 'disability_type_id']);
            $table->index('disability_type_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pwd_disabilities');
    }
};
