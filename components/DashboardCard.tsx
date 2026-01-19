
import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; positive: boolean };
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, subtitle, icon, trend }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-500 text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold mt-1 text-slate-800">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className="p-2 bg-slate-50 rounded-lg">
          {icon}
        </div>
      </div>
      {trend && (
        <div className={`mt-4 text-xs font-semibold flex items-center ${trend.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}% 
          <span className="text-slate-400 ml-1 font-normal">vs last week</span>
        </div>
      )}
    </div>
  );
};

export default DashboardCard;
