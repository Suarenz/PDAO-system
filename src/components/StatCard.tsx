import React from 'react';
import { LucideIcon, TrendingUp } from 'lucide-react';
import Skeleton from './Skeleton';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  colorClass: string; // We'll expect a color class like "text-blue-500" or "bg-blue-500"
  description?: string;
  trend?: string;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, colorClass, description, trend, isLoading }) => {
  // Extract the base color name (e.g., "blue" from "bg-blue-500") for dynamic classes
  // This is a simplified way to handle it for this specific UI improvement
  const color = colorClass.replace('text-', '').replace('bg-', '').split('-')[0];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            {title}
          </p>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mb-1" />
          ) : (
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
              {value}
            </h3>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClass.replace('text-', 'bg-').replace('600', '100').replace('500', '100')} dark:bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${colorClass}`} strokeWidth={2} />
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        {isLoading ? (
          <Skeleton className="h-4 w-32" />
        ) : (
          <>
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-500 font-medium">
                {description}
              </p>
            )}
            {trend && (
              <div className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                <TrendingUp size={12} />
                <span>{trend}</span>
              </div>
            )}
          </>
        )}
      </div>


      {/* Decorative gradient blur at bottom */}
      <div className={`absolute -bottom-6 -right-6 w-24 h-24 ${colorClass.replace('text-', 'bg-').replace('600', '500')} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity duration-500`}></div>
    </div>
  );
};

export default StatCard;