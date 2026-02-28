import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, UserCheck, UserX, TrendingUp, Briefcase,
  MapPin, Activity, Calendar, ClipboardList, Shield,
  ArrowUpRight, ArrowDownRight, BarChart3, PieChart as PieChartIcon,
  Loader2, RefreshCw, Clock, Building2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Label, LabelList, AreaChart, Area
} from 'recharts';

import ChartContainer from '../components/ChartContainer';
import Skeleton from '../components/Skeleton';
import { mayorApi, MayorExecutiveSummary } from '../api/mayor';
import { BARANGAY_OPTIONS } from '../constants';

// ═══════════════════════════════════════════
// COLOR SYSTEM — Executive palette
// ═══════════════════════════════════════════
const EXECUTIVE_COLORS = {
  primary: '#1e40af',
  primaryLight: '#3b82f6',
  secondary: '#0d9488',
  accent: '#6366f1',
  gold: '#d97706',
  rose: '#e11d48',
  emerald: '#059669',
  slate: '#475569',
};

const GENDER_COLORS: Record<string, string> = {
  'Male': '#1e40af',
  'Female': '#0d9488',
};

const AGE_COLORS = ['#6366f1', '#3b82f6', '#0d9488', '#d97706'];

const DISABILITY_COLORS = [
  '#1e40af', '#3b82f6', '#6366f1', '#0d9488', '#059669',
  '#d97706', '#ea580c', '#e11d48', '#db2777', '#7c3aed',
  '#475569', '#0ea5e9', '#14b8a6',
];

// ═══════════════════════════════════════════
// BARANGAY HEATMAP CONFIGURATION
// ═══════════════════════════════════════════
const BARANGAY_LIST = BARANGAY_OPTIONS.filter(b => b !== 'All Barangays');

const getHeatmapColor = (count: number, maxCount: number): string => {
  if (maxCount === 0) return 'bg-slate-100 dark:bg-slate-800';
  const intensity = count / maxCount;
  if (intensity === 0) return 'bg-slate-100 dark:bg-slate-800';
  if (intensity <= 0.15) return 'bg-blue-100 dark:bg-blue-900/30';
  if (intensity <= 0.3) return 'bg-blue-200 dark:bg-blue-800/40';
  if (intensity <= 0.5) return 'bg-blue-300 dark:bg-blue-700/50';
  if (intensity <= 0.7) return 'bg-blue-500 dark:bg-blue-600/60';
  if (intensity <= 0.85) return 'bg-blue-600 dark:bg-blue-500/70';
  return 'bg-blue-700 dark:bg-blue-400/80';
};

const getHeatmapTextColor = (count: number, maxCount: number): string => {
  if (maxCount === 0) return 'text-slate-400';
  const intensity = count / maxCount;
  if (intensity <= 0.3) return 'text-slate-700 dark:text-slate-300';
  return 'text-white dark:text-white';
};

