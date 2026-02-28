<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Change attainment from enum to varchar to allow more flexible values
     */
    public function up(): void
    {
        // For MySQL, we need to modify the column type
        DB::statement("ALTER TABLE pwd_education MODIFY attainment VARCHAR(255) NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to enum (note: data might be lost if values don't match)
        DB::statement("ALTER TABLE pwd_education MODIFY attainment ENUM('None', 'Elementary', 'Highschool', 'High School Education', 'College', 'Postgraduate', 'Non-formal', 'Vocational') NULL");
    }
};
