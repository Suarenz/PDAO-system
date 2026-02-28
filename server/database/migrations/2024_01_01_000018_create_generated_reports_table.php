<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Generated reports - tracks all generated PDF/Excel reports
     */
    public function up(): void
    {
        Schema::create('generated_reports', function (Blueprint $table) {
            $table->id();
            $table->string('file_name');
            $table->string('file_path');
            $table->enum('file_type', ['PDF', 'EXCEL'])->default('EXCEL');
            $table->enum('report_type', [
                'YOUTH_PWD',
                'DILG_FORMAT',
                'LGU_COMPLIANCE',
                'MASTERLIST',
                'CUSTOM'
            ]);
            $table->string('size')->nullable();
            $table->json('parameters')->nullable(); // Filters/params used to generate
            $table->foreignId('generated_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            // Indexes
            $table->index('report_type');
            $table->index('generated_by');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('generated_reports');
    }
};
