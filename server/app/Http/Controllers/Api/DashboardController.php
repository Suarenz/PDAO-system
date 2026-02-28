<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barangay;
use App\Models\DisabilityType;
use App\Models\PwdProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Extract common filter parameters from the request.
     */
    private function getFilterParams(Request $request): array
    {
        return [
            'barangay' => $request->get('barangay'),
            'year' => $request->get('year'),
            'disability_type' => $request->get('disability_type'),
        ];
    }

    /**
     * Apply common filters to a query builder that starts from pwd_profiles.
     * Expects the query to already have pwd_profiles accessible.
     */
    private function applyFilters($query, array $filters, string $profileTable = 'pwd_profiles')
    {
        if (!empty($filters['barangay'])) {
            $barangayName = $filters['barangay'];
            $query->whereExists(function ($sub) use ($barangayName, $profileTable) {
                $sub->select(DB::raw(1))
                    ->from('pwd_addresses')
                    ->join('barangays', 'pwd_addresses.barangay_id', '=', 'barangays.id')
                    ->whereColumn('pwd_addresses.pwd_profile_id', "{$profileTable}.id")
                    ->where('barangays.name', $barangayName);
            });
        }

        if (!empty($filters['year'])) {
            $query->whereYear("{$profileTable}.date_applied", $filters['year']);
        }

        if (!empty($filters['disability_type'])) {
            $disabilityName = $filters['disability_type'];
            $query->whereExists(function ($sub) use ($disabilityName, $profileTable) {
                $sub->select(DB::raw(1))
                    ->from('pwd_disabilities')
                    ->join('disability_types', 'pwd_disabilities.disability_type_id', '=', 'disability_types.id')
                    ->whereColumn('pwd_disabilities.pwd_profile_id', "{$profileTable}.id")
                    ->where('disability_types.name', $disabilityName);
            });
        }

        return $query;
    }

    /**
     * Get dashboard statistics
     */
    public function stats(Request $request): JsonResponse
    {
        $filters = $this->getFilterParams($request);

        // Build base query with filters
        $baseQuery = PwdProfile::query()
            ->where('status', 'ACTIVE')
            ->whereNull('deleted_at');

        $baseQuery = $this->applyFilters($baseQuery, $filters);

        // Total PWDs
        $totalPwd = (clone $baseQuery)->count();

        // Employed count
        $employedCount = (clone $baseQuery)
            ->whereHas('employment', fn($q) => $q->where('status', 'Employed'))
            ->count();

        // Deceased count (also filtered)
        $deceasedQuery = PwdProfile::query()
            ->where('status', 'DECEASED')
            ->whereNull('deleted_at');
        $deceasedQuery = $this->applyFilters($deceasedQuery, $filters);
        $deceasedCount = $deceasedQuery->count();

        // New registrations this month
        $newThisMonth = PwdProfile::where('status', 'ACTIVE')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        // Pending approvals
        $pendingApprovals = DB::table('pending_registrations')
            ->where('status', 'PENDING')
            ->count();

        // Total PWD status count (Active + Deceased)
        $totalPwdTotal = $totalPwd + $deceasedCount;

        return response()->json([
            'success' => true,
            'data' => [
                'total_pwd' => $totalPwdTotal,
                'new_this_month' => $newThisMonth,
                'pending_approvals' => $pendingApprovals,
                'active_count' => $totalPwd,
                'employed_count' => $employedCount,
                'deceased_count' => $deceasedCount,
            ],
        ]);
    }

    /**
     * Get PWD count by barangay
     */
    public function byBarangay(Request $request): JsonResponse
    {
        $filters = $this->getFilterParams($request);

        $query = Barangay::select('barangays.name')
            ->selectRaw('COUNT(pwd_profiles.id) as count')
            ->leftJoin('pwd_addresses', 'barangays.id', '=', 'pwd_addresses.barangay_id')
            ->leftJoin('pwd_profiles', function ($join) {
                $join->on('pwd_addresses.pwd_profile_id', '=', 'pwd_profiles.id')
                     ->whereIn('pwd_profiles.status', ['ACTIVE', 'DECEASED'])
                     ->whereNull('pwd_profiles.deleted_at');
            });

        // Apply year filter
        if (!empty($filters['year'])) {
            $query->where(function ($q) use ($filters) {
                $q->whereNull('pwd_profiles.id')
                  ->orWhereYear('pwd_profiles.date_applied', $filters['year']);
            });
        }

        // Apply disability type filter
        if (!empty($filters['disability_type'])) {
            $query->where(function ($q) use ($filters) {
                $q->whereNull('pwd_profiles.id')
                  ->orWhereExists(function ($sub) use ($filters) {
                      $sub->select(DB::raw(1))
                          ->from('pwd_disabilities')
                          ->join('disability_types', 'pwd_disabilities.disability_type_id', '=', 'disability_types.id')
                          ->whereColumn('pwd_disabilities.pwd_profile_id', 'pwd_profiles.id')
                          ->where('disability_types.name', $filters['disability_type']);
                  });
            });
        }

        $data = $query->groupBy('barangays.id', 'barangays.name')
            ->orderBy('count', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Get PWD count by disability type
     */
    public function byDisabilityType(Request $request): JsonResponse
    {
        $filters = $this->getFilterParams($request);

        $query = DisabilityType::select('disability_types.name')
            ->selectRaw('COUNT(pwd_profiles.id) as count')
            ->leftJoin('pwd_disabilities', 'disability_types.id', '=', 'pwd_disabilities.disability_type_id')
            ->leftJoin('pwd_profiles', function ($join) {
                $join->on('pwd_disabilities.pwd_profile_id', '=', 'pwd_profiles.id')
                     ->whereIn('pwd_profiles.status', ['ACTIVE', 'DECEASED'])
                     ->whereNull('pwd_profiles.deleted_at');
            });

        // Apply barangay filter
        if (!empty($filters['barangay'])) {
            $query->where(function ($q) use ($filters) {
                $q->whereNull('pwd_profiles.id')
                  ->orWhereExists(function ($sub) use ($filters) {
                      $sub->select(DB::raw(1))
                          ->from('pwd_addresses')
                          ->join('barangays', 'pwd_addresses.barangay_id', '=', 'barangays.id')
                          ->whereColumn('pwd_addresses.pwd_profile_id', 'pwd_profiles.id')
                          ->where('barangays.name', $filters['barangay']);
                  });
            });
        }

        // Apply year filter
        if (!empty($filters['year'])) {
            $query->where(function ($q) use ($filters) {
                $q->whereNull('pwd_profiles.id')
                  ->orWhereYear('pwd_profiles.date_applied', $filters['year']);
            });
        }

        $data = $query->groupBy('disability_types.id', 'disability_types.name')
            ->orderBy('count', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Get PWD count by age group
     */
    public function byAgeGroup(Request $request): JsonResponse
    {
        $filters = $this->getFilterParams($request);

        $query = DB::table('pwd_personal_info')
            ->join('pwd_profiles', 'pwd_personal_info.pwd_profile_id', '=', 'pwd_profiles.id')
            ->whereIn('pwd_profiles.status', ['ACTIVE', 'DECEASED'])
            ->whereNull('pwd_profiles.deleted_at')
            ->whereNotNull('pwd_personal_info.birth_date');

        $this->applyFilters($query, $filters);

        $data = $query->select(DB::raw("
                CASE 
                    WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) < 18 THEN '0-17'
                    WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 18 AND 30 THEN '18-30'
                    WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 31 AND 45 THEN '31-45'
                    WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 46 AND 60 THEN '46-60'
                    ELSE '60+'
                END as age_range
            "))
            ->selectRaw('COUNT(*) as count')
            ->groupBy('age_range')
            ->orderByRaw("FIELD(age_range, '0-17', '18-30', '31-45', '46-60', '60+')")
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Get PWD count by employment status
     */
    public function byEmploymentStatus(Request $request): JsonResponse
    {
        $filters = $this->getFilterParams($request);

        $query = DB::table('pwd_employment')
            ->join('pwd_profiles', 'pwd_employment.pwd_profile_id', '=', 'pwd_profiles.id')
            ->whereIn('pwd_profiles.status', ['ACTIVE', 'DECEASED'])
            ->whereNull('pwd_profiles.deleted_at')
            ->whereNotNull('pwd_employment.status');

        $this->applyFilters($query, $filters);

        $data = $query->select('pwd_employment.status as name')
            ->selectRaw('COUNT(*) as count')
            ->groupBy('pwd_employment.status')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Get PWD count by gender
     */
    public function byGender(Request $request): JsonResponse
    {
        $filters = $this->getFilterParams($request);

        $query = DB::table('pwd_personal_info')
            ->join('pwd_profiles', 'pwd_personal_info.pwd_profile_id', '=', 'pwd_profiles.id')
            ->whereIn('pwd_profiles.status', ['ACTIVE', 'DECEASED'])
            ->whereNull('pwd_profiles.deleted_at');

        $this->applyFilters($query, $filters);

        $data = $query->select('pwd_personal_info.sex as name')
            ->selectRaw('COUNT(*) as count')
            ->groupBy('pwd_personal_info.sex')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Get PWD count by income bracket
     */
    public function byIncome(Request $request): JsonResponse
    {
        $filters = $this->getFilterParams($request);

        $query = DB::table('pwd_household_info')
            ->join('pwd_profiles', 'pwd_household_info.pwd_profile_id', '=', 'pwd_profiles.id')
            ->whereIn('pwd_profiles.status', ['ACTIVE', 'DECEASED'])
            ->whereNull('pwd_profiles.deleted_at');

        $this->applyFilters($query, $filters);

        $data = $query->select(DB::raw("
                CASE 
                    WHEN monthly_income < 5000 THEN 'Below ₱5,000'
                    WHEN monthly_income BETWEEN 5000 AND 10000 THEN '₱5,000 - ₱10,000'
                    WHEN monthly_income BETWEEN 10001 AND 20000 THEN '₱10,001 - ₱20,000'
                    WHEN monthly_income BETWEEN 20001 AND 50000 THEN '₱20,001 - ₱50,000'
                    WHEN monthly_income > 50000 THEN 'Above ₱50,000'
                    ELSE 'Not Specified'
                END as name
            "))
            ->selectRaw('COUNT(*) as count')
            ->groupBy('name')
            ->orderByRaw("FIELD(name, 'Below ₱5,000', '₱5,000 - ₱10,000', '₱10,001 - ₱20,000', '₱20,001 - ₱50,000', 'Above ₱50,000', 'Not Specified')")
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Get PWD count by living arrangement
     */
    public function byLivingArrangement(Request $request): JsonResponse
    {
        $filters = $this->getFilterParams($request);

        $query = DB::table('pwd_household_info')
            ->join('pwd_profiles', 'pwd_household_info.pwd_profile_id', '=', 'pwd_profiles.id')
            ->whereIn('pwd_profiles.status', ['ACTIVE', 'DECEASED'])
            ->whereNull('pwd_profiles.deleted_at')
            ->whereNotNull('pwd_household_info.living_arrangement')
            ->where('pwd_household_info.living_arrangement', '!=', '');

        $this->applyFilters($query, $filters);

        $data = $query->select('pwd_household_info.living_arrangement as name')
            ->selectRaw('COUNT(*) as count')
            ->groupBy('pwd_household_info.living_arrangement')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Get Deceased PWD count by age group
     */
    public function deceasedByAge(Request $request): JsonResponse
    {
        $filters = $this->getFilterParams($request);

        $query = DB::table('pwd_personal_info')
            ->join('pwd_profiles', 'pwd_personal_info.pwd_profile_id', '=', 'pwd_profiles.id')
            ->where('pwd_profiles.status', 'DECEASED')
            ->whereNull('pwd_profiles.deleted_at')
            ->whereNotNull('pwd_personal_info.birth_date');

        $this->applyFilters($query, $filters);

        $data = $query->select(DB::raw("
                CASE 
                    WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) < 18 THEN '0-17'
                    WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 18 AND 30 THEN '18-30'
                    WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 31 AND 45 THEN '31-45'
                    WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 46 AND 60 THEN '46-60'
                    ELSE '60+'
                END as age_range
            "))
            ->selectRaw('COUNT(*) as count')
            ->groupBy('age_range')
            ->orderByRaw("FIELD(age_range, '0-17', '18-30', '31-45', '46-60', '60+')")
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Get monthly registration trends
     */
    public function monthlyTrend(Request $request): JsonResponse
    {
        $year = $request->get('year', date('Y'));

        $data = PwdProfile::selectRaw('MONTH(created_at) as month, COUNT(*) as count')
            ->whereYear('created_at', $year)
            ->whereNull('deleted_at')
            ->groupBy(DB::raw('MONTH(created_at)'))
            ->orderBy('month')
            ->get()
            ->map(function ($item) {
                $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                return [
                    'month' => $months[$item->month - 1],
                    'count' => $item->count,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Get recent activity for dashboard
     */
    public function recentActivity(Request $request): JsonResponse
    {
        $limit = $request->get('limit', 10);

        $recentPwd = PwdProfile::with(['address.barangay', 'disabilities.disabilityType'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($pwd) {
                return [
                    'id' => $pwd->id,
                    'name' => $pwd->full_name,
                    'pwd_number' => $pwd->pwd_number,
                    'barangay' => $pwd->address?->barangay?->name,
                    'disability_type' => $pwd->disabilities->first()?->disabilityType?->name,
                    'status' => $pwd->status,
                    'date_added' => $pwd->created_at->toIso8601String(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $recentPwd,
        ]);
    }
}
