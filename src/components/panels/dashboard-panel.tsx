'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  DollarSign,
  Handshake,
  Phone,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DashboardData {
  totalLeads: number;
  newLeadsToday: number;
  totalRevenue: number;
  monthlyRevenue: number;
  revenueByDay: { date: string; revenue: number }[];
  totalDeals: number;
  dealsInPipeline: number;
  totalCalls: number;
  recentCallLogs: Array<{
    id: string;
    outcome: string | null;
    duration: number;
    createdAt: string;
    lead: { name: string };
    agent: { name: string } | null;
  }>;
  contactAttemptsToday: number;
  leadEngineStats: Record<string, number>;
  monthlyRevenueBreakdown: Record<string, number>;
  revenueForecast: number;
  callsByDay: { date: string; calls: number }[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const outcomeColors: Record<string, string> = {
  interested: 'bg-emerald-100 text-emerald-800',
  qualified: 'bg-emerald-100 text-emerald-800',
  callback: 'bg-amber-100 text-amber-800',
  'not-interested': 'bg-rose-100 text-rose-800',
  'no-answer': 'bg-zinc-100 text-zinc-800',
  busy: 'bg-zinc-100 text-zinc-800',
  voicemail: 'bg-blue-100 text-blue-800',
};

export function DashboardPanel() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Total Leads',
      value: data.totalLeads,
      subtitle: `${data.newLeadsToday} new today`,
      icon: Users,
      trend: data.newLeadsToday > 0 ? 'up' : 'neutral',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Revenue',
      value: formatCurrency(data.totalRevenue),
      subtitle: `${formatCurrency(data.monthlyRevenue)} this month`,
      icon: DollarSign,
      trend: data.monthlyRevenue > 0 ? 'up' : 'neutral',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Active Deals',
      value: data.totalDeals,
      subtitle: `${data.dealsInPipeline} in pipeline`,
      icon: Handshake,
      trend: 'neutral',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Total Calls',
      value: data.totalCalls,
      subtitle: `${data.contactAttemptsToday} attempts today`,
      icon: Phone,
      trend: 'neutral',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
  ];

  const pipelineData = Object.entries(data.leadEngineStats || {}).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
  }));

  const revenueChartData = (data.revenueByDay || []).map(d => ({
    ...d,
    date: formatDate(d.date),
  }));

  const callsChartData = (data.callsByDay || []).map(d => ({
    ...d,
    date: formatDate(d.date),
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <div className="flex items-center gap-1">
                    {kpi.trend === 'up' && (
                      <TrendingUp className="h-3 w-3 text-emerald-600" />
                    )}
                    <p className="text-xs text-muted-foreground">{kpi.subtitle}</p>
                  </div>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${kpi.bg}`}>
                  <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Forecast Card */}
      {data.revenueForecast > 0 && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-emerald-900">Revenue Forecast</p>
                <p className="text-xs text-emerald-700">
                  Weighted pipeline value: <span className="font-bold">{formatCurrency(data.revenueForecast)}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue (Last 30 Days)</CardTitle>
            <CardDescription>Daily revenue trend</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueChartData.length > 0 && revenueChartData.some(d => d.revenue > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Revenue']} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    fill="url(#revenueGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No revenue data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lead Pipeline Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lead Pipeline</CardTitle>
            <CardDescription>Leads by status</CardDescription>
          </CardHeader>
          <CardContent>
            {pipelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={pipelineData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="status" className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No leads yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Calls Chart & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calls Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Call Activity</CardTitle>
            <CardDescription>Daily call volume</CardDescription>
          </CardHeader>
          <CardContent>
            {callsChartData.length > 0 && callsChartData.some(d => d.calls > 0) ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={callsChartData}>
                  <defs>
                    <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="calls"
                    stroke="#3b82f6"
                    fill="url(#callsGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No call data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>Latest call logs</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentCallLogs.length > 0 ? (
              <div className="space-y-3 max-h-[240px] overflow-y-auto">
                {data.recentCallLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between gap-2 py-2 border-b last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{log.lead?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.agent?.name || 'No Agent'} · {Math.floor(log.duration / 60)}m {log.duration % 60}s
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`shrink-0 text-[10px] ${outcomeColors[log.outcome || ''] || 'bg-zinc-100 text-zinc-800'}`}
                    >
                      {log.outcome || 'pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[240px] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue Breakdown by Deal Status</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(data.monthlyRevenueBreakdown || {}).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(data.monthlyRevenueBreakdown).map(([status, value]) => {
                const statusColors: Record<string, string> = {
                  pipeline: 'bg-amber-50 text-amber-800 border-amber-200',
                  negotiation: 'bg-blue-50 text-blue-800 border-blue-200',
                  'closed-won': 'bg-emerald-50 text-emerald-800 border-emerald-200',
                  'closed-lost': 'bg-rose-50 text-rose-800 border-rose-200',
                };
                return (
                  <div key={status} className={`rounded-lg border p-4 ${statusColors[status] || 'bg-zinc-50 text-zinc-800 border-zinc-200'}`}>
                    <p className="text-xs font-medium capitalize">{status.replace('-', ' ')}</p>
                    <p className="text-lg font-bold mt-1">{formatCurrency(value)}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No deal revenue data yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
