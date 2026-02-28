<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update employment status enum to include lowercase variation if needed, 
        // or just ensure both forms are supported.
        // In MySQL, to update an enum, we usually just change the column definition.

        // PWD Employment Status
        Schema::table('pwd_employment', function (Blueprint $table) {
            $table->string('status')->nullable()->change();
        });

        // Personal Info Civil Status
        Schema::table('pwd_personal_info', function (Blueprint $table) {
            $table->string('civil_status')->nullable()->change();
        });

        // Disabilities Cause
        Schema::table('pwd_disabilities', function (Blueprint $table) {
            $table->string('cause')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pwd_employment', function (Blueprint $table) {
            $table->enum('status', ['Employed', 'Unemployed', 'Self-Employed'])->nullable()->change();
        });

        Schema::table('pwd_personal_info', function (Blueprint $table) {
            $table->enum('civil_status', ['Single', 'Married', 'Widowed', 'Separated', 'Divorced'])->nullable()->change();
        });

        Schema::table('pwd_disabilities', function (Blueprint $table) {
            $table->enum('cause', ['Acquired', 'Congenital'])->nullable()->change();
        });
    }
};
