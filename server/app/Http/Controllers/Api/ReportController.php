<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Barangay;
use App\Models\DisabilityType;
use App\Models\GeneratedReport;
use App\Models\PwdProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Font;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Worksheet\SheetView;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
    /**
     * Get all generated reports
     */
    public function index(Request $request): JsonResponse
    {
        $reports = GeneratedReport::with('generatedByUser')
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        $data = $reports->map(function ($report) {
            return [
                'id' => $report->id,
                'file_name' => $report->file_name,
                'file_type' => $report->file_type,
                'report_type' => $report->report_type,
                'size' => $report->size,
                'generated_by' => $report->generatedByUser?->full_name,
                'created_at' => $report->created_at,
                'file_exists' => $report->fileExists(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
            'meta' => [
                'current_page' => $reports->currentPage(),
                'last_page' => $reports->lastPage(),
                'per_page' => $reports->perPage(),
                'total' => $reports->total(),
            ],
        ]);
    }

    /**
     * Generate a new report
     */
    public function generate(Request $request): JsonResponse
    {
        $request->validate([
            'report_type' => 'required|in:YOUTH_PWD,DILG_FORMAT,LGU_COMPLIANCE,MASTERLIST,STATISTICAL_REPORT,QUARTERLY_REPORT,CUSTOM',
            'file_type' => 'required|in:PDF,EXCEL,CSV',
            'filters' => 'nullable|array',
            'filters.barangay_id' => 'nullable|exists:barangays,id',
            'filters.barangay' => 'nullable|string|max:100',
            'filters.disability_type_id' => 'nullable|exists:disability_types,id',
            'filters.year' => 'nullable|integer|min:2000|max:2100',
            'filters.as_of_date' => 'nullable|date',
            'filters.status' => 'nullable|string|in:ACTIVE,DECEASED,INACTIVE',
            'filters.has_pwd_number' => 'nullable|boolean',
            'filters.is_child' => 'nullable|boolean',
        ]);

        $reportType = $request->report_type;
        $fileType = $request->file_type;
        $filters = $request->filters ?? [];

        // Get report data based on type
        $data = $this->getReportData($reportType, $filters);

        // Generate file
        $timestamp = now()->format('Y-m-d_His');
        if ($fileType === 'CSV') {
            $extension = 'csv';
        } else {
            $extension = $fileType === 'PDF' ? 'pdf' : 'xlsx';
        }
        
        $prefix = strtolower($reportType);
        if ($reportType === 'DILG_FORMAT') $prefix = 'demographic_profile';
        if ($reportType === 'LGU_COMPLIANCE') $prefix = 'lgu_compliance_summary';
        
        $fileName = "{$prefix}_{$timestamp}.{$extension}";
        $filePath = $fileName;

        try {
            // Ensure reports directory exists
            Storage::disk('reports')->makeDirectory('');

            if ($fileType === 'EXCEL') {
                $this->generateExcel($data, $reportType, $filePath);
            } elseif ($fileType === 'CSV') {
                $this->generateCsv($data, $reportType, $filePath);
            } else {
                $this->generatePdf($data, $reportType, $filePath);
            }

            // Get file size
            $size = Storage::disk('reports')->size($filePath);

            // Create report record
            $report = GeneratedReport::create([
                'file_name' => $fileName,
                'file_path' => $filePath,
                'file_type' => $fileType,
                'report_type' => $reportType,
                'size' => $this->formatBytes($size),
                'parameters' => $filters,
                'generated_by' => $request->user()->id,
            ]);

            // Log activity
            ActivityLog::log('exported', GeneratedReport::class, $report->id, null, null, "Generated {$reportType} report");

            return response()->json([
                'success' => true,
                'message' => 'Report generated successfully',
                'data' => [
                    'id' => $report->id,
                    'file_name' => $report->file_name,
                    'file_type' => $report->file_type,
                    'size' => $report->size,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate report: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Download a report
     */
    public function download(GeneratedReport $report): BinaryFileResponse|JsonResponse
    {
        if (!$report->fileExists()) {
            return response()->json([
                'success' => false,
                'message' => 'Report file not found',
            ], 404);
        }

        $mimeType = 'application/octet-stream';
        if ($report->file_type === 'PDF') {
            $mimeType = 'application/pdf';
        } elseif ($report->file_type === 'EXCEL') {
            $mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } elseif ($report->file_type === 'CSV') {
            $mimeType = 'text/csv';
        }

        return response()->download(
            $report->full_path,
            $report->file_name,
            ['Content-Type' => $mimeType]
        );
    }

    /**
     * Delete a report
     */
    public function destroy(GeneratedReport $report): JsonResponse
    {
        $report->deleteFile();
        $report->delete();

        return response()->json([
            'success' => true,
            'message' => 'Report deleted successfully',
        ]);
    }

    /**
     * Get report data preview
     */
    public function preview(Request $request): JsonResponse
    {
        $request->validate([
            'report_type' => 'required|in:YOUTH_PWD,DILG_FORMAT,LGU_COMPLIANCE,MASTERLIST,STATISTICAL_REPORT,QUARTERLY_REPORT,CUSTOM',
            'filters' => 'nullable|array',
        ]);

        $data = $this->getReportData($request->report_type, $request->filters ?? []);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    // ==================== Helper Methods ====================

    protected function getReportData(string $reportType, array $filters): array
    {
        switch ($reportType) {
            case 'YOUTH_PWD':
                return $this->getYouthPwdData($filters);
            case 'DILG_FORMAT':
                return $this->getDilgFormatData($filters);
            case 'LGU_COMPLIANCE':
                return $this->getLguComplianceData($filters);
            case 'MASTERLIST':
                return $this->getMasterlistData($filters);
            case 'STATISTICAL_REPORT':
                return $this->getStatisticalReportData($filters);
            case 'QUARTERLY_REPORT':
                return $this->getQuarterlyReportData($filters);
            default:
                return $this->getCustomData($filters);
        }
    }

    protected function getStatisticalReportData(array $filters): array
    {
        $asOfDate = $filters['as_of_date'] ?? now()->format('Y-m-d');
        
        $targetTypes = [
            'Cancer (RA 11215)' => 'Cancer',
            'Deaf or Hard of Hearing' => 'Deaf or Hard of Hearing',
            'Intellectual Disability' => 'Intellectual',
            'Learning Disability' => 'Learning',
            'Mental Disability' => 'Mental',
            'Physical Disability' => 'Physical',
            'Psychosocial Disability' => 'Psychosocial',
            'Rare Disease (RA 10747)' => 'Rare Disease',
            'Speech & Language Impairment' => 'Speech/Language',
            'Visual Disability' => 'Visual'
        ];

        // Optimized: Run one query grouped by disability type instead of looping
        $countsByDisability = DB::table('pwd_profiles')
            ->join('pwd_personal_info', 'pwd_profiles.id', '=', 'pwd_personal_info.pwd_profile_id')
            ->join('pwd_disabilities', 'pwd_profiles.id', '=', 'pwd_disabilities.pwd_profile_id')
            ->join('disability_types', 'pwd_disabilities.disability_type_id', '=', 'disability_types.id')
            ->where('pwd_profiles.status', 'ACTIVE')
            ->whereNull('pwd_profiles.deleted_at')
            ->where('pwd_profiles.date_applied', '<=', $asOfDate)
            ->select(
                'disability_types.name as db_name',
                DB::raw("COUNT(CASE WHEN TIMESTAMPDIFF(MONTH, pwd_personal_info.birth_date, '$asOfDate') >= 1 AND TIMESTAMPDIFF(YEAR, pwd_personal_info.birth_date, '$asOfDate') < 18 AND pwd_personal_info.sex = 'Male' THEN 1 END) as g1_male"),
                DB::raw("COUNT(CASE WHEN TIMESTAMPDIFF(MONTH, pwd_personal_info.birth_date, '$asOfDate') >= 1 AND TIMESTAMPDIFF(YEAR, pwd_personal_info.birth_date, '$asOfDate') < 18 AND pwd_personal_info.sex = 'Female' THEN 1 END) as g1_female"),
                DB::raw("COUNT(CASE WHEN TIMESTAMPDIFF(YEAR, pwd_personal_info.birth_date, '$asOfDate') BETWEEN 18 AND 30 AND pwd_personal_info.sex = 'Male' THEN 1 END) as g2_male"),
                DB::raw("COUNT(CASE WHEN TIMESTAMPDIFF(YEAR, pwd_personal_info.birth_date, '$asOfDate') BETWEEN 18 AND 30 AND pwd_personal_info.sex = 'Female' THEN 1 END) as g2_female"),
                DB::raw("COUNT(CASE WHEN TIMESTAMPDIFF(YEAR, pwd_personal_info.birth_date, '$asOfDate') BETWEEN 31 AND 59 AND pwd_personal_info.sex = 'Male' THEN 1 END) as g3_male"),
                DB::raw("COUNT(CASE WHEN TIMESTAMPDIFF(YEAR, pwd_personal_info.birth_date, '$asOfDate') BETWEEN 31 AND 59 AND pwd_personal_info.sex = 'Female' THEN 1 END) as g3_female"),
                DB::raw("COUNT(CASE WHEN TIMESTAMPDIFF(YEAR, pwd_personal_info.birth_date, '$asOfDate') >= 60 AND pwd_personal_info.sex = 'Male' THEN 1 END) as g4_male"),
                DB::raw("COUNT(CASE WHEN TIMESTAMPDIFF(YEAR, pwd_personal_info.birth_date, '$asOfDate') >= 60 AND pwd_personal_info.sex = 'Female' THEN 1 END) as g4_female")
            )
            ->groupBy('disability_types.name')
            ->get()
            ->keyBy('db_name');

        $results = [];
        $index = 1;

        foreach ($targetTypes as $displayLabel => $dbName) {
            $counts = $countsByDisability->get($dbName);
            
            if ($counts) {
                $results[] = array_merge(['no' => $index++, 'type' => $displayLabel], (array)$counts);
            } else {
                $results[] = [
                    'no' => $index++,
                    'type' => $displayLabel,
                    'g1_male' => 0, 'g1_female' => 0,
                    'g2_male' => 0, 'g2_female' => 0,
                    'g3_male' => 0, 'g3_female' => 0,
                    'g4_male' => 0, 'g4_female' => 0,
                ];
            }
        }

        return [
            'title' => 'TOTAL NUMBER OF REGISTERED PERSONS WITH DISABILITIES',
            'as_of' => $asOfDate,
            'generated_at' => now()->toDateTimeString(),
            'rows' => $results,
            'municipality' => 'Municipality of Pagsanjan',
        ];
    }

    protected function getYouthPwdData(array $filters): array
    {
        $asOfDate = $filters['as_of_date'] ?? now()->format('Y-m-d');
        $year = $filters['year'] ?? now()->year;

        // Summary data grouped by disability type for the table view
        $summaryData = DB::table('pwd_profiles')
            ->join('pwd_personal_info', 'pwd_profiles.id', '=', 'pwd_personal_info.pwd_profile_id')
            ->join('pwd_disabilities', 'pwd_profiles.id', '=', 'pwd_disabilities.pwd_profile_id')
            ->join('disability_types', 'pwd_disabilities.disability_type_id', '=', 'disability_types.id')
            ->where('pwd_profiles.status', 'ACTIVE')
            ->whereNotNull('pwd_profiles.pwd_number')
            ->where('pwd_profiles.pwd_number', '!=', '')
            ->whereNull('pwd_profiles.deleted_at')
            ->whereRaw("TIMESTAMPDIFF(YEAR, pwd_personal_info.birth_date, '$asOfDate') <= 17")
            ->whereRaw("TIMESTAMPDIFF(YEAR, pwd_personal_info.birth_date, '$asOfDate') >= 0")
            ->select(
                'disability_types.name as disability_type',
                DB::raw('SUM(CASE WHEN pwd_personal_info.sex = "Male" THEN 1 ELSE 0 END) as male'),
                DB::raw('SUM(CASE WHEN pwd_personal_info.sex = "Female" THEN 1 ELSE 0 END) as female'),
                DB::raw('COUNT(*) as total')
            )
            ->groupBy('disability_types.id', 'disability_types.name')
            ->get();

        // Detailed records for export
        $detailedData = DB::table('pwd_profiles')
            ->join('pwd_personal_info', 'pwd_profiles.id', '=', 'pwd_personal_info.pwd_profile_id')
            ->join('pwd_disabilities', 'pwd_profiles.id', '=', 'pwd_disabilities.pwd_profile_id')
            ->join('disability_types', 'pwd_disabilities.disability_type_id', '=', 'disability_types.id')
            ->leftJoin('pwd_addresses', 'pwd_profiles.id', '=', 'pwd_addresses.pwd_profile_id')
            ->leftJoin('barangays', 'pwd_addresses.barangay_id', '=', 'barangays.id')
            ->where('pwd_profiles.status', 'ACTIVE')
            ->whereNotNull('pwd_profiles.pwd_number')
            ->where('pwd_profiles.pwd_number', '!=', '')
            ->whereNull('pwd_profiles.deleted_at')
            ->whereRaw("TIMESTAMPDIFF(YEAR, pwd_personal_info.birth_date, '$asOfDate') <= 17")
            ->whereRaw("TIMESTAMPDIFF(YEAR, pwd_personal_info.birth_date, '$asOfDate') >= 0")
            ->select(
                'pwd_profiles.pwd_number as id_number',
                'pwd_profiles.last_name as surname',
                'pwd_profiles.first_name as name',
                'pwd_profiles.middle_name',
                'pwd_personal_info.sex as gender',
                DB::raw("TIMESTAMPDIFF(YEAR, pwd_personal_info.birth_date, '$asOfDate') as age"),
                'disability_types.name as disability',
                'barangays.name as barangay'
            )
            ->orderBy('pwd_profiles.last_name')
            ->get();

        return [
            'title' => "No. of children with disabilities issued with IDs (17 years old and below) $year",
            'as_of' => $asOfDate,
            'year' => $year,
            'generated_at' => now()->toDateTimeString(),
            'rows' => $summaryData->toArray(),
            'detailed_rows' => $detailedData->toArray(),
        ];
    }

    protected function getDilgFormatData(array $filters): array
    {
        $asOfDate = $filters['as_of_date'] ?? now()->format('Y-m-d');

        $data = DB::table('pwd_profiles')
            ->join('pwd_personal_info', 'pwd_profiles.id', '=', 'pwd_personal_info.pwd_profile_id')
            ->join('pwd_disabilities', 'pwd_profiles.id', '=', 'pwd_disabilities.pwd_profile_id')
            ->join('disability_types', 'pwd_disabilities.disability_type_id', '=', 'disability_types.id')
            ->where('pwd_profiles.status', 'ACTIVE')
            ->whereNull('pwd_profiles.deleted_at')
            ->select(
                'disability_types.name as disability_type',
                DB::raw("COUNT(CASE WHEN TIMESTAMPDIFF(YEAR, pwd_personal_info.birth_date, '$asOfDate') < 18 THEN 1 END) as age_pediatric"),
                DB::raw("COUNT(CASE WHEN TIMESTAMPDIFF(YEAR, pwd_personal_info.birth_date, '$asOfDate') BETWEEN 18 AND 59 THEN 1 END) as age_adult"),
                DB::raw("COUNT(CASE WHEN TIMESTAMPDIFF(YEAR, pwd_personal_info.birth_date, '$asOfDate') >= 60 THEN 1 END) as age_senior"),
                DB::raw('SUM(CASE WHEN pwd_personal_info.sex = "Male" THEN 1 ELSE 0 END) as male'),
                DB::raw('SUM(CASE WHEN pwd_personal_info.sex = "Female" THEN 1 ELSE 0 END) as female'),
                DB::raw('COUNT(*) as total')
            )
            ->groupBy('disability_types.id', 'disability_types.name')
            ->orderBy('disability_types.name')
            ->get();

        $grandTotal = $data->sum('total');

        return [
            'title' => 'Comprehensive PWD Demographic Profile',
            'generated_at' => now()->toDateTimeString(),
            'as_of' => $asOfDate,
            'municipality' => 'Pagsanjan',
            'province' => 'Laguna',
            'grand_total' => $grandTotal,
            'rows' => $data->map(function($row) use ($grandTotal) {
                return [
                    'disability_type' => $row->disability_type,
                    'age_pediatric' => (int) $row->age_pediatric,
                    'age_adult' => (int) $row->age_adult,
                    'age_senior' => (int) $row->age_senior,
                    'male' => (int) $row->male,
                    'female' => (int) $row->female,
                    'total' => (int) $row->total,
                    'percentage' => $grandTotal > 0 ? round(($row->total / $grandTotal) * 100, 2) : 0,
                ];
            })->toArray(),
        ];
    }

    protected function getLguComplianceData(array $filters): array
    {
        // Optimized: Single query for counts
        $counts = DB::table('pwd_profiles')
            ->join('pwd_personal_info', 'pwd_profiles.id', '=', 'pwd_personal_info.pwd_profile_id')
            ->where('pwd_profiles.status', 'ACTIVE')
            ->select(
                DB::raw('SUM(CASE WHEN pwd_personal_info.sex = "Male" THEN 1 ELSE 0 END) as male'),
                DB::raw('SUM(CASE WHEN pwd_personal_info.sex = "Female" THEN 1 ELSE 0 END) as female')
            )
            ->first();

        $totalMale = (int) ($counts->male ?? 0);
        $totalFemale = (int) ($counts->female ?? 0);

        return [
            'title' => 'National Disability Data Compliance Summary',
            'generated_at' => now()->toDateTimeString(),
            'rows' => [
                ['field' => 'Total Registered PWDs', 'male' => $totalMale, 'female' => $totalFemale, 'total' => $totalMale + $totalFemale],
                ['field' => 'Active PWDs', 'male' => $totalMale, 'female' => $totalFemale, 'total' => $totalMale + $totalFemale],
            ],
        ];
    }

    protected function getQuarterlyReportData(array $filters): array
    {
        $year = $filters['year'] ?? now()->year;
        $startDate = "$year-01-01";
        $endDate = "$year-12-31";

        // Optimized: Single query for the whole year daily data
        $dailyData = DB::table('pwd_profiles')
            ->leftJoin('pending_registrations', 'pwd_profiles.id', '=', 'pending_registrations.pwd_profile_id')
            ->where('pwd_profiles.status', 'ACTIVE')
            ->whereNull('pwd_profiles.deleted_at')
            ->whereBetween('pwd_profiles.date_applied', [$startDate, $endDate])
            ->select(
                'pwd_profiles.date_applied as date',
                DB::raw('MONTH(pwd_profiles.date_applied) as month_num'),
                DB::raw('SUM(CASE WHEN pending_registrations.submission_type = "NEW" OR pending_registrations.submission_type IS NULL THEN 1 ELSE 0 END) as new_count'),
                DB::raw('SUM(CASE WHEN pending_registrations.submission_type = "RENEWAL" THEN 1 ELSE 0 END) as renewal_count'),
                DB::raw('SUM(CASE WHEN pending_registrations.submission_type = "EXISTING" THEN 1 ELSE 0 END) as transfer_count'),
                DB::raw('COUNT(*) as total')
            )
            ->groupBy('pwd_profiles.date_applied', DB::raw('MONTH(pwd_profiles.date_applied)'))
            ->orderBy('pwd_profiles.date_applied')
            ->get()
            ->groupBy('month_num');

        // Optimized: Single query for inactive records for the whole year
        $lostData = DB::table('pwd_profiles')
            ->where('pwd_profiles.status', 'INACTIVE')
            ->whereBetween('pwd_profiles.updated_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->select(
                DB::raw('DATE(pwd_profiles.updated_at) as date'),
                DB::raw('MONTH(pwd_profiles.updated_at) as month_num'),
                DB::raw('COUNT(*) as lost_count')
            )
            ->groupBy(DB::raw('DATE(pwd_profiles.updated_at)'), DB::raw('MONTH(pwd_profiles.updated_at)'))
            ->get()
            ->groupBy('month_num');

        $months = [
            1 => 'JANUARY', 2 => 'FEBRUARY', 3 => 'MARCH',
            4 => 'APRIL', 5 => 'MAY', 6 => 'JUNE',
            7 => 'JULY', 8 => 'AUGUST', 9 => 'SEPTEMBER',
            10 => 'OCTOBER', 11 => 'NOVEMBER', 12 => 'DECEMBER'
        ];

        $allMonthsData = [];

        foreach ($months as $monthNum => $monthName) {
            $rows = [];
            $monthTotals = ['new' => 0, 'renewal' => 0, 'transfer' => 0, 'lost' => 0, 'total' => 0];

            $monthDaily = $dailyData->get($monthNum, collect());
            $monthLost = $lostData->get($monthNum, collect())->keyBy('date');

            foreach ($monthDaily as $day) {
                $dateStr = $day->date;
                $lost = isset($monthLost[$dateStr]) ? $monthLost[$dateStr]->lost_count : 0;
                $dayTotal = $day->new_count + $day->renewal_count + $day->transfer_count;

                $rows[] = [
                    'date' => $dateStr,
                    'new' => (int) $day->new_count,
                    'renewal' => (int) $day->renewal_count,
                    'transfer' => (int) $day->transfer_count,
                    'lost' => (int) $lost,
                    'total' => (int) $dayTotal,
                ];

                $monthTotals['new'] += (int) $day->new_count;
                $monthTotals['renewal'] += (int) $day->renewal_count;
                $monthTotals['transfer'] += (int) $day->transfer_count;
                $monthTotals['lost'] += (int) $lost;
                $monthTotals['total'] += (int) $dayTotal;
            }

            $allMonthsData[] = [
                'month' => $monthName,
                'month_num' => $monthNum,
                'rows' => $rows,
                'totals' => $monthTotals,
            ];
        }

        // Calculate quarterly totals
        $quarters = [];
        for ($q = 0; $q < 4; $q++) {
            $qMonths = array_slice($allMonthsData, $q * 3, 3);
            $qTotal = ['new' => 0, 'renewal' => 0, 'transfer' => 0, 'lost' => 0, 'total' => 0];
            foreach ($qMonths as $m) {
                $qTotal['new'] += $m['totals']['new'];
                $qTotal['renewal'] += $m['totals']['renewal'];
                $qTotal['transfer'] += $m['totals']['transfer'];
                $qTotal['lost'] += $m['totals']['lost'];
                $qTotal['total'] += $m['totals']['total'];
            }
            $quarters[] = $qTotal;
        }

        // Year-to-date total
        $ytdTotal = ['new' => 0, 'renewal' => 0, 'transfer' => 0, 'lost' => 0, 'total' => 0];
        foreach ($allMonthsData as $m) {
            $ytdTotal['new'] += $m['totals']['new'];
            $ytdTotal['renewal'] += $m['totals']['renewal'];
            $ytdTotal['transfer'] += $m['totals']['transfer'];
            $ytdTotal['lost'] += $m['totals']['lost'];
            $ytdTotal['total'] += $m['totals']['total'];
        }

        return [
            'title' => "PWD MEMBER PER MONTH - $year",
            'year' => $year,
            'generated_at' => now()->toDateTimeString(),
            'months' => $allMonthsData,
            'quarters' => $quarters,
            'ytd' => $ytdTotal,
        ];
    }

    protected function getMasterlistData(array $filters): array
    {
        $query = PwdProfile::with([
            'personalInfo',
            'address.barangay',
            'disabilities.disabilityType',
        ]);

        // Filter by status if provided, otherwise show all active
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        } else {
            $query->where('status', 'ACTIVE');
        }

        if (isset($filters['barangay_id'])) {
            $query->whereHas('address', fn($q) => $q->where('barangay_id', $filters['barangay_id']));
        }

        // Support filtering by barangay name (from frontend dropdown)
        if (isset($filters['barangay'])) {
            $query->whereHas('address.barangay', fn($q) => $q->where('name', $filters['barangay']));
        }

        if (isset($filters['disability_type_id'])) {
            $query->whereHas('disabilities', fn($q) => $q->where('disability_type_id', $filters['disability_type_id']));
        }

        // Support tab-specific filters from the masterlist UI
        if (isset($filters['has_pwd_number'])) {
            if ($filters['has_pwd_number']) {
                $query->whereNotNull('pwd_number')->where('pwd_number', '!=', '');
            } else {
                $query->where(function ($q) {
                    $q->whereNull('pwd_number')->orWhere('pwd_number', '');
                });
            }
        }

        if (isset($filters['is_child']) && $filters['is_child']) {
            $query->whereRaw('TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) < 18');
        }

        $pwds = $query->orderBy('last_name')->get();

        // Build dynamic title based on filters
        $titleParts = ['PWD Masterlist'];
        if (isset($filters['barangay'])) {
            $titleParts[] = '- Barangay ' . $filters['barangay'];
        }
        if (isset($filters['status']) && $filters['status'] === 'DECEASED') {
            $titleParts[] = '(Deceased)';
        }

        $rows = $pwds->map(function ($pwd) {
            return [
                'pwd_number' => $pwd->pwd_number,
                'name' => $pwd->full_name,
                'sex' => $pwd->personalInfo?->sex,
                'age' => $pwd->age,
                'barangay' => $pwd->address?->barangay?->name,
                'disability_type' => $pwd->disabilities->first()?->disabilityType?->name,
                'status' => $pwd->status,
            ];
        });

        return [
            'title' => implode(' ', $titleParts),
            'generated_at' => now()->toDateTimeString(),
            'total_count' => $rows->count(),
            'rows' => $rows->toArray(),
        ];
    }

    protected function getCustomData(array $filters): array
    {
        return $this->getMasterlistData($filters);
    }

    // ==================== File Generation ====================

    protected function generateCsv(array $data, string $reportType, string $filePath): void
    {
        $fullPath = Storage::disk('reports')->path($filePath);
        $fp = fopen($fullPath, 'w');
        
        fputcsv($fp, [$data['title']]);
        fputcsv($fp, ['Generated: ' . $data['generated_at']]);
        fputcsv($fp, []);
        
        if (!empty($data['rows'])) {
            $headers = array_keys((array) $data['rows'][0]);
            fputcsv($fp, $headers);
            foreach ($data['rows'] as $row) {
                fputcsv($fp, (array) $row);
            }
        }
        
        fclose($fp);
    }

    protected function generateExcel(array $data, string $reportType, string $filePath): void
    {
        $fullPath = Storage::disk('reports')->path($filePath);
        $spreadsheet = new Spreadsheet();

        switch ($reportType) {
            case 'STATISTICAL_REPORT':
                $this->generateStatisticalExcel($spreadsheet, $data);
                break;
            case 'DILG_FORMAT':
                $this->generateDilgExcel($spreadsheet, $data);
                break;
            case 'YOUTH_PWD':
                $this->generateYouthPwdExcel($spreadsheet, $data);
                break;
            case 'QUARTERLY_REPORT':
                $this->generateQuarterlyExcel($spreadsheet, $data);
                break;
            case 'MASTERLIST':
                $this->generateMasterlistExcel($spreadsheet, $data);
                break;
            default:
                $this->generateGenericExcel($spreadsheet, $data);
                break;
        }

        $writer = new Xlsx($spreadsheet);
        $writer->save($fullPath);
    }

    protected function generateStatisticalExcel(Spreadsheet $spreadsheet, array $data): void
    {
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Statistical Report');

        $asOfDate = $data['as_of'] ?? now()->format('Y-m-d');
        $formattedDate = date('F d, Y', strtotime($asOfDate));

        // Title
        $sheet->mergeCells('A1:K1');
        $sheet->setCellValue('A1', $data['municipality'] ?? 'NAME OF LGU');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells('A2:K2');
        $sheet->setCellValue('A2', "TOTAL NUMBER OF REGISTERED PERSONS WITH DISABILITIES AS OF " . strtoupper($formattedDate));
        $sheet->getStyle('A2')->getFont()->setBold(true)->setSize(11);
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Header row
        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 10],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'B91C1C']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'FFFFFF']]],
        ];

        $row = 4;
        $sheet->mergeCells("A{$row}:A" . ($row + 1));
        $sheet->setCellValue("A{$row}", 'NO.');
        $sheet->mergeCells("B{$row}:B" . ($row + 1));
        $sheet->setCellValue("B{$row}", 'TYPE OF DISABILITY');
        $sheet->mergeCells("C{$row}:D{$row}");
        $sheet->setCellValue("C{$row}", '1MO. - 17 YRS. OLD');
        $sheet->mergeCells("E{$row}:F{$row}");
        $sheet->setCellValue("E{$row}", '18 - 30 YRS. OLD');
        $sheet->mergeCells("G{$row}:H{$row}");
        $sheet->setCellValue("G{$row}", '31 - 59 YRS. OLD');
        $sheet->mergeCells("I{$row}:J{$row}");
        $sheet->setCellValue("I{$row}", '60 YRS OLD & ABOVE');
        $sheet->mergeCells("K{$row}:K" . ($row + 1));
        $sheet->setCellValue("K{$row}", 'TOTAL');

        $row2 = $row + 1;
        $cols = ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        $labels = ['Male', 'Female', 'Male', 'Female', 'Male', 'Female', 'Male', 'Female'];
        foreach ($cols as $i => $col) {
            $sheet->setCellValue("{$col}{$row2}", $labels[$i]);
        }

        $sheet->getStyle("A{$row}:K{$row2}")->applyFromArray($headerStyle);

        // Data rows
        $dataRow = $row2 + 1;
        $totalRow = ['g1_m' => 0, 'g1_f' => 0, 'g2_m' => 0, 'g2_f' => 0, 'g3_m' => 0, 'g3_f' => 0, 'g4_m' => 0, 'g4_f' => 0, 'total' => 0];

        foreach ($data['rows'] as $r) {
            $r = (array) $r;
            $rowTotal = ($r['g1_male'] ?? 0) + ($r['g1_female'] ?? 0) + ($r['g2_male'] ?? 0) + ($r['g2_female'] ?? 0) + ($r['g3_male'] ?? 0) + ($r['g3_female'] ?? 0) + ($r['g4_male'] ?? 0) + ($r['g4_female'] ?? 0);
            
            $sheet->setCellValue("A{$dataRow}", $r['no']);
            $sheet->setCellValue("B{$dataRow}", $r['type']);
            $sheet->setCellValue("C{$dataRow}", $r['g1_male'] ?? 0);
            $sheet->setCellValue("D{$dataRow}", $r['g1_female'] ?? 0);
            $sheet->setCellValue("E{$dataRow}", $r['g2_male'] ?? 0);
            $sheet->setCellValue("F{$dataRow}", $r['g2_female'] ?? 0);
            $sheet->setCellValue("G{$dataRow}", $r['g3_male'] ?? 0);
            $sheet->setCellValue("H{$dataRow}", $r['g3_female'] ?? 0);
            $sheet->setCellValue("I{$dataRow}", $r['g4_male'] ?? 0);
            $sheet->setCellValue("J{$dataRow}", $r['g4_female'] ?? 0);
            $sheet->setCellValue("K{$dataRow}", $rowTotal);

            $totalRow['g1_m'] += $r['g1_male'] ?? 0;
            $totalRow['g1_f'] += $r['g1_female'] ?? 0;
            $totalRow['g2_m'] += $r['g2_male'] ?? 0;
            $totalRow['g2_f'] += $r['g2_female'] ?? 0;
            $totalRow['g3_m'] += $r['g3_male'] ?? 0;
            $totalRow['g3_f'] += $r['g3_female'] ?? 0;
            $totalRow['g4_m'] += $r['g4_male'] ?? 0;
            $totalRow['g4_f'] += $r['g4_female'] ?? 0;
            $totalRow['total'] += $rowTotal;

            $sheet->getStyle("A{$dataRow}:K{$dataRow}")->applyFromArray([
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);
            $sheet->getStyle("B{$dataRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

            $dataRow++;
        }

        // Total row
        $sheet->mergeCells("A{$dataRow}:B{$dataRow}");
        $sheet->setCellValue("A{$dataRow}", 'TOTAL');
        $sheet->setCellValue("C{$dataRow}", $totalRow['g1_m']);
        $sheet->setCellValue("D{$dataRow}", $totalRow['g1_f']);
        $sheet->setCellValue("E{$dataRow}", $totalRow['g2_m']);
        $sheet->setCellValue("F{$dataRow}", $totalRow['g2_f']);
        $sheet->setCellValue("G{$dataRow}", $totalRow['g3_m']);
        $sheet->setCellValue("H{$dataRow}", $totalRow['g3_f']);
        $sheet->setCellValue("I{$dataRow}", $totalRow['g4_m']);
        $sheet->setCellValue("J{$dataRow}", $totalRow['g4_f']);
        $sheet->setCellValue("K{$dataRow}", $totalRow['total']);
        $sheet->getStyle("A{$dataRow}:K{$dataRow}")->applyFromArray($headerStyle);

        // Column widths
        $sheet->getColumnDimension('A')->setWidth(6);
        $sheet->getColumnDimension('B')->setWidth(30);
        foreach (['C','D','E','F','G','H','I','J','K'] as $col) {
            $sheet->getColumnDimension($col)->setWidth(10);
        }
    }

    protected function generateYouthPwdExcel(Spreadsheet $spreadsheet, array $data): void
    {
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('PWD 17 and below');

        $year = $data['year'] ?? now()->year;

        // Header styling
        $headerBg = [
            'font' => ['bold' => true, 'size' => 10],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'FF8C42']], // Darker orange
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
        ];

        // Title
        $sheet->mergeCells('A4:G4');
        $sheet->setCellValue('A4', "No. of children with disabilities issued with IDs (17 years old and below) $year");
        $sheet->getStyle('A4')->getFont()->setBold(true)->setSize(11);
        $sheet->getStyle('A4')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('A4')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('FF8C42');

        // Headers
        $headers = ['ID NUMBER', 'SURNAME', 'NAME', 'MIDDLE NAME', 'GENDER', 'AGE', 'DISABILITY', 'BARANGAY'];
        foreach ($headers as $i => $h) {
            $col = $this->getColumnLetter($i + 1); // A-H
            $sheet->setCellValue("{$col}5", $h);
        }
        $sheet->getStyle('A5:H5')->applyFromArray($headerBg);

        // Data rows (detailed)
        $detailedRows = $data['detailed_rows'] ?? [];
        $rowNum = 6;
        foreach ($detailedRows as $r) {
            $r = (array) $r;
            $sheet->setCellValue("A{$rowNum}", $r['id_number'] ?? '');
            $sheet->setCellValue("B{$rowNum}", $r['surname'] ?? '');
            $sheet->setCellValue("C{$rowNum}", $r['name'] ?? '');
            $sheet->setCellValue("D{$rowNum}", $r['middle_name'] ?? '');
            $sheet->setCellValue("E{$rowNum}", $r['gender'] ?? '');
            $sheet->setCellValue("F{$rowNum}", $r['age'] ?? '');
            $sheet->setCellValue("G{$rowNum}", $r['disability'] ?? '');
            $sheet->setCellValue("H{$rowNum}", $r['barangay'] ?? '');

            $sheet->getStyle("A{$rowNum}:H{$rowNum}")->applyFromArray([
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
            ]);
            $rowNum++;
        }

        // Add summary table to the right (Column J and K)
        $summaryRows = $data['rows'] ?? [];
        $sRow = 4;
        $sheet->setCellValue("J{$sRow}", "Disability Type");
        $sheet->setCellValue("K{$sRow}", "Count");
        $sheet->getStyle("J{$sRow}:K{$sRow}")->applyFromArray($headerBg);
        
        $sRow++;
        foreach ($summaryRows as $sr) {
            $sr = (array) $sr;
            $sheet->setCellValue("J{$sRow}", $sr['disability_type'] ?? '');
            $sheet->setCellValue("K{$sRow}", $sr['total'] ?? 0);
            $sheet->getStyle("J{$sRow}:K{$sRow}")->applyFromArray([
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
            ]);
            $sRow++;
        }

        // Column widths
        $sheet->getColumnDimension('A')->setWidth(25);
        $sheet->getColumnDimension('B')->setWidth(15);
        $sheet->getColumnDimension('C')->setWidth(15);
        $sheet->getColumnDimension('D')->setWidth(15);
        $sheet->getColumnDimension('E')->setWidth(10);
        $sheet->getColumnDimension('F')->setWidth(8);
        $sheet->getColumnDimension('G')->setWidth(20);
        $sheet->getColumnDimension('H')->setWidth(15);
        $sheet->getColumnDimension('J')->setWidth(20);
        $sheet->getColumnDimension('K')->setWidth(10);
    }

    protected function generateDilgExcel(Spreadsheet $spreadsheet, array $data): void
    {
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Demographic Profile');

        // Font and styles
        $titleStyle = [
            'font' => ['bold' => true, 'size' => 14],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ];

        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 10],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '1E293B']], // Slate-800
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'FFFFFF']]],
        ];
        
        $groupHeaderStyle = [
            'font' => ['bold' => true, 'size' => 9],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F1F5F9']], // Slate-100
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'CBD5E1']]],
        ];

        // Title
        $sheet->mergeCells('A1:H1');
        $sheet->setCellValue('A1', 'Comprehensive PWD Demographic Profile');
        $sheet->getStyle('A1')->applyFromArray($titleStyle);

        $sheet->mergeCells('A2:H2');
        $sheet->setCellValue('A2', "Municipality of " . ($data['municipality'] ?? 'Pagsanjan') . ", " . ($data['province'] ?? 'Laguna'));
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        
        $sheet->mergeCells('A3:H3');
        $sheet->setCellValue('A3', "As of: " . date('F d, Y', strtotime($data['as_of'] ?? now()->format('Y-m-d'))));
        $sheet->getStyle('A3')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Main Headers
        $row = 5;
        $sheet->mergeCells("A{$row}:A" . ($row + 1));
        $sheet->setCellValue("A{$row}", 'TYPE OF DISABILITY');
        
        $sheet->mergeCells("B{$row}:D{$row}");
        $sheet->setCellValue("B{$row}", 'AGE GROUPS');
        
        $sheet->mergeCells("E{$row}:F{$row}");
        $sheet->setCellValue("E{$row}", 'SEX (DISAGGREGATED)');
        
        $sheet->mergeCells("G{$row}:G" . ($row + 1));
        $sheet->setCellValue("G{$row}", 'TOTAL');

        $sheet->mergeCells("H{$row}:H" . ($row + 1));
        $sheet->setCellValue("H{$row}", '% OF TOTAL');

        // Sub Headers
        $row2 = $row + 1;
        $sheet->setCellValue("B{$row2}", '0-17');
        $sheet->setCellValue("C{$row2}", '18-59');
        $sheet->setCellValue("D{$row2}", '60+');
        $sheet->setCellValue("E{$row2}", 'MALE');
        $sheet->setCellValue("F{$row2}", 'FEMALE');

        $sheet->getStyle("A{$row}:H{$row2}")->applyFromArray($headerStyle);
        $sheet->getStyle("B{$row}:F{$row}")->applyFromArray($groupHeaderStyle);

        // Data
        $dataRow = $row2 + 1;
        $totals = ['p' => 0, 'a' => 0, 's' => 0, 'male' => 0, 'female' => 0, 'total' => 0];

        foreach ($data['rows'] as $r) {
            $r = (array) $r;
            $sheet->setCellValue("A{$dataRow}", $r['disability_type']);
            $sheet->setCellValue("B{$dataRow}", $r['age_pediatric']);
            $sheet->setCellValue("C{$dataRow}", $r['age_adult']);
            $sheet->setCellValue("D{$dataRow}", $r['age_senior']);
            $sheet->setCellValue("E{$dataRow}", $r['male']);
            $sheet->setCellValue("F{$dataRow}", $r['female']);
            $sheet->setCellValue("G{$dataRow}", $r['total']);
            $sheet->setCellValue("H{$dataRow}", $r['percentage'] . '%');

            $sheet->getStyle("A{$dataRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
            $sheet->getStyle("B{$dataRow}:H{$dataRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            
            // Borders
            $sheet->getStyle("A{$dataRow}:H{$dataRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);

            $totals['p'] += $r['age_pediatric'];
            $totals['a'] += $r['age_adult'];
            $totals['s'] += $r['age_senior'];
            $totals['male'] += $r['male'];
            $totals['female'] += $r['female'];
            $totals['total'] += $r['total'];

            $dataRow++;
        }

        // Total row
        $sheet->setCellValue("A{$dataRow}", 'TOTAL');
        $sheet->setCellValue("B{$dataRow}", $totals['p']);
        $sheet->setCellValue("C{$dataRow}", $totals['a']);
        $sheet->setCellValue("D{$dataRow}", $totals['s']);
        $sheet->setCellValue("E{$dataRow}", $totals['male']);
        $sheet->setCellValue("F{$dataRow}", $totals['female']);
        $sheet->setCellValue("G{$dataRow}", $totals['total']);
        $sheet->setCellValue("H{$dataRow}", '100%');

        $sheet->getStyle("A{$dataRow}:H{$dataRow}")->getFont()->setBold(true);
        $sheet->getStyle("A{$dataRow}:H{$dataRow}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('E2E8F0');
        $sheet->getStyle("B{$dataRow}:H{$dataRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle("A{$dataRow}:H{$dataRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);

        // Column widths
        $sheet->getColumnDimension('A')->setWidth(30);
        foreach (['B','C','D','E','F','G','H'] as $col) {
            $sheet->getColumnDimension($col)->setWidth(12);
        }
    }

    protected function generateQuarterlyExcel(Spreadsheet $spreadsheet, array $data): void
    {
        $year = $data['year'] ?? now()->year;
        $months = $data['months'] ?? [];
        $quarters = $data['quarters'] ?? [];

        $spreadsheet->removeSheetByIndex(0);

        // Create main sheet with all months
        $mainSheet = new \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet($spreadsheet, "$year");
        $spreadsheet->addSheet($mainSheet);

        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 10],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '2E7D32']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
        ];

        $monthHeaderStyle = [
            'font' => ['bold' => true, 'size' => 11],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'FFF176']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
        ];

        $totalStyle = [
            'font' => ['bold' => true, 'size' => 10],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'FFEB3B']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
        ];

        $quarterStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 10],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4CAF50']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
        ];

        $ytdStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 10],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '1B5E20']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
        ];

        $currentRow = 1;
        $mainSheet->setCellValue("A{$currentRow}", "PWD MEMBER PER MONTH - $year");
        $mainSheet->mergeCells("A{$currentRow}:F{$currentRow}");
        $mainSheet->getStyle("A{$currentRow}")->getFont()->setBold(true)->setSize(14);
        $currentRow += 2;

        foreach ($months as $mi => $monthData) {
            // Month header
            $mainSheet->setCellValue("A{$currentRow}", $monthData['month']);
            $mainSheet->mergeCells("A{$currentRow}:F{$currentRow}");
            $mainSheet->getStyle("A{$currentRow}:F{$currentRow}")->applyFromArray($monthHeaderStyle);
            $currentRow++;

            // Column headers
            $colHeaders = ['DATE', 'NEW', 'RENEWAL', 'TRANSFER', 'LOST', 'TOTAL'];
            foreach ($colHeaders as $ci => $ch) {
                $col = chr(65 + $ci);
                $mainSheet->setCellValue("{$col}{$currentRow}", $ch);
            }
            $mainSheet->getStyle("A{$currentRow}:F{$currentRow}")->applyFromArray($headerStyle);
            $currentRow++;

            // Daily rows
            foreach ($monthData['rows'] as $row) {
                $row = (array) $row;
                $mainSheet->setCellValue("A{$currentRow}", $row['date']);
                $mainSheet->setCellValue("B{$currentRow}", $row['new']);
                $mainSheet->setCellValue("C{$currentRow}", $row['renewal']);
                $mainSheet->setCellValue("D{$currentRow}", $row['transfer']);
                $mainSheet->setCellValue("E{$currentRow}", $row['lost']);
                $mainSheet->setCellValue("F{$currentRow}", $row['total']);
                $mainSheet->getStyle("A{$currentRow}:F{$currentRow}")->applyFromArray([
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);
                $currentRow++;
            }

            // Month totals
            $mainSheet->setCellValue("A{$currentRow}", 'TOTAL');
            $mainSheet->setCellValue("B{$currentRow}", $monthData['totals']['new']);
            $mainSheet->setCellValue("C{$currentRow}", $monthData['totals']['renewal']);
            $mainSheet->setCellValue("D{$currentRow}", $monthData['totals']['transfer']);
            $mainSheet->setCellValue("E{$currentRow}", $monthData['totals']['lost']);
            $mainSheet->setCellValue("F{$currentRow}", $monthData['totals']['total']);
            $mainSheet->getStyle("A{$currentRow}:F{$currentRow}")->applyFromArray($totalStyle);
            $currentRow++;

            // Quarter summary after every 3 months
            if (($mi + 1) % 3 === 0) {
                $qIndex = intdiv($mi, 3);
                $qNum = $qIndex + 1;
                $qData = $quarters[$qIndex] ?? ['new' => 0, 'renewal' => 0, 'transfer' => 0, 'lost' => 0, 'total' => 0];

                $mainSheet->mergeCells("D{$currentRow}:E{$currentRow}");
                $mainSheet->setCellValue("D{$currentRow}", "Q{$qNum} TOTAL");
                $mainSheet->setCellValue("F{$currentRow}", $qData['total']);
                $mainSheet->getStyle("A{$currentRow}:F{$currentRow}")->applyFromArray($quarterStyle);
                $currentRow++;

                // YTD up to this quarter
                $ytdSoFar = 0;
                for ($qi = 0; $qi <= $qIndex; $qi++) {
                    $ytdSoFar += ($quarters[$qi]['total'] ?? 0);
                }
                $mainSheet->mergeCells("D{$currentRow}:E{$currentRow}");
                $mainSheet->setCellValue("D{$currentRow}", 'YTD');
                $mainSheet->setCellValue("F{$currentRow}", $ytdSoFar);
                $mainSheet->getStyle("A{$currentRow}:F{$currentRow}")->applyFromArray($ytdStyle);
                $currentRow++;
            }

            $currentRow++; // Blank row between months
        }

        // Column widths
        $mainSheet->getColumnDimension('A')->setWidth(16);
        $mainSheet->getColumnDimension('B')->setWidth(12);
        $mainSheet->getColumnDimension('C')->setWidth(12);
        $mainSheet->getColumnDimension('D')->setWidth(12);
        $mainSheet->getColumnDimension('E')->setWidth(12);
        $mainSheet->getColumnDimension('F')->setWidth(12);
    }

    protected function generateMasterlistExcel(Spreadsheet $spreadsheet, array $data): void
    {
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('PWD Masterlist');

        // Define columns: key => [header label, width, alignment]
        $columns = [
            'pwd_number'      => ['PWD NUMBER',      22, Alignment::HORIZONTAL_LEFT],
            'name'            => ['NAME',             35, Alignment::HORIZONTAL_LEFT],
            'sex'             => ['SEX',              10, Alignment::HORIZONTAL_CENTER],
            'age'             => ['AGE',               8, Alignment::HORIZONTAL_CENTER],
            'barangay'        => ['BARANGAY',         20, Alignment::HORIZONTAL_LEFT],
            'disability_type' => ['DISABILITY TYPE',  22, Alignment::HORIZONTAL_LEFT],
            'status'          => ['STATUS',           12, Alignment::HORIZONTAL_CENTER],
        ];
        $colKeys = array_keys($columns);
        $colCount = count($colKeys);
        $lastCol = $this->getColumnLetter($colCount);

        // ── Row 1: Title ──
        $sheet->mergeCells("A1:{$lastCol}1");
        $sheet->setCellValue('A1', strtoupper($data['title'] ?? 'PWD MASTERLIST'));
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => '1B3A5C']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(28);

        // ── Row 2: Generated date ──
        $sheet->mergeCells("A2:{$lastCol}2");
        $sheet->setCellValue('A2', 'Generated: ' . ($data['generated_at'] ?? now()->toDateTimeString()));
        $sheet->getStyle('A2')->applyFromArray([
            'font' => ['italic' => true, 'size' => 10, 'color' => ['rgb' => '555555']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // ── Row 3: Record count ──
        $sheet->mergeCells("A3:{$lastCol}3");
        $totalCount = $data['total_count'] ?? count($data['rows'] ?? []);
        $sheet->setCellValue('A3', 'Total Records: ' . $totalCount);
        $sheet->getStyle('A3')->applyFromArray([
            'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => '333333']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // ── Row 4: Column headers ──
        $headerRow = 4;
        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 11],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '1B3A5C']], // Dark blue
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'FFFFFF']]],
        ];

        foreach ($colKeys as $i => $key) {
            $col = $this->getColumnLetter($i + 1);
            $colDef = $columns[$key];
            $sheet->setCellValue("{$col}{$headerRow}", $colDef[0]);
            $sheet->getColumnDimension($col)->setWidth($colDef[1]);
        }
        $sheet->getStyle("A{$headerRow}:{$lastCol}{$headerRow}")->applyFromArray($headerStyle);
        $sheet->getRowDimension($headerRow)->setRowHeight(22);

        // ── Data rows ──
        $evenRowStyle = [
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E8F0FE']], // Light blue
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'D0D5DD']]],
        ];
        $oddRowStyle = [
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'FFFFFF']],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'D0D5DD']]],
        ];

        // Format PWD_NUMBER column explicitly as text to avoid green triangles
        $pwdColLetter = 'A';
        
        $dataStartRow = $headerRow + 1;
        if (!empty($data['rows'])) {
            $rows = array_values($data['rows']);
            foreach ($rows as $idx => $row) {
                $rowArr = (array) $row;
                $currentRow = $dataStartRow + $idx;

                foreach ($colKeys as $i => $key) {
                    $col = $this->getColumnLetter($i + 1);
                    $val = $rowArr[$key] ?? '';

                    // Replace blank values with N/A
                    if ($val === null || $val === '') {
                        $val = 'N/A';
                    }

                    // Set PWD number as explicit text to prevent green triangle warnings
                    if ($key === 'pwd_number') {
                        $sheet->setCellValueExplicit("{$col}{$currentRow}", $val, \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
                    } else {
                        $sheet->setCellValue("{$col}{$currentRow}", $val);
                    }

                    // Apply per-column alignment
                    $sheet->getStyle("{$col}{$currentRow}")->getAlignment()
                        ->setHorizontal($columns[$key][2])
                        ->setVertical(Alignment::VERTICAL_CENTER);
                }

                // Apply alternating row colors (banded rows)
                $rowStyle = ($idx % 2 === 0) ? $evenRowStyle : $oddRowStyle;
                $sheet->getStyle("A{$currentRow}:{$lastCol}{$currentRow}")->applyFromArray($rowStyle);
                $sheet->getRowDimension($currentRow)->setRowHeight(18);
            }

            // ── Summary footer row ──
            $footerRow = $dataStartRow + count($rows);
            $sheet->mergeCells("A{$footerRow}:{$lastCol}{$footerRow}");
            $sheet->setCellValue("A{$footerRow}", 'Total Records: ' . count($rows));
            $sheet->getStyle("A{$footerRow}:{$lastCol}{$footerRow}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '1B3A5C']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '1B3A5C']]],
            ]);
            $sheet->getRowDimension($footerRow)->setRowHeight(22);
        }

        // ── Freeze panes: keep title + headers visible when scrolling ──
        $sheet->freezePane("A{$dataStartRow}");

        // ── Set print area & page setup ──
        $lastDataRow = $dataStartRow + count($data['rows'] ?? []);
        $sheet->getPageSetup()->setOrientation(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_LANDSCAPE);
        $sheet->getPageSetup()->setFitToWidth(1);
        $sheet->getPageSetup()->setFitToHeight(0);
        $sheet->getPageSetup()->setRowsToRepeatAtTopByStartAndEnd($headerRow, $headerRow);

        // ── Sheet view: set zoom level ──
        $sheet->getSheetView()->setZoomScale(100);
    }

    protected function generateGenericExcel(Spreadsheet $spreadsheet, array $data): void
    {
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Report');

        $sheet->setCellValue('A1', $data['title'] ?? 'Report');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->setCellValue('A2', 'Generated: ' . ($data['generated_at'] ?? now()->toDateTimeString()));

        if (!empty($data['rows'])) {
            $rows = array_values($data['rows']);
            $headers = array_keys((array) $rows[0]);
            
            foreach ($headers as $i => $h) {
                $col = $this->getColumnLetter($i + 1);
                $sheet->setCellValue("{$col}4", strtoupper($h));
                $sheet->getStyle("{$col}4")->getFont()->setBold(true);
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }

            $rowNum = 5;
            foreach ($rows as $row) {
                $rowArr = (array) $row;
                foreach ($headers as $i => $h) {
                    $col = $this->getColumnLetter($i + 1);
                    $val = $rowArr[$h] ?? '';
                    $sheet->setCellValue("{$col}{$rowNum}", $val);
                }
                $rowNum++;
            }
        }
    }

    protected function getColumnLetter(int $index): string
    {
        $letter = '';
        while ($index > 0) {
            $temp = ($index - 1) % 26;
            $letter = chr($temp + 65) . $letter;
            $index = ($index - $temp - 1) / 26;
        }
        return $letter;
    }

    protected function generatePdf(array $data, string $reportType, string $filePath): void
    {
        $fullPath = Storage::disk('reports')->path($filePath);

        try {
            $html = $this->buildPdfHtml($data, $reportType);
            $pdf = Pdf::loadHTML($html);
            $pdf->setPaper('A4', 'landscape');
            $pdf->save($fullPath);
        } catch (\Exception $e) {
            // Fallback to simple text if DomPDF fails
            $content = $data['title'] . "\n";
            $content .= "Generated: " . $data['generated_at'] . "\n\n";
            if (!empty($data['rows'])) {
                foreach ($data['rows'] as $row) {
                    $content .= implode(' | ', (array) $row) . "\n";
                }
            }
            file_put_contents($fullPath, $content);
        }
    }

    protected function buildPdfHtml(array $data, string $reportType): string
    {
        $title = $data['title'] ?? 'Report';
        $asOf = $data['as_of'] ?? now()->format('Y-m-d');
        $formattedDate = date('F d, Y', strtotime($asOf));

        if ($reportType === 'STATISTICAL_REPORT') {
            return $this->buildStatisticalPdfHtml($data, $formattedDate);
        } elseif ($reportType === 'YOUTH_PWD') {
            return $this->buildYouthPwdPdfHtml($data);
        } elseif ($reportType === 'DILG_FORMAT') {
            return $this->buildDilgPdfHtml($data);
        } elseif ($reportType === 'MASTERLIST') {
            return $this->buildMasterlistPdfHtml($data);
        }

        // Generic table
        $html = '<html><head><style>
            body { font-family: Arial, sans-serif; font-size: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #333; padding: 6px; text-align: center; }
            th { background-color: #B91C1C; color: white; }
            h2 { text-align: center; }
        </style></head><body>';
        $html .= "<h2>{$title}</h2>";
        $html .= "<p style='text-align:center'>Generated: {$data['generated_at']}</p>";

        if (!empty($data['rows'])) {
            $html .= '<table><thead><tr>';
            $headers = array_keys((array) $data['rows'][0]);
            foreach ($headers as $h) {
                $html .= "<th>" . strtoupper($h) . "</th>";
            }
            $html .= '</tr></thead><tbody>';
            foreach ($data['rows'] as $row) {
                $html .= '<tr>';
                foreach ((array) $row as $val) {
                    $html .= "<td>{$val}</td>";
                }
                $html .= '</tr>';
            }
            $html .= '</tbody></table>';
        }

        $html .= '</body></html>';
        return $html;
    }

    protected function buildMasterlistPdfHtml(array $data): string
    {
        $title = $data['title'] ?? 'PWD Masterlist';
        $generatedAt = $data['generated_at'] ?? now()->toDateTimeString();
        $totalCount = $data['total_count'] ?? count($data['rows'] ?? []);
        $formattedDate = date('F d, Y \a\t h:i A', strtotime($generatedAt));
        $totalPages = max(1, ceil($totalCount / 30)); // approximate for footer reference

        $html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
            /* ── Page & Body ── */
            @page {
                margin: 20mm 19mm 22mm 19mm; /* generous margins for hole-punching */
            }
            body {
                font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
                font-size: 9px;
                color: #1e293b;
                margin: 0;
                padding: 0;
                line-height: 1.4;
            }

            /* ── Header / Branding ── */
            .header-block {
                text-align: center;
                padding-bottom: 10px;
                margin-bottom: 12px;
                border-bottom: 3px solid #1B3A5C;
            }
            .header-block .office-name {
                font-size: 14px;
                font-weight: bold;
                color: #1B3A5C;
                letter-spacing: 1.5px;
                text-transform: uppercase;
                margin: 0 0 2px 0;
            }
            .header-block .municipality {
                font-size: 12px;
                font-weight: bold;
                color: #334155;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                margin: 0 0 1px 0;
            }
            .header-block .province {
                font-size: 10px;
                color: #64748b;
                font-style: italic;
                margin: 0;
            }

            /* ── Report title bar ── */
            .report-title-bar {
                background-color: #1B3A5C;
                color: #ffffff;
                text-align: center;
                padding: 7px 0;
                margin-bottom: 6px;
                font-size: 11px;
                font-weight: bold;
                letter-spacing: 1px;
                text-transform: uppercase;
            }

            /* ── Meta row ── */
            .meta-table {
                width: 100%;
                border: none;
                margin-bottom: 8px;
                border-collapse: collapse;
            }
            .meta-table td {
                border: none;
                padding: 2px 0;
                font-size: 8.5px;
                color: #475569;
            }

            /* ── Data Table ── */
            .data-table {
                width: 100%;
                border-collapse: collapse;
            }
            .data-table thead th {
                background-color: #2d4a6f;
                color: #ffffff;
                font-weight: bold;
                font-size: 7.5px;
                text-transform: uppercase;
                letter-spacing: 0.6px;
                padding: 8px 5px;
                text-align: left;
                border: 1px solid #1B3A5C;
            }
            .data-table thead th.center {
                text-align: center;
            }

            /* Data cells */
            .data-table tbody td {
                padding: 6px 5px;
                font-size: 8.5px;
                color: #1e293b;
                border-left: 1px solid #e2e8f0;
                border-right: 1px solid #e2e8f0;
                border-bottom: 1px solid #e2e8f0;
            }
            .data-table tbody td.center {
                text-align: center;
            }
            .data-table tbody td.name-cell {
                font-weight: 600;
            }

            /* Zebra striping — slightly more visible */
            .row-even td { background-color: #f0f4fa; }
            .row-odd td  { background-color: #ffffff; }

            /* ── Status badges ── */
            .badge {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 7px;
                font-weight: bold;
                letter-spacing: 0.5px;
                text-transform: uppercase;
            }
            .badge-active {
                background-color: #dcfce7;
                color: #15803d;
                border: 1px solid #bbf7d0;
            }
            .badge-deceased {
                background-color: #fef2f2;
                color: #991b1b;
                border: 1px solid #fecaca;
            }
            .badge-inactive {
                background-color: #f1f5f9;
                color: #64748b;
                border: 1px solid #e2e8f0;
            }

            /* ── Missing data ── */
            .na-text {
                color: #94a3b8;
                font-style: italic;
                font-size: 8px;
            }

            /* ── Summary footer row ── */
            .summary-row td {
                background-color: #1B3A5C !important;
                color: #ffffff;
                font-weight: bold;
                font-size: 8.5px;
                padding: 7px 5px;
                border: 1px solid #1B3A5C;
            }

            /* ── Document footer ── */
            .doc-footer {
                margin-top: 16px;
                padding-top: 8px;
                border-top: 1px solid #e2e8f0;
                font-size: 7.5px;
                color: #94a3b8;
            }
            .doc-footer table {
                width: 100%;
                border: none;
                border-collapse: collapse;
            }
            .doc-footer table td {
                border: none;
                padding: 1px 0;
                vertical-align: bottom;
            }
        </style></head><body>';

        // ── Header / Branding ──
        $html .= '<div class="header-block">';
        $html .= '<p class="office-name">Person with Disability Affairs Office</p>';
        $html .= '<p class="municipality">Municipality of Pagsanjan</p>';
        $html .= '<p class="province">Province of Laguna</p>';
        $html .= '</div>';

        // ── Report title bar ──
        $html .= '<div class="report-title-bar">' . e(strtoupper($title)) . '</div>';

        // ── Meta info row ──
        $html .= '<table class="meta-table"><tr>';
        $html .= '<td style="text-align:left">Total Records: <strong>' . $totalCount . '</strong></td>';
        $html .= '<td style="text-align:right">Date Generated: <strong>' . $formattedDate . '</strong></td>';
        $html .= '</tr></table>';

        if (!empty($data['rows'])) {
            // ── Data table ──
            $html .= '<table class="data-table"><thead><tr>';
            $html .= '<th class="center" style="width:4%">#</th>';
            $html .= '<th style="width:14%">PWD Number</th>';
            $html .= '<th style="width:22%">Full Name</th>';
            $html .= '<th class="center" style="width:5%">Sex</th>';
            $html .= '<th class="center" style="width:5%">Age</th>';
            $html .= '<th style="width:14%">Barangay</th>';
            $html .= '<th style="width:18%">Disability Type</th>';
            $html .= '<th class="center" style="width:9%">Status</th>';
            $html .= '</tr></thead><tbody>';

            foreach ($data['rows'] as $index => $row) {
                $row = (array) $row;
                $num = $index + 1;
                $rowClass = ($index % 2 === 0) ? 'row-even' : 'row-odd';

                // Handle missing data with "N/A" instead of blanks
                $pwdNumber = !empty($row['pwd_number'])
                    ? e($row['pwd_number'])
                    : '<span class="na-text">N/A</span>';
                $name = !empty($row['name']) ? e($row['name']) : '<span class="na-text">N/A</span>';
                $sex = !empty($row['sex']) ? e($row['sex']) : '<span class="na-text">N/A</span>';
                $age = (isset($row['age']) && $row['age'] !== '' && $row['age'] !== null)
                    ? e($row['age'])
                    : '<span class="na-text">N/A</span>';
                $barangay = !empty($row['barangay']) ? e($row['barangay']) : '<span class="na-text">N/A</span>';
                $disability = !empty($row['disability_type']) ? e($row['disability_type']) : '<span class="na-text">N/A</span>';

                $status = strtoupper($row['status'] ?? '');
                if ($status === 'ACTIVE') {
                    $statusHtml = '<span class="badge badge-active">Active</span>';
                } elseif ($status === 'DECEASED') {
                    $statusHtml = '<span class="badge badge-deceased">Deceased</span>';
                } elseif ($status !== '') {
                    $statusHtml = '<span class="badge badge-inactive">' . e($status) . '</span>';
                } else {
                    $statusHtml = '<span class="na-text">N/A</span>';
                }

                $html .= '<tr class="' . $rowClass . '">';
                $html .= '<td class="center">' . $num . '</td>';
                $html .= '<td>' . $pwdNumber . '</td>';
                $html .= '<td class="name-cell">' . $name . '</td>';
                $html .= '<td class="center">' . $sex . '</td>';
                $html .= '<td class="center">' . $age . '</td>';
                $html .= '<td>' . $barangay . '</td>';
                $html .= '<td>' . $disability . '</td>';
                $html .= '<td class="center">' . $statusHtml . '</td>';
                $html .= '</tr>';
            }

            // ── Summary footer row ──
            $html .= '<tr class="summary-row">';
            $html .= '<td class="center" colspan="2">TOTAL RECORDS</td>';
            $html .= '<td colspan="6" style="text-align:left">' . $totalCount . ' registered person(s) with disability</td>';
            $html .= '</tr>';

            $html .= '</tbody></table>';
        } else {
            $html .= '<p style="text-align:center; color:#94a3b8; padding:30px; font-size:10px;">No records found matching the specified criteria.</p>';
        }

        // ── Document footer ──
        $html .= '<div class="doc-footer"><table><tr>';
        $html .= '<td style="text-align:left">This is a system-generated document from the PDAO Management System. &mdash; Not valid without official seal.</td>';
        $html .= '<td style="text-align:right">Page 1</td>';
        $html .= '</tr></table></div>';

        $html .= '</body></html>';
        return $html;
    }

    protected function buildStatisticalPdfHtml(array $data, string $formattedDate): string
    {
        $municipality = $data['municipality'] ?? 'NAME OF LGU';
        $html = '<html><head><style>
            body { font-family: Arial, sans-serif; font-size: 9px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #fff; padding: 5px; text-align: center; }
            .header { background-color: #B91C1C; color: white; font-weight: bold; }
            .total-row { background-color: #B91C1C; color: white; font-weight: bold; }
            h2, h3 { text-align: center; margin: 2px 0; }
        </style></head><body>';
        $html .= "<h2>{$municipality}</h2>";
        $html .= "<h3>TOTAL NUMBER OF REGISTERED PERSONS WITH DISABILITIES AS OF " . strtoupper($formattedDate) . "</h3>";
        $html .= '<table><thead>';
        $html .= '<tr class="header"><th rowspan="2">NO.</th><th rowspan="2">TYPE OF DISABILITY</th>';
        $html .= '<th colspan="2">1MO.-17 YRS OLD</th><th colspan="2">18-30 YRS OLD</th>';
        $html .= '<th colspan="2">31-59 YRS OLD</th><th colspan="2">60 YRS OLD & ABOVE</th>';
        $html .= '<th rowspan="2">TOTAL</th></tr>';
        $html .= '<tr class="header"><th>Male</th><th>Female</th><th>Male</th><th>Female</th><th>Male</th><th>Female</th><th>Male</th><th>Female</th></tr>';
        $html .= '</thead><tbody>';

        $totals = ['g1_m'=>0,'g1_f'=>0,'g2_m'=>0,'g2_f'=>0,'g3_m'=>0,'g3_f'=>0,'g4_m'=>0,'g4_f'=>0,'total'=>0];
        foreach ($data['rows'] as $r) {
            $r = (array)$r;
            $rt = ($r['g1_male']??0)+($r['g1_female']??0)+($r['g2_male']??0)+($r['g2_female']??0)+($r['g3_male']??0)+($r['g3_female']??0)+($r['g4_male']??0)+($r['g4_female']??0);
            $html .= "<tr><td>{$r['no']}</td><td style='text-align:left'>{$r['type']}</td>";
            $html .= "<td>{$r['g1_male']}</td><td>{$r['g1_female']}</td>";
            $html .= "<td>{$r['g2_male']}</td><td>{$r['g2_female']}</td>";
            $html .= "<td>{$r['g3_male']}</td><td>{$r['g3_female']}</td>";
            $html .= "<td>{$r['g4_male']}</td><td>{$r['g4_female']}</td>";
            $html .= "<td><b>{$rt}</b></td></tr>";
            $totals['g1_m']+=$r['g1_male']??0; $totals['g1_f']+=$r['g1_female']??0;
            $totals['g2_m']+=$r['g2_male']??0; $totals['g2_f']+=$r['g2_female']??0;
            $totals['g3_m']+=$r['g3_male']??0; $totals['g3_f']+=$r['g3_female']??0;
            $totals['g4_m']+=$r['g4_male']??0; $totals['g4_f']+=$r['g4_female']??0;
            $totals['total']+=$rt;
        }

        $html .= '<tr class="total-row"><td colspan="2">TOTAL</td>';
        $html .= "<td>{$totals['g1_m']}</td><td>{$totals['g1_f']}</td>";
        $html .= "<td>{$totals['g2_m']}</td><td>{$totals['g2_f']}</td>";
        $html .= "<td>{$totals['g3_m']}</td><td>{$totals['g3_f']}</td>";
        $html .= "<td>{$totals['g4_m']}</td><td>{$totals['g4_f']}</td>";
        $html .= "<td>{$totals['total']}</td></tr>";
        $html .= '</tbody></table></body></html>';

        return $html;
    }

    protected function buildYouthPwdPdfHtml(array $data): string
    {
        $year = $data['year'] ?? now()->year;
        $html = '<html><head><style>
            body { font-family: Arial, sans-serif; font-size: 9px; }
            .container { display: flex; flex-direction: row; align-items: flex-start; }
            .main-table { width: 70%; border-collapse: collapse; margin-top: 10px; float: left; }
            .summary-table { width: 25%; border-collapse: collapse; margin-top: 10px; float: right; }
            th, td { border: 1px solid #333; padding: 5px; text-align: center; }
            th { background-color: #FF8C42; font-weight: bold; }
            h2 { text-align: center; background-color: #FF8C42; padding: 10px; margin: 0; }
            .clearfix::after { content: ""; clear: both; display: table; }
        </style></head><body>';
        $html .= "<h2>No. of children with disabilities issued with IDs (17 years old and below) {$year}</h2>";
        $html .= '<div class="clearfix">';
        
        // Detailed Table
        $html .= '<table class="main-table"><thead><tr>';
        $html .= '<th>ID NUMBER</th><th>SURNAME</th><th>NAME</th><th>MIDDLE NAME</th><th>GENDER</th><th>AGE</th><th>DISABILITY</th><th>BARANGAY</th>';
        $html .= '</tr></thead><tbody>';

        $detailedRows = $data['detailed_rows'] ?? [];
        foreach ($detailedRows as $r) {
            $r = (array)$r;
            $html .= '<tr>';
            $html .= "<td>{$r['id_number']}</td><td>{$r['surname']}</td><td>{$r['name']}</td>";
            $html .= "<td>" . ($r['middle_name'] ?: '—') . "</td><td>" . ($r['gender'] ?: '—') . "</td><td>{$r['age']}</td>";
            $html .= "<td>{$r['disability']}</td><td>{$r['barangay']}</td>";
            $html .= '</tr>';
        }
        $html .= '</tbody></table>';

        // Summary Table
        $html .= '<table class="summary-table"><thead><tr>';
        $html .= '<th>Disability</th><th>Total</th>';
        $html .= '</tr></thead><tbody>';
        $summaryRows = $data['rows'] ?? [];
        foreach ($summaryRows as $sr) {
            $sr = (array)$sr;
            $html .= '<tr>';
            $html .= "<td style='text-align:left'>{$sr['disability_type']}</td><td>{$sr['total']}</td>";
            $html .= '</tr>';
        }
        $html .= '</tbody></table>';

        $html .= '</div></body></html>';
        return $html;
    }

    protected function buildDilgPdfHtml(array $data): string
    {
        $municipality = $data['municipality'] ?? 'Pagsanjan';
        $province = $data['province'] ?? 'Laguna';
        $asOf = $data['as_of'] ?? now()->format('Y-m-d');
        $formattedDate = date('F d, Y', strtotime($asOf));
        
        $html = '<html><head><style>
            body { font-family: Arial, sans-serif; font-size: 10px; color: #1e293b; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px; }
            th { background-color: #1e293b; color: white; font-weight: bold; text-transform: uppercase; font-size: 8px; text-align: center; }
            .group-header { background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
            .sub-header { background-color: #334155; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .text-bold { font-weight: bold; }
            .total-row { background-color: #f1f5f9; font-weight: bold; border-top: 2px solid #1e293b; }
            h2, h3, h4 { text-align: center; margin: 2px 0; color: #0f172a; }
            .pct { color: #64748b; font-size: 8px; }
        </style></head><body>';
        $html .= "<h2>Comprehensive PWD Demographic Profile</h2>";
        $html .= "<h3>Municipality of {$municipality}, {$province}</h3>";
        $html .= "<h4>As of: {$formattedDate}</h4>";

        $html .= '<table><thead>';
        $html .= '<tr><th rowspan="2">Type of Disability</th><th colspan="3" class="group-header">Age Groups</th>';
        $html .= '<th colspan="2" class="group-header">Sex (Disaggregated)</th><th rowspan="2">Total</th><th rowspan="2">% of Total</th></tr>';
        $html .= '<tr class="sub-header"><th>0-17</th><th>18-59</th><th>60+</th><th>Male</th><th>Female</th></tr>';
        $html .= '</thead><tbody>';

        $totals = ['p'=>0, 'a'=>0, 's'=>0, 'male'=>0, 'female'=>0, 'total'=>0];
        foreach ($data['rows'] as $r) {
            $r = (array)$r;
            $html .= "<tr><td>{$r['disability_type']}</td>";
            $html .= "<td class='text-right'>{$r['age_pediatric']}</td>";
            $html .= "<td class='text-right'>{$r['age_adult']}</td>";
            $html .= "<td class='text-right'>{$r['age_senior']}</td>";
            $html .= "<td class='text-right'>{$r['male']}</td>";
            $html .= "<td class='text-right'>{$r['female']}</td>";
            $html .= "<td class='text-right text-bold'>{$r['total']}</td>";
            $html .= "<td class='text-right pct'>{$r['percentage']}%</td></tr>";
            
            $totals['p'] += $r['age_pediatric'];
            $totals['a'] += $r['age_adult'];
            $totals['s'] += $r['age_senior'];
            $totals['male'] += $r['male'];
            $totals['female'] += $r['female'];
            $totals['total'] += $r['total'];
        }

        $html .= '<tr class="total-row"><td>TOTAL</td>';
        $html .= '<td class="text-right">' . $totals['p'] . '</td>';
        $html .= '<td class="text-right">' . $totals['a'] . '</td>';
        $html .= '<td class="text-right">' . $totals['s'] . '</td>';
        $html .= '<td class="text-right">' . $totals['male'] . '</td>';
        $html .= '<td class="text-right">' . $totals['female'] . '</td>';
        $html .= '<td class="text-right">' . $totals['total'] . '</td>';
        $html .= '<td class="text-right">100%</td></tr>';
        
        $html .= '</tbody></table></body></html>';

        return $html;
    }

    protected function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));
        
        return round($bytes, 2) . ' ' . $units[$pow];
    }
}
