import React, { useState, useEffect, useCallback } from 'react';
import Skeleton from '../components/Skeleton';
import { 
  FileText, 
  FileSpreadsheet, 
  Download, 
  Filter,
  Loader2,
  Copy,
  Printer,
  BarChart3,
  Baby,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { 
  reportsApi 
} from '../api';
import Modal, { useModal } from '../components/Modal';
import DatePicker from '../components/DatePicker';

type ReportTabType = 'stats' | 'youth' | 'quarterly';

interface StatisticalReportRow {
  no: number;
  type: string;
  g1_male: number;
  g1_female: number;
  g2_male: number;
  g2_female: number;
  g3_male: number;
  g3_female: number;
  g4_male: number;
  g4_female: number;
}

interface YouthDisabilityRow {
  disabilityType: string;
  male: number;
  female: number;
  total: number;
}

interface YouthDetailedRow {
  id_number: string;
  surname: string;
  name: string;
  middle_name: string;
  gender: string;
  age: number;
  disability: string;
  barangay: string;
}

interface DILGReportRow {
  disabilityType: string;
  age_pediatric: number;
  age_adult: number;
  age_senior: number;
  male: number;
  female: number;
  total: number;
}

interface QuarterlyDayRow {
  date: string;
  new: number;
  renewal: number;
  transfer: number;
  lost: number;
  total: number;
}

interface QuarterlyMonthData {
  month: string;
  month_num: number;
  rows: QuarterlyDayRow[];
  totals: { new: number; renewal: number; transfer: number; lost: number; total: number };
}

interface GeneratedReport {
  id: number;
  fileName: string;
  reportType: string;
  type: 'EXCEL' | 'PDF';
  size: string;
  dateGenerated: string;
  file_path?: string;
}

const formatAsOfDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  } catch (e) {
    return dateString;
  }
};

