<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pwd_profiles', function (Blueprint $table) {
            $table->date('date_approved')->nullable()->after('date_applied');
            $table->date('expiry_date')->nullable()->after('date_approved');
        });

        // Backfill: for any ACTIVE profile that was approved, compute expiry_date
        // Use reviewed_at from pending_registrations where status = APPROVED
        DB::statement("
            UPDATE pwd_profiles p
            LEFT JOIN pending_registrations pr ON pr.pwd_profile_id = p.id AND pr.status = 'APPROVED'
            SET 
                p.date_approved = COALESCE(DATE(pr.reviewed_at), p.date_applied, DATE(p.created_at)),
                p.expiry_date = DATE_ADD(
                    COALESCE(DATE(pr.reviewed_at), p.date_applied, DATE(p.created_at)),
                    INTERVAL 5 YEAR
                )
            WHERE p.status = 'ACTIVE' AND p.expiry_date IS NULL
        ");
    }

    public function down(): void
    {
        Schema::table('pwd_profiles', function (Blueprint $table) {
            $table->dropColumn(['date_approved', 'expiry_date']);
        });
    }
};
