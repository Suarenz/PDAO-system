<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barangay;
use App\Models\DisabilityType;
use App\Models\PwdProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MayorDashboardController extends Controller
{
    /**
     * Executive summary endpoint that aggregates all key data the Mayor needs
     * in a single API call, avoiding multiple round-trips.
     */
    public function executiveSummary(Request $request): JsonResponse
    {
        return response()->json([
            'overview'               => $this->getOverview(),
            'barangay_distribution'  => $this->getBarangayDistribution(),
            'disability_distribution'=> $this->getDisabilityDistribution(),
            'gender_distribution'    => $this->getGenderDistribution(),
            'age_demographics'       => $this->getAgeDemographics(),
            'monthly_trend'          => $this->getMonthlyTrend(),
            'service_requests_summary' => $this->getServiceRequestsSummary(),
            'appointments_summary'   => $this->getAppointmentsSummary(),
        ]);
    }

    /**
     * Overview statistics: totals, gender, employment, pending approvals.
     */
    private function getOverview(): array
    {
        $counts = DB::selectOne("
            SELECT
                COUNT(*) AS total_pwd,
                SUM(CASE WHEN pp.status = 'ACTIVE' THEN 1 ELSE 0 END) AS active_count,
                SUM(CASE WHEN pp.status = 'DECEASED' THEN 1 ELSE 0 END) AS deceased_count,
                SUM(CASE WHEN pp.status = 'ACTIVE'
                    AND pp.created_at >= DATE_FORMAT(NOW(), '%Y-%m-01') THEN 1 ELSE 0 END) AS new_this_month,
                SUM(CASE WHEN pp.status = 'ACTIVE'
                    AND pp.created_at >= DATE_FORMAT(NOW(), '%Y-01-01') THEN 1 ELSE 0 END) AS new_this_year
            FROM pwd_profiles pp
            WHERE pp.status IN ('ACTIVE', 'DECEASED')
              AND pp.deleted_at IS NULL
        ");

        $gender = DB::select("
            SELECT
                pi.sex AS name,
                COUNT(*) AS count
            FROM pwd_profiles pp
            JOIN pwd_personal_info pi ON pi.pwd_profile_id = pp.id
            WHERE pp.status IN ('ACTIVE', 'DECEASED')
              AND pp.deleted_at IS NULL
            GROUP BY pi.sex
        ");

        $maleCount = 0;
        $femaleCount = 0;
        foreach ($gender as $row) {
            $sex = strtoupper(trim($row->name ?? ''));
            if ($sex === 'MALE') {
                $maleCount = (int) $row->count;
            } elseif ($sex === 'FEMALE') {
                $femaleCount = (int) $row->count;
            }
        }

        $employment = DB::selectOne("
            SELECT
                COUNT(*) AS employed_count
            FROM pwd_profiles pp
            JOIN pwd_employment pe ON pe.pwd_profile_id = pp.id
            WHERE pp.status IN ('ACTIVE', 'DECEASED')
              AND pp.deleted_at IS NULL
              AND UPPER(pe.status) = 'EMPLOYED'
        ");

        $pendingApprovals = DB::selectOne("
            SELECT COUNT(*) AS total
            FROM pending_registrations
            WHERE status = 'PENDING'
        ");

        $totalPwd = (int) $counts->total_pwd;
        $employedCount = (int) $employment->employed_count;

        return [
            'total_pwd'         => $totalPwd,
            'active_count'      => (int) $counts->active_count,
            'deceased_count'    => (int) $counts->deceased_count,
            'new_this_month'    => (int) $counts->new_this_month,
            'new_this_year'     => (int) $counts->new_this_year,
            'male_count'        => $maleCount,
            'female_count'      => $femaleCount,
            'pending_approvals' => (int) $pendingApprovals->total,
            'employed_count'    => $employedCount,
            'employment_rate'   => $totalPwd > 0
                ? round(($employedCount / $totalPwd) * 100, 2)
                : 0,
        ];
    }

    /**
     * Barangay distribution sorted by count descending (for heatmap).
     */
    private function getBarangayDistribution(): array
    {
        $rows = DB::select("
            SELECT b.name, COUNT(*) AS count
            FROM pwd_profiles pp
            JOIN pwd_addresses pa ON pa.pwd_profile_id = pp.id
            JOIN barangays b ON b.id = pa.barangay_id
            WHERE pp.status IN ('ACTIVE', 'DECEASED')
              AND pp.deleted_at IS NULL
            GROUP BY b.id, b.name
            ORDER BY count DESC
        ");

        return array_map(fn ($row) => [
            'name'  => $row->name,
            'count' => (int) $row->count,
        ], $rows);
    }

    /**
     * Disability type distribution sorted by count descending.
     */
    private function getDisabilityDistribution(): array
    {
        $rows = DB::select("
            SELECT dt.name, COUNT(*) AS count
            FROM pwd_profiles pp
            JOIN pwd_disabilities pd ON pd.pwd_profile_id = pp.id
            JOIN disability_types dt ON dt.id = pd.disability_type_id
            WHERE pp.status IN ('ACTIVE', 'DECEASED')
              AND pp.deleted_at IS NULL
            GROUP BY dt.id, dt.name
            ORDER BY count DESC
        ");

        return array_map(fn ($row) => [
            'name'  => $row->name,
            'count' => (int) $row->count,
        ], $rows);
    }

    /**
     * Gender distribution (Male / Female).
     */
    private function getGenderDistribution(): array
    {
        $rows = DB::select("
            SELECT pi.sex AS name, COUNT(*) AS count
            FROM pwd_profiles pp
            JOIN pwd_personal_info pi ON pi.pwd_profile_id = pp.id
            WHERE pp.status IN ('ACTIVE', 'DECEASED')
              AND pp.deleted_at IS NULL
            GROUP BY pi.sex
        ");

        return array_map(fn ($row) => [
            'name'  => $row->name,
            'count' => (int) $row->count,
        ], $rows);
    }

    /**
     * Age demographics using NCDA/DOH categories for executive reporting:
     * Children (0-17), Youth (18-24), Working Age (25-59), Senior Citizens (60+).
     */
    private function getAgeDemographics(): array
    {
        $rows = DB::select("
            SELECT
                CASE
                    WHEN TIMESTAMPDIFF(YEAR, pi.birth_date, CURDATE()) BETWEEN 0 AND 17
                        THEN 'Children (0-17)'
                    WHEN TIMESTAMPDIFF(YEAR, pi.birth_date, CURDATE()) BETWEEN 18 AND 24
                        THEN 'Youth (18-24)'
                    WHEN TIMESTAMPDIFF(YEAR, pi.birth_date, CURDATE()) BETWEEN 25 AND 59
                        THEN 'Working Age (25-59)'
                    ELSE 'Senior Citizens (60+)'
                END AS name,
                COUNT(*) AS count
            FROM pwd_profiles pp
            JOIN pwd_personal_info pi ON pi.pwd_profile_id = pp.id
            WHERE pp.status IN ('ACTIVE', 'DECEASED')
              AND pp.deleted_at IS NULL
              AND pi.birth_date IS NOT NULL
            GROUP BY name
            ORDER BY FIELD(name,
                'Children (0-17)',
                'Youth (18-24)',
                'Working Age (25-59)',
                'Senior Citizens (60+)')
        ");

        return array_map(fn ($row) => [
            'name'  => $row->name,
            'count' => (int) $row->count,
        ], $rows);
    }

    /**
     * Monthly registration trend for the current year.
     */
    private function getMonthlyTrend(): array
    {
        $rows = DB::select("
            SELECT
                DATE_FORMAT(pp.created_at, '%Y-%m') AS month,
                COUNT(*) AS count
            FROM pwd_profiles pp
            WHERE pp.status IN ('ACTIVE', 'DECEASED')
              AND pp.deleted_at IS NULL
              AND YEAR(pp.created_at) = YEAR(CURDATE())
            GROUP BY month
            ORDER BY month ASC
        ");

        return array_map(fn ($row) => [
            'month' => $row->month,
            'count' => (int) $row->count,
        ], $rows);
    }

    /**
     * Service requests summary: total, pending, completed.
     */
    private function getServiceRequestsSummary(): array
    {
        $row = DB::selectOne("
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN status IN ('PENDING', 'IN_PROGRESS') THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed
            FROM service_requests
        ");

        return [
            'total'     => (int) $row->total,
            'pending'   => (int) $row->pending,
            'completed' => (int) $row->completed,
        ];
    }

    /**
     * Appointments summary: total, upcoming, completed.
     */
    private function getAppointmentsSummary(): array
    {
        $row = DB::selectOne("
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'SCHEDULED' AND appointment_date >= CURDATE() THEN 1 ELSE 0 END) AS upcoming,
                SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed
            FROM appointments
        ");

        return [
            'total'     => (int) $row->total,
            'upcoming'  => (int) $row->upcoming,
            'completed' => (int) $row->completed,
        ];
    }
}
