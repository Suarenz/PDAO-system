<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pwd_profiles', function (Blueprint $table) {
            $table->boolean('card_printed')->default(false)->after('service_needs');
            $table->timestamp('card_printed_at')->nullable()->after('card_printed');
        });
    }

    public function down(): void
    {
        Schema::table('pwd_profiles', function (Blueprint $table) {
            $table->dropColumn(['card_printed', 'card_printed_at']);
        });
    }
};
