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
        // Using raw SQL for MySQL to modify the ENUM column
        DB::statement("ALTER TABLE pwd_profiles MODIFY COLUMN status ENUM('ACTIVE', 'INACTIVE', 'DECEASED', 'PENDING', 'UNDER_REVIEW') DEFAULT 'ACTIVE'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE pwd_profiles MODIFY COLUMN status ENUM('ACTIVE', 'INACTIVE', 'DECEASED') DEFAULT 'ACTIVE'");
    }
};
