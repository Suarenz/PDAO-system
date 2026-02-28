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
        Schema::table('activity_logs', function (Blueprint $table) {
            DB::statement("ALTER TABLE activity_logs MODIFY COLUMN action_type ENUM('login', 'logout', 'register', 'created', 'updated', 'deleted', 'restored', 'approved', 'rejected', 'exported', 'imported', 'backup', 'restore') NOT NULL");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            DB::statement("ALTER TABLE activity_logs MODIFY COLUMN action_type ENUM('login', 'logout', 'created', 'updated', 'deleted', 'restored', 'approved', 'rejected', 'exported', 'imported', 'backup', 'restore') NOT NULL");
        });
    }
};
