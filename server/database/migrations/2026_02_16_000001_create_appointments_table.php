<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('pwd_profile_id')->nullable()->constrained()->onDelete('set null');
            $table->date('appointment_date');
            $table->string('appointment_time');
            $table->enum('status', ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])->default('SCHEDULED');
            $table->string('proxy_name')->nullable();
            $table->string('proxy_relationship')->nullable();
            $table->text('notes')->nullable();
            $table->text('admin_notes')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
