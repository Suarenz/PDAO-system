<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('pwd_profiles', function (Blueprint $table) {
            $table->text('accessibility_needs')->nullable()->after('remarks');
            $table->text('service_needs')->nullable()->after('accessibility_needs');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pwd_profiles', function (Blueprint $table) {
            $table->dropColumn('accessibility_needs');
            $table->dropColumn('service_needs');
        });
    }
};
