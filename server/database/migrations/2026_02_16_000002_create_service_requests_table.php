<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('pwd_profile_id')->nullable()->constrained()->onDelete('set null');
            $table->enum('type', ['LOST_ID', 'DAMAGED_ID', 'RENEWAL']);
            $table->enum('status', ['PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED'])->default('PENDING');
            $table->text('notes')->nullable();
            $table->string('affidavit_path')->nullable();
            $table->text('admin_notes')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_requests');
    }
};
