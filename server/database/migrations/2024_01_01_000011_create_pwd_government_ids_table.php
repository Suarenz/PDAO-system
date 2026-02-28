<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * PWD government IDs - one-to-many relationship (SSS, GSIS, PhilHealth, Pag-IBIG)
     */
    public function up(): void
    {
        Schema::create('pwd_government_ids', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pwd_profile_id')->constrained('pwd_profiles')->onDelete('cascade');
            $table->enum('id_type', ['SSS', 'GSIS', 'PhilHealth', 'Pag-IBIG']);
            $table->string('id_number');
            $table->timestamps();

            // Indexes
            $table->index(['pwd_profile_id', 'id_type']);
            $table->index('id_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pwd_government_ids');
    }
};
