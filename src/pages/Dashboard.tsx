import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserCheck, UserX, Building2, Briefcase, 
  Filter, Calendar, Wallet, LayoutGrid, Loader2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LabelList, Label
} from 'recharts';

import StatCard from '../components/StatCard';
import ChartContainer from '../components/ChartContainer';
import Skeleton from '../components/Skeleton';
import { 
  BARANGAY_OPTIONS, YEARS_OPTIONS, DISABILITY_OPTIONS
} from '../constants';
import { dashboardApi } from '../api';

// ═══════════════════════════════════════════
// COLOR SYSTEM — Professional, accessible palette
// ═══════════════════════════════════════════
const COLORS = {
  primary: '#3f51b5',       // Indigo — brand
  primaryLight: '#7986cb',
  secondary: '#26a69a',     // Teal
  positive: '#26a69a',      // Employed / Active
  warning: '#ff9800',       // Amber — Self-employed
  negative: '#ef5350',      // Red — Unemployed / Deceased
  accent: '#5c6bc0',        // Light indigo
  axisText: '#555',
};

const GENDER_COLORS: Record<string, string> = {
  'Male': '#3f51b5',
  'Female': '#26a69a',
  'Other': '#5c6bc0',
};

const EMPLOYMENT_COLORS: Record<string, string> = {
  'Employed': '#26a69a',
  'Unemployed': '#ef5350',
  'Self-Employed': '#ff9800',
  'Self-employed': '#ff9800',
};

const LIVING_COLORS: Record<string, string> = {
  'Living Alone': '#3f51b5',
  'Living with Husband/Wife': '#ff9800',
  'Living with Family': '#26a69a',
};

// Income bracket ordering & full set for gap-filling
const ALL_INCOME_BRACKETS = [
  'Below ₱5,000',
  '₱5,000 - ₱10,000',
  '₱10,001 - ₱20,000',
  '₱20,001 - ₱50,000',
  'Above ₱50,000',
];

const INCOME_SORT_INDEX: Record<string, number> = {
  'Below ₱5,000': 0,
  '₱5,000 - ₱10,000': 1,
  '₱10,001 - ₱20,000': 2,
  '₱20,001 - ₱50,000': 3,
  'Above ₱50,000': 4,
  'Not Specified': 5,
};

// Default empty chart data for loading states
const EMPTY_GENDER_DATA = [
  { name: 'Male', value: 0, fill: GENDER_COLORS['Male'] },
  { name: 'Female', value: 0, fill: GENDER_COLORS['Female'] },
];

const EMPTY_EMPLOYMENT_DATA = [
  { name: 'Employed', value: 0, fill: EMPLOYMENT_COLORS['Employed'] },
  { name: 'Unemployed', value: 0, fill: EMPLOYMENT_COLORS['Unemployed'] },
  { name: 'Self-Employed', value: 0, fill: EMPLOYMENT_COLORS['Self-Employed'] },
];

const EMPTY_LIVING_DATA = [
  { name: 'Living Alone', value: 0, fill: LIVING_COLORS['Living Alone'] },
  { name: 'Living with Husband/Wife', value: 0, fill: LIVING_COLORS['Living with Husband/Wife'] },
  { name: 'Living with Family', value: 0, fill: LIVING_COLORS['Living with Family'] },
];

// ═══════════════════════════════════════════
// HELPER COMPONENTS & UTILITIES
// ═══════════════════════════════════════════

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-xl">
        <p className="text-slate-700 dark:text-slate-200 text-xs font-bold mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].fill || payload[0].color }}></span>
          <p className="text-slate-600 dark:text-slate-300 text-sm">{`${payload[0].name || 'Count'}: ${payload[0].value.toLocaleString()}`}</p>
        </div>
      </div>
    );
  }
  return null;
};

/** Disability chart tooltip with note for Mental vs Psychosocial */
const DISABILITY_NOTES: Record<string, string> = {
  'Mental Disability': 'Refers to conditions affecting cognitive/neurological functioning (e.g., intellectual disability, dementia).',
  'Psychosocial Disability': 'Refers to conditions affecting emotional, behavioral, and social functioning (e.g., depression, PTSD, anxiety disorders).',
};

const DisabilityTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const note = DISABILITY_NOTES[label];
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-xl max-w-xs">
        <p className="text-slate-700 dark:text-slate-200 text-xs font-bold mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].fill || payload[0].color }}></span>
          <p className="text-slate-600 dark:text-slate-300 text-sm">{`Count: ${payload[0].value.toLocaleString()}`}</p>
        </div>
        {note && (
          <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-2 leading-snug italic border-t border-slate-100 dark:border-slate-700 pt-1.5">{note}</p>
        )}
      </div>
    );
  }
  return null;
};

