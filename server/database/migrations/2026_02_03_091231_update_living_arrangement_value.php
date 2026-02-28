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
        // Update values in existing table
        DB::table('pwd_economic_info')
            ->where('living_arrangement', 'Living with Relatives')
            ->update(['living_arrangement' => 'Living with Family']);

        // Rename table
        Schema::rename('pwd_economic_info', 'pwd_household_info');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Rename table back
        Schema::rename('pwd_household_info', 'pwd_economic_info');

        // Restore values
        DB::table('pwd_economic_info')
            ->where('living_arrangement', 'Living with Family')
            ->update(['living_arrangement' => 'Living with Relatives']);
    }
};
