<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * PWD organization affiliation
     */
    public function up(): void
    {
        Schema::create('pwd_organizations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pwd_profile_id')->constrained('pwd_profiles')->onDelete('cascade');
            $table->string('organization_name')->nullable();
            $table->string('contact_person')->nullable();
            $table->text('address')->nullable();
            $table->string('telephone')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pwd_organizations');
    }
};