/** Data label renderer for bar charts (small datasets) */
const renderBarLabel = (props: any) => {
  const { x, y, width, value } = props;
  if (value === 0) return null;
  return (
    <text x={x + width / 2} y={y - 8} textAnchor="middle" fill="#555" style={{ fontSize: '11px', fontWeight: 700 }}>
      {value}
    </text>
  );
};

/** Donut center label renderer */
const renderDonutCenter = (cx: number, cy: number, line1: string, line2: string) => (
  <g>
    <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="central" style={{ fontSize: '18px', fontWeight: 800, fill: '#1e293b' }}>
      {line1}
    </text>
    <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="central" style={{ fontSize: '10px', fontWeight: 600, fill: '#94a3b8' }}>
      {line2}
    </text>
  </g>
);

/** Empty state placeholder */
const EmptyState = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
        <LayoutGrid size={20} className="text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">No data available</p>
      <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">Try adjusting your filters</p>
    </div>
  </div>
);

/** Compute median income bracket from distribution */
const computeMedianBracket = (data: { name: string; value: number }[]): string => {
  const sorted = [...data]
    .filter(d => d.name !== 'Not Specified')
    .sort((a, b) => (INCOME_SORT_INDEX[a.name] ?? 99) - (INCOME_SORT_INDEX[b.name] ?? 99));
  const total = sorted.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return 'N/A';
  let cumulative = 0;
  for (const bracket of sorted) {
    cumulative += bracket.value;
    if (cumulative >= total / 2) return bracket.name;
  }
  return 'N/A';
};

/** Fill income data gaps with all standard brackets */
const fillIncomeGaps = (data: { name: string; value: number }[]): { name: string; value: number }[] => {
  const dataMap = new Map(data.map(d => [d.name, d.value]));
  return ALL_INCOME_BRACKETS.map(bracket => ({
    name: bracket,
    value: dataMap.get(bracket) || 0,
  }));
};

const hasData = (data: any[]) => data.some(d => (d.value || d.count || 0) > 0);

