'use client';

import { TriangleAlert } from 'lucide-react';
import { Provider, Root, Trigger, Portal, Content, Arrow } from '@radix-ui/react-tooltip';
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

// TODO(api): replace with → GET /api/ml/revenue-forecast  (Python ML model)
// Expected shape: [{ day: 'Mon', predicted: 210, lower: 180, upper: 240 }, ...]
const MOCK_REVENUE_FORECAST = [
  { day: 'Mon', predicted: 195, lower: 170, upper: 220 },
  { day: 'Tue', predicted: 212, lower: 185, upper: 238 },
  { day: 'Wed', predicted: 188, lower: 160, upper: 215 },
  { day: 'Thu', predicted: 230, lower: 200, upper: 258 },
  { day: 'Fri', predicted: 265, lower: 235, upper: 295 },
  { day: 'Sat', predicted: 310, lower: 275, upper: 345 },
  { day: 'Sun', predicted: 280, lower: 248, upper: 312 },
];

type Props = {
  revenueByHour: { hour: string; revenue: number }[];
  peakRevenueHour: { hour: string; revenue: number };
  isLoading: boolean;
};

export default function OverviewCharts({ revenueByHour, peakRevenueHour, isLoading }: Props) {
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
              <Provider delayDuration={200}>
                <Root>
                  <Trigger asChild>
                    <button
                      type="button"
                      className="text-neutral-400 hover:text-neutral-500 dark:text-muted-foreground dark:hover:text-neutral-400 transition"
                    >
                      <TriangleAlert className="w-3.5 h-3.5" />
                    </button>
                  </Trigger>
                  <Portal>
                    <Content
                      side="top"
                      className="max-w-[240px] px-3 py-2 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs leading-relaxed shadow-lg z-50"
                    >
                      Accuracy improves over time. This model learns from your order history — predictions will be
                      unreliable at first and become more accurate as more data is collected.
                      <Arrow className="fill-neutral-900 dark:fill-neutral-100" />
                    </Content>
                  </Portal>
                </Root>
              </Provider>
            </div>
            <p className="text-xs text-neutral-400 dark:text-muted-foreground mt-0.5">
              7-day prediction — powered by ML model
            </p>
          </div>
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
            Mock data · API pending
          </span>
        </div>

        <ResponsiveContainer width="100%" height={200} className="mt-4">
          <AreaChart data={MOCK_REVENUE_FORECAST} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
              formatter={v => [`€${Number(v).toFixed(2)}`, 'Predicted Revenue']}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            />
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
      </div>
    </div>
  );
}