const Reports: React.FC = () => {
  const [generating, setGenerating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ReportTabType>('stats');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [statsAsOfDate, setStatsAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [youthAsOfDate, setYouthAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [youthYear, setYouthYear] = useState(new Date().getFullYear().toString());
  const [quarterlyYear, setQuarterlyYear] = useState(new Date().getFullYear().toString());
  
  // Report data states
  const [youthData, setYouthData] = useState<YouthDisabilityRow[]>([]);
  const [youthDetailedData, setYouthDetailedData] = useState<YouthDetailedRow[]>([]);
  const [statsData, setStatsData] = useState<StatisticalReportRow[]>([]);
  const [quarterlyData, setQuarterlyData] = useState<QuarterlyMonthData[]>([]);
  const [quarterlyTotals, setQuarterlyTotals] = useState<any[]>([]);
  const [quarterlyYtd, setQuarterlyYtd] = useState<any>({ new: 0, renewal: 0, transfer: 0, lost: 0, total: 0 });
  const [totalPwdRecords, setTotalPwdRecords] = useState(0);
  
  const { modalState, showAlert, showConfirm, hideModal } = useModal();
  
  // Fetch statistical report data with date filter
  const fetchStatsData = useCallback(async () => {
    setRefreshing(true);
    try {
      const statsResult = await reportsApi.preview('STATISTICAL_REPORT', { as_of_date: statsAsOfDate } as any);
      const sData = (statsResult?.rows || []).map((r: any) => ({
        ...r,
        g1_male: Number(r.g1_male || 0),
        g1_female: Number(r.g1_female || 0),
        g2_male: Number(r.g2_male || 0),
        g2_female: Number(r.g2_female || 0),
        g3_male: Number(r.g3_male || 0),
        g3_female: Number(r.g3_female || 0),
        g4_male: Number(r.g4_male || 0),
        g4_female: Number(r.g4_female || 0)
      }));
      setStatsData(sData);
      if (sData.length > 0) {
        const total = sData.reduce((sum: number, r: any) => 
          sum + ((r.g1_male||0) + (r.g1_female||0) + (r.g2_male||0) + (r.g2_female||0) + (r.g3_male||0) + (r.g3_female||0) + (r.g4_male||0) + (r.g4_female||0)), 0);
        setTotalPwdRecords(total);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setRefreshing(false);
    }
  }, [statsAsOfDate]);

  // Fetch youth PWD data
  const fetchYouthData = useCallback(async () => {
    setRefreshing(true);
    try {
      const youthResult = await reportsApi.preview('YOUTH_PWD', { as_of_date: youthAsOfDate, year: parseInt(youthYear) } as any);

      const youthRows = (youthResult as any)?.rows || [];
      setYouthData(youthRows.map((row: any) => ({
        disabilityType: row.disability_type || row.disabilityType,
        male: Number(row.male || 0),
        female: Number(row.female || 0),
        total: Number(row.total || 0)
      })));

      const detailedRows = (youthResult as any)?.detailed_rows || [];
      setYouthDetailedData(detailedRows.map((r: any) => ({
        id_number: r.id_number || '',
        surname: r.surname || '',
        name: r.name || '',
        middle_name: r.middle_name || '',
        gender: r.gender || '',
        age: Number(r.age || 0),
        disability: r.disability || '',
        barangay: r.barangay || ''
      })));
    } catch (err) {
      console.error('Error fetching youth data:', err);
    } finally {
      setRefreshing(false);
    }
  }, [youthAsOfDate, youthYear]);

  // Fetch quarterly report data
  const fetchQuarterlyData = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await reportsApi.preview('QUARTERLY_REPORT', { year: parseInt(quarterlyYear) } as any);
      const qData = result as any;
      if (qData) {
        setQuarterlyData(qData.months || []);
        setQuarterlyTotals(qData.quarters || []);
        setQuarterlyYtd(qData.ytd || { new: 0, renewal: 0, transfer: 0, lost: 0, total: 0 });
      }
    } catch (err) {
      console.error('Error fetching quarterly data:', err);
    } finally {
      setRefreshing(false);
    }
  }, [quarterlyYear]);

  // Fetch initial report data (History + Initial Tab)
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Only fetch the initial tab's data (Statistical Report)
      await fetchStatsData();
    } catch (err: any) {
      console.error('Error fetching initial report data:', err);
      if (err.response?.status !== 401) {
        setError('Failed to load report data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [fetchStatsData]);

  // Initial load
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Tab-specific lazy loading and filter updates
  useEffect(() => {
    if (loading) return; // Don't trigger if already doing initial load

    if (activeTab === 'stats') {
      fetchStatsData();
    } else if (activeTab === 'youth') {
      fetchYouthData();
    } else if (activeTab === 'quarterly') {
      fetchQuarterlyData();
    }
  }, [
    activeTab, 
    statsAsOfDate, 
    youthAsOfDate, 
    youthYear, 
    quarterlyYear,
    fetchStatsData,
    fetchYouthData,
    fetchQuarterlyData
  ]);

  useEffect(() => {
    if (youthAsOfDate) {
      setYouthYear(new Date(youthAsOfDate).getFullYear().toString());
    }
  }, [youthAsOfDate]);

  const handleExport = async (type: 'copy' | 'csv' | 'excel' | 'pdf' | 'print') => {
    const reportTypeMap: Record<string, string> = {
      stats: 'STATISTICAL_REPORT',
      youth: 'YOUTH_PWD',
      quarterly: 'QUARTERLY_REPORT',
    };
    
    if (type === 'print') {
      window.print();
      return;
    }
    
    if (type === 'copy') {
      let data: any;
      if (activeTab === 'stats') data = statsData;
      else if (activeTab === 'youth') data = youthDetailedData.length > 0 ? youthDetailedData : youthData;
      else if (activeTab === 'quarterly') data = quarterlyData;
      const text = JSON.stringify(data, null, 2);
      await navigator.clipboard.writeText(text);
      showAlert('Copied', 'Data copied to clipboard!', 'success');
      return;
    }
    
    const format = type === 'csv' ? 'CSV' : type === 'excel' ? 'EXCEL' : 'PDF';
    
    // Ensure we have a valid report type for the active tab
    const reportType = reportTypeMap[activeTab];
    if (!reportType) {
      showAlert('Error', 'This tab data cannot be exported directly. Please use the generate buttons in the respective sections.', 'error');
      return;
    }

    setGenerating(`${type}-${activeTab}`);
    try {
      let filters: any = {};
      if (activeTab === 'stats') filters.as_of_date = statsAsOfDate;
      if (activeTab === 'youth') { filters.as_of_date = youthAsOfDate; filters.year = parseInt(youthYear); }
      if (activeTab === 'quarterly') filters.year = parseInt(quarterlyYear);

      const result = await (reportsApi.generate as any)({
        report_type: reportType,
        file_type: format,
        filters
      });
      
      const reportId = result.id || result.data?.id;
      if (reportId) {
        await reportsApi.download(reportId);
      }
    } catch (err: any) {
      console.error('Export error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to export. Please try again.';
      showAlert('Error', errorMessage, 'error');
    } finally {
      setGenerating(null);
    }
  };

  const tabs = [
    { id: 'stats' as ReportTabType, label: 'Statistical Report', icon: BarChart3 },
    { id: 'youth' as ReportTabType, label: 'Youth PWD (17 & below)', icon: Baby },
    { id: 'quarterly' as ReportTabType, label: 'Quarterly Report', icon: TrendingUp },
  ];

  const yearOptions = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());

  const statsTotals = statsData.reduce((acc, row) => ({
    g1_m: acc.g1_m + (row.g1_male || 0),
    g1_f: acc.g1_f + (row.g1_female || 0),
    g2_m: acc.g2_m + (row.g2_male || 0),
    g2_f: acc.g2_f + (row.g2_female || 0),
    g3_m: acc.g3_m + (row.g3_male || 0),
    g3_f: acc.g3_f + (row.g3_female || 0),
    g4_m: acc.g4_m + (row.g4_male || 0),
    g4_f: acc.g4_f + (row.g4_female || 0),
    total: acc.total + ((row.g1_male||0) + (row.g1_female||0) + (row.g2_male||0) + (row.g2_female||0) + (row.g3_male||0) + (row.g3_female||0) + (row.g4_male||0) + (row.g4_female||0))
  }), { g1_m: 0, g1_f: 0, g2_m: 0, g2_f: 0, g3_m: 0, g3_f: 0, g4_m: 0, g4_f: 0, total: 0 });

  const youthTotals = youthData.reduce(
    (acc, row) => ({ male: acc.male + row.male, female: acc.female + row.female, total: acc.total + row.total }),
    { male: 0, female: 0, total: 0 }
  );

  const renderAppliedFilters = () => {
    const filters: string[] = [];
    
    if (activeTab === 'stats') {
      filters.push(`As of: ${formatAsOfDate(statsAsOfDate)}`);
    } else if (activeTab === 'youth') {
      filters.push(`As of: ${formatAsOfDate(youthAsOfDate)}`);
      filters.push(`Year: ${youthYear}`);
    } else if (activeTab === 'quarterly') {
      filters.push(`Year: ${quarterlyYear}`);
    }

    if (filters.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {filters.map((f, i) => (
          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <Filter size={10} className="mr-1 opacity-50" />
            {f}
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-48 rounded-xl" />
        </div>
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden">
          <div className="flex gap-2 p-6 border-b border-slate-100 dark:border-slate-800">
             <Skeleton className="h-10 w-32 rounded-xl" />
             <Skeleton className="h-10 w-32 rounded-xl" />
             <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
          <div className="p-6 space-y-4">
             <Skeleton className="h-8 w-full" />
             <Skeleton className="h-64 w-full" />
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Export buttons component
  const ExportBar = () => (
    <div className="flex flex-nowrap overflow-x-auto items-center gap-2 px-4 md:px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 flex-shrink-0">Export:</span>
      {[
        { type: 'copy' as const, label: 'Copy', icon: Copy },
        { type: 'csv' as const, label: 'CSV', icon: FileText },
        { type: 'excel' as const, label: 'Excel', icon: FileSpreadsheet },
        { type: 'pdf' as const, label: 'PDF', icon: FileText },
        { type: 'print' as const, label: 'Print', icon: Printer },
      ].map((btn) => {
        const Icon = btn.icon;
        const isLoading = generating === `${btn.type}-${activeTab}`;
        return (
          <button
            key={btn.type}
            onClick={() => handleExport(btn.type)}
            disabled={generating !== null}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
            {btn.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 print:space-y-0 print:max-w-none print:m-0">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: landscape;
            margin: 8mm;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-no-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .print-table td, .print-table th {
            padding-top: 4px !important;
            padding-bottom: 4px !important;
            font-size: 9px !important;
          }
          .print-table th {
            font-size: 8px !important;
          }
          .print-title {
            margin-bottom: 10px !important;
            padding-top: 0 !important;
            padding-bottom: 10px !important;
          }
          .print-container {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}} />
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Reports & Analytics</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">View statistical reports and export comprehensive data records.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
              <BarChart3 size={14} className="inline mr-2" />
              Total PWD Records: <span className="text-blue-700 dark:text-blue-300">{totalPwdRecords}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Report Data Tables Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-xl shadow-slate-200/20 dark:shadow-slate-900/30 overflow-hidden print:border-none print:shadow-none print:rounded-none">
        
        {/* Tab Navigation */}
        <div className="flex flex-nowrap overflow-x-auto items-center gap-2 px-4 md:px-6 py-4 md:py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 print:hidden scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-lg shadow-slate-400/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Export Buttons Bar - shown for report tabs only */}
        <div className="print:hidden">
          <ExportBar />
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto print:overflow-visible">
          
          {/* ============================== STATISTICAL REPORT ============================== */}
          {activeTab === 'stats' && (
            <div>
              {/* Date Filter Bar */}
              <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 border-b border-slate-100 dark:border-slate-800 print:hidden">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 uppercase text-center md:text-left">
                      Statistical Report
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center md:text-left">
                      Total number of registered persons with disabilities by age group and gender
                    </p>
                    {renderAppliedFilters()}
                  </div>
                  <div className="flex items-start gap-3 w-full md:w-auto">
                    <div className="space-y-1 w-full md:w-64">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">As of Date</label>
                      <DatePicker 
                        value={statsAsOfDate}
                        onChange={setStatsAsOfDate}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="px-6 py-3 bg-red-900/5 dark:bg-red-900/10 print:bg-transparent print:py-1 print-title">
                <h3 className="text-md font-bold text-slate-800 dark:text-slate-200 uppercase text-center print:text-sm">
                    Municipality of Pagsanjan
                </h3>
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 text-center uppercase print:text-xs">
                  TOTAL NUMBER OF REGISTERED PERSONS WITH DISABILITIES AS OF {formatAsOfDate(statsAsOfDate).toUpperCase()}
                </h4>
              </div>

              {/* Table */}
              <div className="overflow-x-auto p-4 md:p-6 print:p-0">
                <table className="w-full text-left border-collapse bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 print:text-[8px] print-table">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/50 text-[#B91C1C] dark:text-red-500 border-b-2 border-red-700/20 print:border-b">
                      <th rowSpan={2} className="px-2 py-4 text-[10px] font-black uppercase tracking-wider text-center w-12 border-r border-slate-100 dark:border-slate-800 print:py-1">No.</th>
                      <th rowSpan={2} className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-center border-r border-slate-100 dark:border-slate-800 print:py-1">Type of Disability</th>
                      <th colSpan={2} className="px-2 py-2 text-[10px] font-black uppercase tracking-wider text-center border-r border-slate-100 dark:border-slate-800 print:py-1">1mo. - 17 yrs. old</th>
                      <th colSpan={2} className="px-2 py-2 text-[10px] font-black uppercase tracking-wider text-center border-r border-slate-100 dark:border-slate-800 print:py-1">18 - 30 yrs. old</th>
                      <th colSpan={2} className="px-2 py-2 text-[10px] font-black uppercase tracking-wider text-center border-r border-slate-100 dark:border-slate-800 print:py-1">31 - 59 yrs. old</th>
                      <th colSpan={2} className="px-2 py-2 text-[10px] font-black uppercase tracking-wider text-center border-r border-slate-100 dark:border-slate-800 print:py-1">60 yrs old & above</th>
                      <th rowSpan={2} className="px-4 py-4 text-[10px] font-black uppercase tracking-wider text-center print:py-1">TOTAL</th>
                    </tr>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 print:border-b">
                      <th className="px-2 py-2 text-[9px] font-bold text-center border-r border-slate-100 dark:border-slate-800 print:py-0.5">Male</th>
                      <th className="px-2 py-2 text-[9px] font-bold text-center border-r border-slate-100 dark:border-slate-800 print:py-0.5">Female</th>
                      <th className="px-2 py-2 text-[9px] font-bold text-center border-r border-slate-100 dark:border-slate-800 print:py-0.5">Male</th>
                      <th className="px-2 py-2 text-[9px] font-bold text-center border-r border-slate-100 dark:border-slate-800 print:py-0.5">Female</th>
                      <th className="px-2 py-2 text-[9px] font-bold text-center border-r border-slate-100 dark:border-slate-800 print:py-0.5">Male</th>
                      <th className="px-2 py-2 text-[9px] font-bold text-center border-r border-slate-100 dark:border-slate-800 print:py-0.5">Female</th>
                      <th className="px-2 py-2 text-[9px] font-bold text-center border-r border-slate-100 dark:border-slate-800 print:py-0.5">Male</th>
                      <th className="px-2 py-2 text-[9px] font-bold text-center border-r border-slate-100 dark:border-slate-800 print:py-0.5">Female</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {statsData.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-6 py-8 text-center text-slate-500">
                          No data available for the selected date.
                        </td>
                      </tr>
                    ) : statsData.map((row) => {
                      const rowTotal = ((row.g1_male||0) + (row.g1_female||0) + (row.g2_male||0) + (row.g2_female||0) + (row.g3_male||0) + (row.g3_female||0) + (row.g4_male||0) + (row.g4_female||0));
                      
                      const renderVal = (v: number, color: string) => {
                        if (v === 0) return <span className="text-slate-300 dark:text-slate-600">—</span>;
                        return <span className={`${color} font-semibold`}>{v}</span>;
                      };

                      return (
                        <tr key={row.no} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors print:hover:bg-transparent">
                          <td className="px-2 py-4 text-xs text-center text-slate-400 dark:text-slate-500 print:py-1 print:text-[9px]">{row.no}</td>
                          <td className="px-4 py-4 text-xs font-medium text-slate-700 dark:text-slate-200 print:py-1 print:text-[9px]">{row.type}</td>
                          <td className="px-2 py-4 text-xs text-center print:py-1 print:text-[9px]">{renderVal(row.g1_male, 'text-blue-600 dark:text-blue-400')}</td>
                          <td className="px-2 py-4 text-xs text-center border-r border-slate-100 dark:border-slate-800 print:py-1 print:border-r print:text-[9px]">{renderVal(row.g1_female, 'text-pink-600 dark:text-pink-400')}</td>
                          <td className="px-2 py-4 text-xs text-center print:py-1 print:text-[9px]">{renderVal(row.g2_male, 'text-blue-600 dark:text-blue-400')}</td>
                          <td className="px-2 py-4 text-xs text-center border-r border-slate-100 dark:border-slate-800 print:py-1 print:border-r print:text-[9px]">{renderVal(row.g2_female, 'text-pink-600 dark:text-pink-400')}</td>
                          <td className="px-2 py-4 text-xs text-center print:py-1 print:text-[9px]">{renderVal(row.g3_male, 'text-blue-600 dark:text-blue-400')}</td>
                          <td className="px-2 py-4 text-xs text-center border-r border-slate-100 dark:border-slate-800 print:py-1 print:border-r print:text-[9px]">{renderVal(row.g3_female, 'text-pink-600 dark:text-pink-400')}</td>
                          <td className="px-2 py-4 text-xs text-center print:py-1 print:text-[9px]">{renderVal(row.g4_male, 'text-blue-600 dark:text-blue-400')}</td>
                          <td className="px-2 py-4 text-xs text-center print:py-1 print:text-[9px]">{renderVal(row.g4_female, 'text-pink-600 dark:text-pink-400')}</td>
                          <td className="px-2 py-4 text-xs font-black text-center bg-slate-50/30 dark:bg-slate-800/20 text-red-700 dark:text-red-400 print:py-1 print:text-[9px]">{rowTotal}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {statsData.length > 0 && (
                    <tfoot>
                      <tr className="bg-white dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-700 print:border-t">
                        <td colSpan={2} className="px-6 py-5 text-sm font-black text-center uppercase tracking-wide text-slate-800 dark:text-white print:py-2 print:text-[10px]">TOTAL</td>
                        <td className="px-2 py-5 text-sm font-black text-center text-blue-700 dark:text-blue-400 print:py-2 print:text-[10px]">{statsTotals.g1_m}</td>
                        <td className="px-2 py-5 text-sm font-black text-center text-pink-700 dark:text-pink-400 border-r border-slate-100 dark:border-slate-800 print:py-2 print:border-r print:text-[10px]">{statsTotals.g1_f}</td>
                        <td className="px-2 py-5 text-sm font-black text-center text-blue-700 dark:text-blue-400 print:py-2 print:text-[10px]">{statsTotals.g2_m}</td>
                        <td className="px-2 py-5 text-sm font-black text-center text-pink-700 dark:text-pink-400 border-r border-slate-100 dark:border-slate-800 print:py-2 print:border-r print:text-[10px]">{statsTotals.g2_f}</td>
                        <td className="px-2 py-5 text-sm font-black text-center text-blue-700 dark:text-blue-400 print:py-2 print:text-[10px]">{statsTotals.g3_m}</td>
                        <td className="px-2 py-5 text-sm font-black text-center text-pink-700 dark:text-pink-400 border-r border-slate-100 dark:border-slate-800 print:py-2 print:border-r print:text-[10px]">{statsTotals.g3_f}</td>
                        <td className="px-2 py-5 text-sm font-black text-center text-blue-700 dark:text-blue-400 print:py-2 print:text-[10px]">{statsTotals.g4_m}</td>
                        <td className="px-2 py-5 text-sm font-black text-center text-pink-700 dark:text-pink-400 print:py-2 print:text-[10px]">{statsTotals.g4_f}</td>
                        <td className="px-2 py-5 text-lg font-black text-center bg-slate-100 dark:bg-slate-800 text-red-700 dark:text-red-400 shadow-inner print:py-2 print:text-xs">{statsTotals.total}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* ============================== YOUTH PWD (17 & below) ============================== */}
          {activeTab === 'youth' && (
            <div>
              {/* Date/Year Filter Bar */}
              <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 border-b border-slate-100 dark:border-slate-800 print:hidden">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 uppercase">
                      Youth PWD Report (17 Years Old & Below)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Number of children with disabilities issued with IDs
                    </p>
                    {renderAppliedFilters()}
                  </div>
                  <div className="flex items-start gap-3 w-full md:w-auto">
                    <div className="space-y-1 w-full md:w-64">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">As of Date</label>
                      <DatePicker 
                        value={youthAsOfDate}
                        onChange={setYouthAsOfDate}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Screen Version - Standard styles */}
              <div className="p-4 md:p-6 print:hidden">
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase mb-3">
                    Summary by Disability Type
                  </h4>
                  <table className="w-full text-left border-collapse bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-slate-800/50 text-[#B91C1C] dark:text-red-500 border-b-2 border-red-700/20">
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider">
                          Type of Disability
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-center">
                          Male
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-center">
                          Female
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-center">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {youthData.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                            No data available for the selected filters.
                          </td>
                        </tr>
                      ) : youthData.map((row, index) => (
                        <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                          <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                            {row.disabilityType}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-center text-blue-600 dark:text-blue-400">
                            {row.male === 0 ? <span className="text-slate-300 dark:text-slate-600">—</span> : row.male}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-center text-pink-600 dark:text-pink-400">
                            {row.female === 0 ? <span className="text-slate-300 dark:text-slate-600">—</span> : row.female}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-center text-slate-800 dark:text-slate-200">
                            {row.total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {youthData.length > 0 && (
                      <tfoot>
                        <tr className="bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-200 dark:border-slate-700">
                          <td className="px-6 py-4 text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-300">Total</td>
                          <td className="px-6 py-4 text-sm font-black text-center text-blue-700 dark:text-blue-400">{youthTotals.male}</td>
                          <td className="px-6 py-4 text-sm font-black text-center text-pink-700 dark:text-pink-400">{youthTotals.female}</td>
                          <td className="px-6 py-4 text-lg font-black text-center text-slate-900 dark:text-white">{youthTotals.total}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Detailed Records Table */}
                {youthDetailedData.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase mb-3">
                      Detailed Records — {youthDetailedData.length} children with IDs (17 years old and below)
                    </h4>
                    <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm">
                      <table className="w-full text-left border-collapse bg-white dark:bg-slate-900">
                        <thead>
                          <tr className="bg-slate-50/80 dark:bg-slate-800/50 text-[#B91C1C] dark:text-red-500 border-b-2 border-red-700/20">
                            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider text-center">ID Number</th>
                            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider">Surname</th>
                            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider">Name</th>
                            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider">Middle Name</th>
                            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider text-center">Gender</th>
                            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider text-center">Age</th>
                            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider">Disability</th>
                            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider">Barangay</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {youthDetailedData.map((row, index) => (
                            <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                              <td className="px-4 py-3.5 text-xs font-mono text-center text-slate-700 dark:text-slate-300">{row.id_number || '—'}</td>
                              <td className="px-4 py-3.5 text-xs font-bold text-slate-700 dark:text-slate-300">{row.surname}</td>
                              <td className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300">{row.name}</td>
                              <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">{row.middle_name || '—'}</td>
                              <td className="px-4 py-3.5 text-xs text-center text-slate-600 dark:text-slate-400">{row.gender || '—'}</td>
                              <td className="px-4 py-3.5 text-xs text-center font-black text-slate-700 dark:text-slate-300">{row.age}</td>
                              <td className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300">
                                <span className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-[10px] font-bold">
                                  {row.disability}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">{row.barangay || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Print Version - Matches Export Format (Image 2) */}
              <div className="hidden print:block space-y-4">
                <div className="flex justify-between items-start gap-4">
                  {/* Left: Detailed Records */}
                  <div className="flex-1">
                    <table className="w-full text-left border-collapse print-table">
                      <thead>
                        <tr>
                          <th colSpan={8} className="px-4 py-3 bg-[#FF8C42] text-black font-bold text-center border border-black">
                            No. of children with disabilities issued with IDs (17 years old and below) {youthYear}
                          </th>
                        </tr>
                        <tr className="bg-[#FF8C42] text-black">
                          <th className="px-2 py-2 border border-black text-[10px] font-bold uppercase text-center">ID NUMBER</th>
                          <th className="px-2 py-2 border border-black text-[10px] font-bold uppercase text-center">SURNAME</th>
                          <th className="px-2 py-2 border border-black text-[10px] font-bold uppercase text-center">NAME</th>
                          <th className="px-2 py-2 border border-black text-[10px] font-bold uppercase text-center">MIDDLE NAME</th>
                          <th className="px-2 py-2 border border-black text-[10px] font-bold uppercase text-center">GENDER</th>
                          <th className="px-2 py-2 border border-black text-[10px] font-bold uppercase text-center">AGE</th>
                          <th className="px-2 py-2 border border-black text-[10px] font-bold uppercase text-center">DISABILITY</th>
                          <th className="px-2 py-2 border border-black text-[10px] font-bold uppercase text-center">BARANGAY</th>
                        </tr>
                      </thead>
                      <tbody>
                        {youthDetailedData.map((row, index) => (
                          <tr key={index}>
                            <td className="px-2 py-1 border border-black text-[9px] font-mono text-center">{row.id_number || '—'}</td>
                            <td className="px-2 py-1 border border-black text-[9px] font-bold">{row.surname}</td>
                            <td className="px-2 py-1 border border-black text-[9px]">{row.name}</td>
                            <td className="px-2 py-1 border border-black text-[9px] text-center">{row.middle_name || '—'}</td>
                            <td className="px-2 py-1 border border-black text-[9px] text-center">{row.gender || '—'}</td>
                            <td className="px-2 py-1 border border-black text-[9px] text-center font-bold">{row.age}</td>
                            <td className="px-2 py-1 border border-black text-[9px] text-center">{row.disability}</td>
                            <td className="px-2 py-1 border border-black text-[9px]">{row.barangay}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Right: Summary Table */}
                  <div className="w-64 flex-shrink-0">
                    <table className="w-full text-left border-collapse print-table">
                      <thead>
                        <tr className="bg-[#FF8C42] text-black">
                          <th className="px-2 py-2 border border-black text-[10px] font-bold uppercase text-center">Disability Type</th>
                          <th className="px-2 py-2 border border-black text-[10px] font-bold uppercase text-center">Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {youthData.map((row, index) => (
                          <tr key={index}>
                            <td className="px-2 py-1 border border-black text-[9px]">{row.disabilityType}</td>
                            <td className="px-2 py-1 border border-black text-[9px] text-center font-bold">{row.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================== QUARTERLY REPORT ============================== */}
          {activeTab === 'quarterly' && (
            <div>
              <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-b border-slate-100 dark:border-slate-800 print:hidden">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">PWD Member Per Month — Quarterly Report</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Monthly breakdown of new registrations, renewals, transfers, and lost IDs</p>
                    {renderAppliedFilters()}
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Year</label>
                      <select
                        value={quarterlyYear}
                        onChange={(e) => setQuarterlyYear(e.target.value)}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-green-500/20 outline-none"
                      >
                        {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Screen Version */}
              <div className="p-4 md:p-6 space-y-6 print:hidden">
                {quarterlyData.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <TrendingUp size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="text-sm">No quarterly data available for the selected year.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {[
                        { label: 'New', value: quarterlyYtd.new, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' },
                        { label: 'Renewal', value: quarterlyYtd.renewal, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' },
                        { label: 'Transfer', value: quarterlyYtd.transfer, color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' },
                        { label: 'Lost', value: quarterlyYtd.lost, color: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' },
                        { label: 'YTD Total', value: quarterlyYtd.total, color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' },
                      ].map(item => (
                        <div key={item.label} className={`${item.color} rounded-xl p-4 text-center`}>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{item.label}</p>
                          <p className="text-2xl font-black mt-1">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {quarterlyData.map((monthData, mi) => (
                      <div key={monthData.month}>
                        {mi % 3 === 0 && (
                          <div className="flex items-center gap-3 mb-3 mt-4">
                            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                            <span className="text-xs font-black text-green-700 dark:text-green-400 uppercase tracking-widest bg-green-50 dark:bg-green-900/20 px-4 py-1.5 rounded-full">
                              Q{Math.floor(mi / 3) + 1} — {quarterlyYear}
                            </span>
                            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                          </div>
                        )}

                        <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden mb-3 shadow-sm">
                          <div className="px-4 py-2.5 bg-yellow-50 dark:bg-yellow-900/10 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-xs font-black text-yellow-800 dark:text-yellow-400 uppercase tracking-widest">{monthData.month}</span>
                          </div>
                          <table className="w-full text-left border-collapse bg-white dark:bg-slate-900">
                            <thead>
                              <tr className="bg-slate-50/80 dark:bg-slate-800/50 text-green-800 dark:text-green-400 border-b-2 border-green-500/20">
                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-center">New</th>
                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-center">Renewal</th>
                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-center">Transfer</th>
                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-center">Lost</th>
                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-center">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {monthData.rows.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-xs italic">No registrations this month</td>
                                </tr>
                              ) : monthData.rows.map((row, ri) => (
                                <tr key={ri} className="hover:bg-green-50/30 dark:hover:bg-green-900/5 transition-colors group">
                                  <td className="px-4 py-2.5 text-xs font-mono text-slate-500 dark:text-slate-400">{row.date}</td>
                                  <td className="px-4 py-3 text-xs text-center font-semibold text-blue-600 dark:text-blue-400">{row.new || '—'}</td>
                                  <td className="px-4 py-3 text-xs text-center font-semibold text-amber-600 dark:text-amber-400">{row.renewal || '—'}</td>
                                  <td className="px-4 py-3 text-xs text-center font-semibold text-purple-600 dark:text-purple-400">{row.transfer || '—'}</td>
                                  <td className="px-4 py-3 text-xs text-center font-semibold text-red-600 dark:text-red-400">{row.lost || '—'}</td>
                                  <td className="px-4 py-3 text-xs text-center font-black text-slate-900 dark:text-white">{row.total}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-green-600 text-white">
                              <tr>
                                <td className="px-4 py-3 text-[10px] font-black uppercase tracking-wider">Total</td>
                                <td className="px-4 py-3 text-xs text-center font-black">{monthData.totals.new}</td>
                                <td className="px-4 py-3 text-xs text-center font-black">{monthData.totals.renewal}</td>
                                <td className="px-4 py-3 text-xs text-center font-black">{monthData.totals.transfer}</td>
                                <td className="px-4 py-3 text-xs text-center font-black">{monthData.totals.lost}</td>
                                <td className="px-4 py-3 text-sm text-center font-black">{monthData.totals.total}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {(mi + 1) % 3 === 0 && quarterlyTotals[Math.floor(mi / 3)] && (
                          <div className="flex justify-end gap-3 mb-6">
                            <div className="bg-green-100 dark:bg-green-900/30 rounded-lg px-4 py-2 inline-flex items-center gap-3">
                              <span className="text-[10px] font-black text-green-800 dark:text-green-300 uppercase tracking-wider">Q{Math.floor(mi / 3) + 1} Total:</span>
                              <span className="text-sm font-black text-green-900 dark:text-green-200">{quarterlyTotals[Math.floor(mi / 3)]?.total || 0}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Print Version - Matches Excel Format Precisely */}
              <div className="hidden print:block p-0">
                <div className="text-xl font-bold mb-4 text-center">PWD MEMBER PER MONTH - {quarterlyYear}</div>
                <table className="w-full border-collapse border border-black">
                  <tbody>
                    {quarterlyData.map((monthData, mi) => (
                      <React.Fragment key={monthData.month}>
                        <tr className="bg-[#FFF176] text-black">
                          <td colSpan={6} className="px-4 py-1.5 border border-black font-bold uppercase text-left">{monthData.month}</td>
                        </tr>
                        <tr className="bg-[#2E7D32] text-white">
                          <td className="px-2 py-1 border border-black text-[10px] font-bold text-center w-32">DATE</td>
                          <td className="px-2 py-1 border border-black text-[10px] font-bold text-center">NEW</td>
                          <td className="px-2 py-1 border border-black text-[10px] font-bold text-center">RENEWAL</td>
                          <td className="px-2 py-1 border border-black text-[10px] font-bold text-center">TRANSFER</td>
                          <td className="px-2 py-1 border border-black text-[10px] font-bold text-center">LOST</td>
                          <td className="px-2 py-1 border border-black text-[10px] font-bold text-center">TOTAL</td>
                        </tr>
                        {monthData.rows.length === 0 ? (
                          <tr className="text-black">
                            <td className="px-2 py-0.5 border border-black text-[9px] text-center italic">—</td>
                            <td className="px-2 py-0.5 border border-black text-[9px] text-center">0</td>
                            <td className="px-2 py-0.5 border border-black text-[9px] text-center">0</td>
                            <td className="px-2 py-0.5 border border-black text-[9px] text-center">0</td>
                            <td className="px-2 py-0.5 border border-black text-[9px] text-center">0</td>
                            <td className="px-2 py-0.5 border border-black text-[9px] text-center">0</td>
                          </tr>
                        ) : monthData.rows.map((row, ri) => (
                          <tr key={ri} className="text-black">
                            <td className="px-2 py-0.5 border border-black text-[9px] text-center">{row.date}</td>
                            <td className="px-2 py-0.5 border border-black text-[9px] text-center">{row.new || 0}</td>
                            <td className="px-2 py-0.5 border border-black text-[9px] text-center">{row.renewal || 0}</td>
                            <td className="px-2 py-0.5 border border-black text-[9px] text-center">{row.transfer || 0}</td>
                            <td className="px-2 py-0.5 border border-black text-[9px] text-center">{row.lost || 0}</td>
                            <td className="px-2 py-0.5 border border-black text-[9px] text-center font-bold">{row.total}</td>
                          </tr>
                        ))}
                        <tr className="bg-[#FFEB3B] text-black font-bold">
                          <td className="px-2 py-1 border border-black text-[10px] text-center">TOTAL</td>
                          <td className="px-2 py-1 border border-black text-[10px] text-center">{monthData.totals.new}</td>
                          <td className="px-2 py-1 border border-black text-[10px] text-center">{monthData.totals.renewal}</td>
                          <td className="px-2 py-1 border border-black text-[10px] text-center">{monthData.totals.transfer}</td>
                          <td className="px-2 py-1 border border-black text-[10px] text-center">{monthData.totals.lost}</td>
                          <td className="px-2 py-1 border border-black text-[10px] text-center font-black">{monthData.totals.total}</td>
                        </tr>
                        {(mi + 1) % 3 === 0 && (
                          <>
                            <tr className="bg-[#4CAF50] text-white font-bold">
                              <td colSpan={5} className="px-2 py-1 border border-black text-[10px] text-right">Q{Math.floor(mi / 3) + 1} TOTAL</td>
                              <td className="px-2 py-1 border border-black text-[10px] text-center">{quarterlyTotals[Math.floor(mi / 3)]?.total || 0}</td>
                            </tr>
                            <tr className="bg-[#1B5E20] text-white font-bold">
                              <td colSpan={5} className="px-2 py-1 border border-black text-[10px] text-right uppercase">YTD</td>
                              <td className="px-2 py-1 border border-black text-[10px] text-center">
                                {quarterlyTotals.slice(0, Math.floor(mi / 3) + 1).reduce((sum, q) => sum + (q.total || 0), 0)}
                              </td>
                            </tr>
                          </>
                        )}
                        <tr className="h-4"></tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modal for alerts */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={hideModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onConfirm={modalState.onConfirm}
      />

    </div>
  );
};

export default Reports;
