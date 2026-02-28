<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('id_card_templates', function (Blueprint $table) {
            $table->id();
            $table->string('template_name')->default('Default');
            $table->enum('side', ['front', 'back']);
            $table->json('styles'); // JSON array of { id, label, top%, left%, fontSize(cqw), maxWidth% }
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['side', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('id_card_templates');
    }
};