// ═══════════════════════════════════════════
// DASHBOARD COMPONENT
// ═══════════════════════════════════════════
const Dashboard: React.FC = () => {
  const [filters, setFilters] = useState({
    barangay: 'All Barangays',
    year: 'All Years',
    disabilityType: 'All Types'
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRegistered: 0,
    active: 0,
    employed: 0,
    deceased: 0
  });
  
  const [genderData, setGenderData] = useState(EMPTY_GENDER_DATA);
  const [ageGroupData, setAgeGroupData] = useState<any[]>([]);
  const [barangayData, setBarangayData] = useState<any[]>([]);
  const [disabilityData, setDisabilityData] = useState<any[]>([]);
  const [employmentData, setEmploymentData] = useState(EMPTY_EMPLOYMENT_DATA);
  const [incomeData, setIncomeData] = useState<any[]>([]);
  const [livingData, setLivingData] = useState(EMPTY_LIVING_DATA);
  const [deceasedAgeData, setDeceasedAgeData] = useState<any[]>([]);

  // Fetch dashboard data — re-runs whenever filters change
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const params: Record<string, string> = {};
        if (filters.barangay !== 'All Barangays') params.barangay = filters.barangay;
        if (filters.year !== 'All Years') params.year = filters.year;
        if (filters.disabilityType !== 'All Types') params.disability_type = filters.disabilityType;

        const [statsRes, byGender, byAge, byBarangay, byDisability, byEmployment, byIncome, byLivingArrangement, deceasedAgeRes] = await Promise.all([
          dashboardApi.getStats(params),
          dashboardApi.getByGender(params),
          dashboardApi.getByAgeGroup(params),
          dashboardApi.getByBarangay(params),
          dashboardApi.getByDisabilityType(params),
          dashboardApi.getByEmployment(params),
          dashboardApi.getByIncome(params),
          dashboardApi.getByLivingArrangement(params),
          dashboardApi.getDeceasedByAge(params)
        ]);

        // Employment data (compute employed count for KPI)
        const empData = byEmployment.map((e: any) => ({
          name: e.name || e.employment_status,
          value: e.count || e.value || 0,
          fill: EMPLOYMENT_COLORS[e.name || e.employment_status] || '#94a3b8'
        }));
        const employedCount = empData.find((e: any) => e.name === 'Employed')?.value || 0;

        setStats({
          totalRegistered: statsRes.total_pwd || 0,
          active: statsRes.active_count || 0,
          employed: employedCount,
          deceased: statsRes.deceased_count || 0
        });

        // Gender
        setGenderData(byGender.map((g: any) => ({
          name: g.name || g.gender,
          value: g.count || g.value || 0,
          fill: GENDER_COLORS[g.name || g.gender] || '#94a3b8'
        })));

        // Age groups
        setAgeGroupData(byAge.map((a: any) => ({
          name: a.name || a.age_group || a.age_range,
          value: a.count || a.value || 0
        })));

        // Deceased age
        if (deceasedAgeRes) {
          setDeceasedAgeData(deceasedAgeRes.map((a: any) => ({
            name: a.name || a.age_range,
            value: a.count || a.value || 0
          })));
        }

        // Barangay
        setBarangayData(byBarangay.map((b: any) => ({
          name: b.name || b.barangay,
          count: b.count || b.value || 0
        })));

        // Disability — sorted descending, filter out zeros
        setDisabilityData(
          byDisability
            .map((d: any) => ({
              name: d.name || d.disability_type,
              value: d.count || d.value || 0
            }))
            .filter((d: any) => d.value > 0)
            .sort((a: any, b: any) => b.value - a.value)
        );

        setEmploymentData(empData);

        // Income — fill gaps and sort lowest-to-highest
        const rawIncome = byIncome.map((i: any) => ({
          name: i.name || i.income_bracket,
          value: i.count || i.value || 0
        }));
        setIncomeData(fillIncomeGaps(rawIncome));

        // Living arrangement
        if (byLivingArrangement && byLivingArrangement.length > 0) {
          setLivingData(byLivingArrangement.map((l: any) => ({
            name: l.name || l.living_arrangement,
            value: l.count || l.value || 0,
            fill: LIVING_COLORS[l.name || l.living_arrangement] || '#94a3b8'
          })));
        }

      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    // Poll every 30 seconds for real-time data updates
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [filters]);

  // ═══════ COMPUTED KPIs ═══════
  const employmentRate = useMemo(() => {
    if (stats.totalRegistered === 0) return 0;
    return Math.round((stats.employed / stats.totalRegistered) * 100);
  }, [stats]);

  const medianIncome = useMemo(() => computeMedianBracket(incomeData), [incomeData]);

  // Dynamic insight strings per chart
  const genderInsight = useMemo(() => {
    const total = genderData.reduce((sum, g) => sum + g.value, 0);
    if (total === 0) return '';
    const majority = genderData.reduce((prev, curr) => curr.value > prev.value ? curr : prev);
    const pct = Math.round((majority.value / total) * 100);
    return `${pct}% ${majority.name} of ${total} total`;
  }, [genderData]);

  const genderCenter = useMemo(() => {
    const total = genderData.reduce((sum, g) => sum + g.value, 0);
    if (total === 0) return { pct: '0', label: 'Total' };
    const majority = genderData.reduce((prev, curr) => curr.value > prev.value ? curr : prev);
    return { pct: `${Math.round((majority.value / total) * 100)}%`, label: majority.name };
  }, [genderData]);

  const employmentCenter = useMemo(() => {
    const total = employmentData.reduce((sum, e) => sum + e.value, 0);
    if (total === 0) return { pct: '0%', label: 'Employed' };
    const employed = employmentData.find(e => e.name === 'Employed')?.value || 0;
    return { pct: `${Math.round((employed / total) * 100)}%`, label: 'Employed' };
  }, [employmentData]);

  const livingCenter = useMemo(() => {
    const total = livingData.reduce((sum, l) => sum + l.value, 0);
    if (total === 0) return { pct: '0', label: 'Total' };
    const majority = livingData.reduce((prev, curr) => curr.value > prev.value ? curr : prev);
    return { pct: `${Math.round((majority.value / total) * 100)}%`, label: majority.name.replace('Living ', '') };
  }, [livingData]);

  const ageInsight = useMemo(() => {
    if (ageGroupData.length === 0) return '';
    const largest = ageGroupData.reduce((prev: any, curr: any) => curr.value > prev.value ? curr : prev, { value: 0 });
    return largest.value > 0 ? `Largest group: ${largest.name} (${largest.value})` : '';
  }, [ageGroupData]);

  const incomeInsight = useMemo(() => {
    const total = incomeData.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) return '';
    const above50k = incomeData.find(d => d.name === 'Above ₱50,000')?.value || 0;
    return `${Math.round((above50k / total) * 100)}% of participants earn above ₱50k`;
  }, [incomeData]);

  const disabilityInsight = useMemo(() => {
    if (disabilityData.length === 0) return '';
    const sorted = [...disabilityData].sort((a, b) => b.value - a.value);
    if (sorted[0]?.value === 0) return '';
    const maxVal = sorted[0].value;
    const topCategories = sorted.filter(d => d.value === maxVal);
    if (topCategories.length === 1) return `Most common: ${topCategories[0].name}`;
    const names = topCategories.map(d => d.name);
    return `Top categories: ${names.join(' & ')}`;
  }, [disabilityData]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Common axis styling
  const axisTick = { fontSize: 11, fontWeight: 600, fill: COLORS.axisText };
  const axisLabelStyle = { fontSize: 11, fontWeight: 600, fill: COLORS.axisText };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Dashboard Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
             <LayoutGrid className="text-gray-600" size={24} />
             Dashboard
           </h2>
        </div>

        {/* Filters Bar */}
        <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-2 items-center">
            <div className="flex items-center gap-2 text-slate-400 px-3 py-2 border-r border-slate-100 dark:border-slate-800 hidden sm:flex">
               <Filter size={14} className="text-gray-500" />
               <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Filters</span>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                    <select 
                        className="w-full sm:w-40 appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-xl focus:ring-2 focus:ring-gray-500 block p-2.5 pr-8 transition-all outline-none"
                        value={filters.barangay}
                        onChange={(e) => handleFilterChange('barangay', e.target.value)}
                    >
                        {BARANGAY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                     <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                         <Building2 size={12} />
                     </div>
                </div>

                <div className="relative flex-1 sm:flex-none">
                    <select 
                        className="w-full sm:w-32 appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-xl focus:ring-2 focus:ring-gray-500 block p-2.5 pr-8 transition-all outline-none"
                        value={filters.year}
                        onChange={(e) => handleFilterChange('year', e.target.value)}
                    >
                        {YEARS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                     <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                         <Calendar size={12} />
                     </div>
                </div>

                 <div className="relative flex-1 sm:flex-none">
                    <select 
                        className="w-full sm:w-40 appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-xl focus:ring-2 focus:ring-gray-500 block p-2.5 pr-8 transition-all outline-none"
                        value={filters.disabilityType}
                        onChange={(e) => handleFilterChange('disabilityType', e.target.value)}
                    >
                        {DISABILITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                     <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                         <Users size={12} />
                     </div>
                </div>
            </div>
        </div>
      </div>

      {/* ═══════ KPI SUMMARY CARDS ═══════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Registered" value={stats.totalRegistered} icon={Users} colorClass="text-indigo-600" isLoading={isLoading} description={`${stats.active} currently active`} />
        <StatCard title="Employment Rate" value={`${employmentRate}%`} icon={Briefcase} colorClass="text-teal-600" description={`${stats.employed} of ${stats.totalRegistered} employed`} isLoading={isLoading} />
        <StatCard title="Median Income" value={medianIncome} icon={Wallet} colorClass="text-amber-600" description="Estimated bracket" isLoading={isLoading} />
        <StatCard title="Deceased PWD" value={stats.deceased} icon={UserX} colorClass="text-rose-500" description="Deceased Records" isLoading={isLoading} />
      </div>

      {/* ═══════ ROW 1: Gender Distribution + Age Profile ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartContainer title="Gender Distribution" subtitle={genderInsight} isLoading={isLoading}>
          {!hasData(genderData) ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <Pie data={genderData} cx="50%" cy="40%" innerRadius={50} outerRadius={72} paddingAngle={6} dataKey="value" stroke="none">
                  {genderData.map((entry, index) => (
                    <Cell key={`gc-${index}`} fill={entry.fill} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      const { cx, cy } = viewBox as any;
                      return renderDonutCenter(cx, cy, genderCenter.pct, genderCenter.label);
                    }}
                    position="center"
                  />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>

        <div className="lg:col-span-2">
          <ChartContainer title="Age Profile of Participants" subtitle={ageInsight} height={300} isLoading={isLoading}>
            {!hasData(ageGroupData) ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ageGroupData} margin={{ top: 25, right: 30, left: 15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.08} vertical={false} />
                  <XAxis dataKey="name" tick={axisTick} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} label={{ value: 'No. of Respondents', angle: -90, position: 'insideLeft', offset: 0, style: axisLabelStyle }} />
                  <Tooltip cursor={{ fill: 'rgba(63, 81, 181, 0.05)' }} content={<CustomTooltip />} />
                  <Bar dataKey="value" fill={COLORS.primary} radius={[6, 6, 0, 0]} barSize={50} label={renderBarLabel} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </div>
      </div>

      {/* ═══════ ROW 2: Income Distribution + Employment Status ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartContainer title="Income Distribution" subtitle={incomeInsight} height={300} isLoading={isLoading}>
            {!hasData(incomeData) ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={incomeData} margin={{ top: 25, right: 30, left: 15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.08} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 600, fill: COLORS.axisText }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} label={{ value: 'No. of Respondents', angle: -90, position: 'insideLeft', offset: 0, style: axisLabelStyle }} />
                  <Tooltip cursor={{ fill: 'rgba(255, 152, 0, 0.05)' }} content={<CustomTooltip />} />
                  <Bar dataKey="value" fill={COLORS.warning} radius={[6, 6, 0, 0]} barSize={50} label={renderBarLabel} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </div>
        
        <ChartContainer title="Employment Status" subtitle={`${employmentRate}% currently employed`} isLoading={isLoading}>
          {!hasData(employmentData) ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <Pie data={employmentData} cx="50%" cy="40%" innerRadius={50} outerRadius={72} paddingAngle={6} dataKey="value" stroke="none">
                  {employmentData.map((entry, index) => (
                    <Cell key={`ec-${index}`} fill={entry.fill} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      const { cx, cy } = viewBox as any;
                      return renderDonutCenter(cx, cy, employmentCenter.pct, employmentCenter.label);
                    }}
                    position="center"
                  />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>
      </div>

      {/* ═══════ ROW 3: Living Arrangement + Disability Type (Horizontal) ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartContainer title="Living Arrangement" subtitle={`${livingCenter.pct} ${livingCenter.label}`} isLoading={isLoading}>
          {!hasData(livingData) ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <Pie data={livingData} cx="50%" cy="40%" innerRadius={50} outerRadius={72} paddingAngle={6} dataKey="value" stroke="none">
                  {livingData.map((entry, index) => (
                    <Cell key={`lc-${index}`} fill={entry.fill} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      const { cx, cy } = viewBox as any;
                      return renderDonutCenter(cx, cy, livingCenter.pct, livingCenter.label);
                    }}
                    position="center"
                  />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>

        <div className="lg:col-span-2">
          <ChartContainer title="Disability Type Distribution" subtitle={disabilityInsight} height={Math.max(250, disabilityData.length * 45 + 60)} isLoading={isLoading}>
            {!hasData(disabilityData) ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={Math.max(200, disabilityData.length * 45 + 50)}>
                <BarChart layout="vertical" data={disabilityData} margin={{ top: 5, right: 50, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.08} horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} domain={[0, (dataMax: number) => Math.max(dataMax + 1, 2)]} label={{ value: 'No. of Respondents', position: 'insideBottom', offset: -2, style: axisLabelStyle }} />
                  <YAxis dataKey="name" type="category" width={170} tick={{ fontSize: 11, fontWeight: 600, fill: COLORS.axisText }} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(92, 107, 192, 0.05)' }} content={<DisabilityTooltip />} />
                  <Bar dataKey="value" fill={COLORS.accent} radius={[0, 6, 6, 0]} barSize={20}>
                    <LabelList dataKey="value" position="right" style={{ fontSize: '11px', fontWeight: 700, fill: COLORS.axisText }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </div>
      </div>

      {/* ═══════ ROW 4: Deceased Age Distribution ═══════ */}
      <ChartContainer title="Deceased PWD by Age Group (Current Year)" subtitle="Distribution of deceased persons with disability" height={300} isLoading={isLoading}>
        {!hasData(deceasedAgeData) ? <EmptyState /> : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deceasedAgeData} margin={{ top: 25, right: 30, left: 15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.08} vertical={false} />
              <XAxis dataKey="name" tick={axisTick} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} label={{ value: 'No. of Deceased', angle: -90, position: 'insideLeft', offset: 0, style: axisLabelStyle }} />
              <Tooltip cursor={{ fill: 'rgba(244, 63, 94, 0.05)' }} content={<CustomTooltip />} />
              <Bar dataKey="value" fill={COLORS.negative} radius={[6, 6, 0, 0]} barSize={50} label={renderBarLabel} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartContainer>

    </div>
  );
};

export default Dashboard;