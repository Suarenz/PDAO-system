<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * PWD economic information (income, pension, living arrangement)
     */
    public function up(): void
    {
        Schema::create('pwd_economic_info', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pwd_profile_id')->constrained('pwd_profiles')->onDelete('cascade');
            $table->string('living_arrangement')->nullable();
            $table->boolean('receiving_support')->default(false);
            $table->boolean('is_pensioner')->default(false);
            $table->string('pension_type')->nullable();
            $table->decimal('monthly_pension', 12, 2)->nullable();
            $table->string('income_source')->nullable();
            $table->decimal('monthly_income', 12, 2)->nullable();
            $table->timestamps();

            // Indexes
            $table->index('is_pensioner');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pwd_economic_info');
    }
};
