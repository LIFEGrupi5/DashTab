'use client';

import { TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { ForecastPoint } from '@/lib/api/analytics';

type Props = {
  revenueByHour: { hour: string; revenue: number }[];
  peakRevenueHour: { hour: string; revenue: number };
  isLoading: boolean;
  forecast: ForecastPoint[];
  forecastLoading: boolean;
  forecastMessage?: string | null;
};

export default function OverviewCharts({
  revenueByHour,
  peakRevenueHour,
  isLoading,
  forecast,
  forecastLoading,
  forecastMessage,
}: Props) {
  return (
    <div className="contents">
      <div className="bg-white dark:bg-card rounded-xl border border-neutral-200 dark:border-border p-5">
        <h2 className="font-semibold text-neutral-900 dark:text-foreground mb-1">Revenue by Hour</h2>
        <p className="text-xs text-neutral-400 dark:text-muted-foreground mb-4">
          Peak: €{peakRevenueHour.revenue.toFixed(2)} at {peakRevenueHour.hour}:00
        </p>
        {isLoading ? (
          <div className="h-40 rounded-lg bg-neutral-100 dark:bg-muted/30 animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={revenueByHour} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10, fill: 'currentColor' }}
                className="text-neutral-400 dark:text-muted-foreground"
                tickFormatter={h => `${h}:00`}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'currentColor' }}
                className="text-neutral-400 dark:text-muted-foreground"
                tickFormatter={v => `€${v}`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={v => [`€${Number(v).toFixed(2)}`, 'Revenue']}
                labelFormatter={h => `${h}:00`}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              />
              <Line
                type="linear"
                dataKey="revenue"
                stroke="#34d399"
                strokeWidth={2}
                dot={{ r: 3, fill: '#34d399', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="col-span-full bg-white dark:bg-card rounded-xl border border-neutral-200 dark:border-border p-5">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-semibold text-neutral-900 dark:text-foreground">Expected Revenue Forecast</h2>
              <TrendingUp className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-xs text-neutral-400 dark:text-muted-foreground mt-0.5">
              7-day prediction — trained on your order history
            </p>
          </div>
        </div>

        {forecastLoading ? (
          <div className="h-[200px] mt-4 rounded-lg bg-neutral-100 dark:bg-muted/30 animate-pulse" />
        ) : forecast.length === 0 ? (
          <div className="h-[200px] mt-4 flex flex-col items-center justify-center text-center">
            <TrendingUp className="w-8 h-8 text-neutral-300 dark:text-muted-foreground mb-2" />
            <p className="text-sm text-neutral-500 dark:text-muted-foreground max-w-xs">
              {forecastMessage ?? 'Not enough order history yet to forecast.'}
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200} className="mt-4">
            <AreaChart data={forecast} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-neutral-100 dark:text-border" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: 'currentColor' }}
                className="text-neutral-400 dark:text-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'currentColor' }}
                className="text-neutral-400 dark:text-muted-foreground"
                tickFormatter={v => `€${v}`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(v, name) => [
                  `€${Number(v).toFixed(2)}`,
                  name === 'predicted' ? 'Predicted' : name === 'upper' ? 'Upper' : 'Lower',
                ]}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              />
              {/* Confidence band — faint dashed upper/lower bounds */}
              <Line type="monotone" dataKey="upper" stroke="#a5b4fc" strokeWidth={1} strokeDasharray="4 4" dot={false} />
              <Line type="monotone" dataKey="lower" stroke="#a5b4fc" strokeWidth={1} strokeDasharray="4 4" dot={false} />
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#forecastGradient)"
                dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#4f46e5' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
