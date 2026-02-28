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
        Schema::table('generated_reports', function (Blueprint $table) {
            $table->string('report_type')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('generated_reports', function (Blueprint $table) {
            $table->enum('report_type', [
                'YOUTH_PWD',
                'DILG_FORMAT',
                'LGU_COMPLIANCE',
                'MASTERLIST',
                'CUSTOM'
            ])->change();
        });
    }
};
