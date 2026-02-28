<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Core PWD identity table - main profile information
     */
    public function up(): void
    {
        Schema::create('pwd_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('pwd_number')->nullable()->unique();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('middle_name')->nullable();
            $table->string('suffix')->nullable();
            $table->date('date_applied')->nullable();
            $table->enum('status', ['ACTIVE', 'INACTIVE', 'DECEASED'])->default('ACTIVE');
            $table->unsignedInteger('current_version')->default(1);
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('status');
            $table->index('last_name');
            $table->index('first_name');
            $table->index('date_applied');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pwd_profiles');
    }
};
