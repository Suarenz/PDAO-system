import React, { ReactNode } from 'react';
import { MoreHorizontal, LayoutGrid } from 'lucide-react';
import Skeleton from './Skeleton';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  height?: number;
  className?: string;
  action?: ReactNode;
  isLoading?: boolean;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ title, subtitle, children, height = 300, className = "", action, isLoading }) => {
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-xl overflow-hidden flex flex-col ${className}`}
      style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
    >
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-start">
        <div className="min-w-0 flex-1">
          <h4 className="text-slate-800 dark:text-slate-100 font-semibold text-sm uppercase tracking-wide">
            {title}
          </h4>
          {subtitle && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            {action}
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <MoreHorizontal size={18} />
            </button>
        </div>
      </div>
      <div className="p-6 flex-1 w-full" style={{ minHeight: height }}>
        {isLoading ? (
          <div className="w-full h-full flex flex-col gap-4">
            <div className="flex-1 flex items-end gap-2">
              <Skeleton className="flex-1 h-3/4" />
              <Skeleton className="flex-1 h-1/2" />
              <Skeleton className="flex-1 h-1/4" />
              <Skeleton className="flex-1 h-2/3" />
              <Skeleton className="flex-1 h-5/6" />
              <Skeleton className="flex-1 h-1/2" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 flex-1" />
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default ChartContainer;