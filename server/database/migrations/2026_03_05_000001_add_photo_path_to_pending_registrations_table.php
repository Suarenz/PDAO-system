<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds photo_path to pending_registrations for 1x1 applicant photo uploaded via online portal.
     */
    public function up(): void
    {
        Schema::table('pending_registrations', function (Blueprint $table) {
            $table->string('photo_path')->nullable()->after('review_notes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pending_registrations', function (Blueprint $table) {
            $table->dropColumn('photo_path');
        });
    }
};
