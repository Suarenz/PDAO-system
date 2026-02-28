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
        // Add MAYOR to the role enum in users table
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('ADMIN', 'STAFF', 'ENCODER', 'USER', 'PWD MEMBER', 'MAYOR') DEFAULT 'USER'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to original enum values
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('ADMIN', 'STAFF', 'ENCODER', 'USER', 'PWD MEMBER') DEFAULT 'USER'");
    }
};