// ═══════════════════════════════════════════
// UTILITY COMPONENTS
// ═══════════════════════════════════════════

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-xl">
        <p className="text-slate-700 dark:text-slate-200 text-xs font-bold mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill || entry.color }}></span>
            <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">
              {entry.value?.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const renderDonutCenter = (cx: number, cy: number, line1: string, line2: string) => (
  <g>
    <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="central"
      className="fill-slate-800 dark:fill-white"
      style={{ fontSize: '20px', fontWeight: 800 }}>
      {line1}
    </text>
    <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="central"
      className="fill-slate-400 dark:fill-slate-500"
      style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {line2}
    </text>
  </g>
);

const renderBarLabel = (props: any) => {
  const { x, y, width, value } = props;
  if (value === 0) return null;
  return (
    <text x={x + width / 2} y={y - 8} textAnchor="middle" fill="#555"
      style={{ fontSize: '11px', fontWeight: 700 }}>
      {value?.toLocaleString()}
    </text>
  );
};

// ═══════════════════════════════════════════
// EXECUTIVE KPI CARD
// ═══════════════════════════════════════════
interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  iconBg: string;
  trend?: { value: number; label: string; positive?: boolean };
  isLoading?: boolean;
  large?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title, value, subtitle, icon: Icon, color, bgColor, iconBg, trend, isLoading, large
}) => (
  <div className={`${bgColor} rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/50 
    hover:shadow-lg transition-all duration-300 relative overflow-hidden group ${large ? 'row-span-2' : ''}`}>
    <div className="flex items-start justify-between mb-3">
      <div className={`p-2.5 rounded-xl ${iconBg}`}>
        <Icon size={large ? 22 : 18} className={color} strokeWidth={2.2} />
      </div>
      {trend && !isLoading && (
        <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full
          ${trend.positive !== false
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
          }`}>
          {trend.positive !== false
            ? <ArrowUpRight size={10} />
            : <ArrowDownRight size={10} />}
          {trend.label}
        </div>
      )}
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-1">{title}</p>
      {isLoading ? (
        <Skeleton className={`${large ? 'h-10 w-32' : 'h-8 w-24'} mb-1`} />
      ) : (
        <h3 className={`${large ? 'text-3xl' : 'text-2xl'} font-black text-slate-800 dark:text-white tracking-tight`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </h3>
      )}
      {subtitle && !isLoading && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{subtitle}</p>
      )}
    </div>
    <div className={`absolute -bottom-8 -right-8 w-28 h-28 ${color.replace('text-', 'bg-')} opacity-[0.04] rounded-full blur-2xl group-hover:opacity-[0.08] transition-opacity duration-500`} />
  </div>
);

// ═══════════════════════════════════════════
// MINI STAT CARD (for summaries)
// ═══════════════════════════════════════════
interface MiniStatProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  isLoading?: boolean;
}

const MiniStat: React.FC<MiniStatProps> = ({ label, value, icon: Icon, color, isLoading }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
    <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-').replace('600', '100').replace('500', '100')} dark:bg-opacity-10`}>
      <Icon size={16} className={color} />
    </div>
    <div>
      {isLoading ? (
        <Skeleton className="h-5 w-12 mb-1" />
      ) : (
        <p className="text-lg font-bold text-slate-800 dark:text-white">{value.toLocaleString()}</p>
      )}
      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
    </div>
  </div>
);

// ═══════════════════════════════════════════
// MAYOR DASHBOARD COMPONENT
// ═══════════════════════════════════════════
const MayorDashboard: React.FC = () => {
  const [data, setData] = useState<MayorExecutiveSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const result = await mayorApi.getExecutiveSummary();
      setData(result);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to fetch executive summary:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => fetchData(true), 60000);
    return () => clearInterval(interval);
  }, []);

  const overview = data?.overview;
  const barangayData = data?.barangay_distribution || [];
  const disabilityData = data?.disability_distribution || [];
  const genderData = data?.gender_distribution || [];
  const ageData = data?.age_demographics || [];
  const monthlyTrend = data?.monthly_trend || [];
  const serviceRequests = data?.service_requests_summary;
  const appointments = data?.appointments_summary;

  // Computed values
  const maxBarangayCount = useMemo(() => Math.max(...barangayData.map(b => b.count), 0), [barangayData]);
  const totalPwd = overview?.total_pwd || 0;

  const genderChartData = useMemo(() =>
    genderData.map(g => ({
      name: g.name,
      value: g.count,
      fill: GENDER_COLORS[g.name] || '#94a3b8',
    })), [genderData]);

  const genderCenter = useMemo(() => {
    const total = genderData.reduce((sum, g) => sum + g.count, 0);
    if (total === 0) return { pct: '0', label: 'Total' };
    const majority = genderData.reduce((prev, curr) => curr.count > prev.count ? curr : prev, { name: '', count: 0 });
    return { pct: `${Math.round((majority.count / total) * 100)}%`, label: majority.name };
  }, [genderData]);

  const ageChartData = useMemo(() =>
    ageData.map((a, i) => ({
      name: a.name,
      value: a.count,
      fill: AGE_COLORS[i % AGE_COLORS.length],
    })), [ageData]);

  const disabilityChartData = useMemo(() =>
    disabilityData
      .filter(d => d.count > 0)
      .map((d, i) => ({
        name: d.name,
        value: d.count,
        fill: DISABILITY_COLORS[i % DISABILITY_COLORS.length],
      })), [disabilityData]);

  const trendChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendMap = new Map(monthlyTrend.map(t => [t.month, t.count]));
    const year = new Date().getFullYear();
    return months.map((m, i) => {
      const key = `${year}-${String(i + 1).padStart(2, '0')}`;
      return { name: m, count: trendMap.get(key) || 0 };
    });
  }, [monthlyTrend]);

  const topBarangay = barangayData.length > 0 ? barangayData[0] : null;
  const topDisability = disabilityData.length > 0 ? disabilityData[0] : null;

  const axisTick = { fontSize: 11, fontWeight: 600, fill: '#64748b' };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">

      {/* ═══════ HEADER ═══════ */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Shield size={16} className="text-blue-700 dark:text-blue-400" />
            </div>
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">
              Office of the Municipal Mayor
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
            Executive Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Disability landscape overview — Municipality of Pagsanjan, Laguna
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            <Clock size={12} />
            <span>Updated {lastRefreshed.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 
              rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 
              transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* ═══════ KPI CARDS — Primary Metrics ═══════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total PWD Population"
          value={totalPwd}
          subtitle={`${overview?.active_count?.toLocaleString() || 0} active · ${overview?.deceased_count?.toLocaleString() || 0} deceased`}
          icon={Users}
          color="text-blue-700"
          bgColor="bg-white dark:bg-slate-900"
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          trend={overview?.new_this_month ? { value: overview.new_this_month, label: `+${overview.new_this_month} this month`, positive: true } : undefined}
          isLoading={isLoading}
          large
        />
        <KpiCard
          title="Employment Rate"
          value={`${overview?.employment_rate || 0}%`}
          subtitle={`${overview?.employed_count?.toLocaleString() || 0} employed PWDs`}
          icon={Briefcase}
          color="text-emerald-600"
          bgColor="bg-white dark:bg-slate-900"
          iconBg="bg-emerald-100 dark:bg-emerald-900/30"
          isLoading={isLoading}
        />
        <KpiCard
          title="New This Year"
          value={overview?.new_this_year || 0}
          subtitle={`${overview?.new_this_month || 0} registered this month`}
          icon={TrendingUp}
          color="text-indigo-600"
          bgColor="bg-white dark:bg-slate-900"
          iconBg="bg-indigo-100 dark:bg-indigo-900/30"
          isLoading={isLoading}
        />
        <KpiCard
          title="Pending Approvals"
          value={overview?.pending_approvals || 0}
          subtitle="Awaiting PDAO review"
          icon={ClipboardList}
          color="text-amber-600"
          bgColor="bg-white dark:bg-slate-900"
          iconBg="bg-amber-100 dark:bg-amber-900/30"
          isLoading={isLoading}
        />
      </div>

      {/* ═══════ ROW 1: Barangay Heatmap + Gender Distribution ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Barangay Heatmap */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden"
            style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.04)' }}>
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-blue-600" />
                    <h4 className="text-slate-800 dark:text-slate-100 font-semibold text-sm uppercase tracking-wide">
                      Barangay PWD Distribution
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                    {topBarangay ? `Highest concentration: ${topBarangay.name} (${topBarangay.count})` : 'Loading...'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Low</span>
                  <div className="flex gap-0.5">
                    <div className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-800" />
                    <div className="w-3 h-3 rounded-sm bg-blue-200 dark:bg-blue-800/40" />
                    <div className="w-3 h-3 rounded-sm bg-blue-400 dark:bg-blue-600/50" />
                    <div className="w-3 h-3 rounded-sm bg-blue-600 dark:bg-blue-500/70" />
                    <div className="w-3 h-3 rounded-sm bg-blue-700 dark:bg-blue-400/80" />
                  </div>
                  <span>High</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {BARANGAY_LIST.map((brgy) => {
                    const found = barangayData.find(b => b.name === brgy);
                    const count = found?.count || 0;
                    const bgColor = getHeatmapColor(count, maxBarangayCount);
                    const textColor = getHeatmapTextColor(count, maxBarangayCount);
                    const pct = totalPwd > 0 ? ((count / totalPwd) * 100).toFixed(1) : '0';
                    return (
                      <div key={brgy}
                        className={`${bgColor} rounded-xl p-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-md cursor-default border border-slate-200/30 dark:border-slate-700/30`}>
                        <p className={`text-[10px] font-black uppercase tracking-wider ${textColor} opacity-80 mb-1 truncate`}>
                          {brgy}
                        </p>
                        <p className={`text-xl font-black ${textColor}`}>
                          {count.toLocaleString()}
                        </p>
                        <p className={`text-[10px] ${textColor} opacity-60 font-semibold`}>
                          {pct}% of total
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gender Distribution Donut */}
        <div className="flex flex-col gap-6">
          <ChartContainer title="Gender Distribution"
            subtitle={genderData.length > 0 ? `${genderCenter.pct} ${genderCenter.label}` : ''}
            isLoading={isLoading} height={280}>
            {genderChartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-slate-400">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <Pie data={genderChartData} cx="50%" cy="45%" innerRadius={55} outerRadius={85}
                    paddingAngle={6} dataKey="value" stroke="none">
                    {genderChartData.map((entry, index) => (
                      <Cell key={`gc-${index}`} fill={entry.fill} />
                    ))}
                    <Label content={({ viewBox }) => {
                      const { cx, cy } = viewBox as any;
                      return renderDonutCenter(cx, cy, genderCenter.pct, genderCenter.label);
                    }} position="center" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle"
                    wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>

          {/* Quick Summary Cards */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-4 space-y-3"
            style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.04)' }}>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Quick Summary</p>
            <MiniStat label="Service Requests" value={serviceRequests?.total || 0} icon={ClipboardList} color="text-indigo-600" isLoading={isLoading} />
            <MiniStat label="Appointments" value={appointments?.total || 0} icon={Calendar} color="text-teal-600" isLoading={isLoading} />
            <MiniStat label="Male" value={overview?.male_count || 0} icon={Users} color="text-blue-600" isLoading={isLoading} />
            <MiniStat label="Female" value={overview?.female_count || 0} icon={Users} color="text-emerald-600" isLoading={isLoading} />
          </div>
        </div>
      </div>

      {/* ═══════ ROW 2: Disability Type Distribution + Age Demographics ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Disability Type Distribution */}
        <ChartContainer
          title="Disability Type Distribution"
          subtitle={topDisability ? `Most prevalent: ${topDisability.name} (${topDisability.count})` : ''}
          height={Math.max(300, disabilityChartData.length * 40 + 60)}
          isLoading={isLoading}
        >
          {disabilityChartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-slate-400">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(250, disabilityChartData.length * 40 + 50)}>
              <BarChart layout="vertical" data={disabilityChartData}
                margin={{ top: 5, right: 60, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.08} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false}
                  domain={[0, (dataMax: number) => Math.max(dataMax + 1, 2)]} />
                <YAxis dataKey="name" type="category" width={170}
                  tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                  {disabilityChartData.map((entry, index) => (
                    <Cell key={`dc-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList dataKey="value" position="right"
                    style={{ fontSize: '11px', fontWeight: 700, fill: '#64748b' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>

        {/* Age Demographics */}
        <ChartContainer
          title="Age Demographics"
          subtitle="NCDA/DOH age classification"
          height={350}
          isLoading={isLoading}
        >
          {ageChartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-slate-400">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={ageChartData} margin={{ top: 25, right: 30, left: 15, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.08} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                  tickLine={false} axisLine={false} angle={-15} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false}
                  label={{ value: 'No. of PWDs', angle: -90, position: 'insideLeft', offset: 0,
                    style: { fontSize: 11, fontWeight: 600, fill: '#64748b' } }} />
                <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60}>
                  {ageChartData.map((entry, index) => (
                    <Cell key={`ac-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList dataKey="value" position="top"
                    style={{ fontSize: '12px', fontWeight: 800, fill: '#475569' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>
      </div>

      {/* ═══════ ROW 3: Registration Trend ═══════ */}
      <ChartContainer
        title="Monthly Registration Trend"
        subtitle={`${new Date().getFullYear()} — New PWD registrations by month`}
        height={280}
        isLoading={isLoading}
      >
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={trendChartData} margin={{ top: 20, right: 30, left: 15, bottom: 5 }}>
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={EXECUTIVE_COLORS.primary} stopOpacity={0.2} />
                <stop offset="100%" stopColor={EXECUTIVE_COLORS.primary} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.08} vertical={false} />
            <XAxis dataKey="name" tick={axisTick} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ strokeDasharray: '3 3', stroke: '#94a3b8' }} content={<CustomTooltip />} />
            <Area type="monotone" dataKey="count" stroke={EXECUTIVE_COLORS.primary} strokeWidth={2.5}
              fill="url(#trendGradient)" dot={{ r: 4, fill: '#fff', stroke: EXECUTIVE_COLORS.primary, strokeWidth: 2 }}
              activeDot={{ r: 6, fill: EXECUTIVE_COLORS.primary, stroke: '#fff', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* ═══════ ROW 4: Service Requests & Appointments Summaries ═══════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Service Requests */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-6"
          style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList size={18} className="text-indigo-600" />
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
              Service Requests
            </h4>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Requests</span>
                <span className="text-xl font-black text-slate-800 dark:text-white">{serviceRequests?.total?.toLocaleString() || 0}</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                {serviceRequests && serviceRequests.total > 0 && (
                  <div className="h-full flex">
                    <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${(serviceRequests.completed / serviceRequests.total) * 100}%` }} />
                    <div className="bg-amber-500 transition-all duration-500" style={{ width: `${(serviceRequests.pending / serviceRequests.total) * 100}%` }} />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-500">Completed: {serviceRequests?.completed || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-slate-500">Pending: {serviceRequests?.pending || 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Appointments */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-6"
          style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-teal-600" />
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
              Appointments
            </h4>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Appointments</span>
                <span className="text-xl font-black text-slate-800 dark:text-white">{appointments?.total?.toLocaleString() || 0}</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                {appointments && appointments.total > 0 && (
                  <div className="h-full flex">
                    <div className="bg-teal-500 transition-all duration-500" style={{ width: `${(appointments.completed / appointments.total) * 100}%` }} />
                    <div className="bg-blue-500 transition-all duration-500" style={{ width: `${(appointments.upcoming / appointments.total) * 100}%` }} />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  <span className="text-slate-500">Completed: {appointments?.completed || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-slate-500">Upcoming: {appointments?.upcoming || 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════ FOOTER ATTRIBUTION ═══════ */}
      <div className="text-center py-4">
        <p className="text-[10px] text-slate-400 dark:text-slate-600 font-medium tracking-wider uppercase">
          Pagsanjan Disability Affairs Office · Executive Information System
        </p>
      </div>
    </div>
  );
};

export default MayorDashboard;
