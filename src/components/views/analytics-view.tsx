'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  Phone,
  Clock,
  Target,
  ThumbsUp,
  TrendingUp,
  BarChart3,
  PieChartIcon,
  Activity,
} from 'lucide-react';

interface Analytics {
  callsOverTime: { date: string; inbound: number; outbound: number }[];
  outcomeDistribution: { name: string; value: number }[];
  sentimentBreakdown: { name: string; value: number }[];
  peakHours: { hour: string; calls: number }[];
  durationDistribution: { range: string; count: number }[];
  kpis: {
    avgHandlingTime: number;
    firstCallResolution: number;
    bookingRate: number;
    satisfactionScore: number;
    totalCalls: number;
    appointmentBooked: number;
  };
  providerStats: {
    provider: string;
    calls: number;
    avgDuration: number;
    bookingRate: number;
    satisfaction: number;
  }[];
}

const PIE_COLORS = ['#0d9488', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b', '#ec4899', '#06b6d4'];
const SENTIMENT_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export function AnalyticsView() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/analytics');
        const data = await res.json();
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-72 bg-slate-100 rounded animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return <div className="text-center py-20 text-slate-500">Failed to load analytics data.</div>;
  }

  const kpiCards = [
    {
      title: 'Total Calls',
      value: analytics.kpis.totalCalls,
      subtitle: `${analytics.kpis.appointmentBooked} booked`,
      icon: Phone,
      color: 'from-teal-500 to-emerald-600',
    },
    {
      title: 'Avg Handle Time',
      value: formatDuration(analytics.kpis.avgHandlingTime),
      subtitle: 'Per completed call',
      icon: Clock,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Booking Rate',
      value: `${analytics.kpis.bookingRate}%`,
      subtitle: 'Call-to-appointment',
      icon: Target,
      color: 'from-violet-500 to-purple-600',
    },
    {
      title: 'FCR Rate',
      value: `${analytics.kpis.firstCallResolution}%`,
      subtitle: 'First call resolution',
      icon: TrendingUp,
      color: 'from-amber-500 to-orange-600',
    },
    {
      title: 'Satisfaction',
      value: `${analytics.kpis.satisfactionScore}%`,
      subtitle: 'Positive sentiment',
      icon: ThumbsUp,
      color: 'from-pink-500 to-rose-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 mt-1">
          Performance insights and trends over the last 30 days
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{card.title}</p>
                    <p className="text-xl font-bold text-slate-900">{card.value}</p>
                    <p className="text-[10px] text-slate-400">{card.subtitle}</p>
                  </div>
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calls Over Time */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" />
              <CardTitle className="text-base font-semibold text-slate-900">Calls Over Time (30 days)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.callsOverTime} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="inboundGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="outboundGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} interval={4} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="inbound" stroke="#3b82f6" strokeWidth={2} fill="url(#inboundGrad)" />
                  <Area type="monotone" dataKey="outbound" stroke="#0d9488" strokeWidth={2} fill="url(#outboundGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-xs text-slate-500">Inbound</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-teal-500" />
                <span className="text-xs text-slate-500">Outbound</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Outcome Distribution */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-slate-400" />
              <CardTitle className="text-base font-semibold text-slate-900">Call Outcomes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-[240px] w-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.outcomeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {analytics.outcomeDistribution.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {analytics.outcomeDistribution.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-xs text-slate-600 flex-1 capitalize">{item.name.replace(/_/g, ' ')}</span>
                    <span className="text-xs font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Peak Call Hours */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <CardTitle className="text-base font-semibold text-slate-900">Peak Call Hours</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.peakHours.slice(6, 22)} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="calls" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sentiment Breakdown */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-slate-400" />
              <CardTitle className="text-base font-semibold text-slate-900">Patient Sentiment</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {analytics.sentimentBreakdown.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No sentiment data yet</p>
            ) : (
              <div className="space-y-6 py-4">
                {analytics.sentimentBreakdown.map((item, i) => {
                  const total = analytics.sentimentBreakdown.reduce((sum, s) => sum + s.value, 0);
                  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                  return (
                    <div key={item.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-slate-700 capitalize">{item.name}</span>
                        <span className="text-sm font-semibold text-slate-900">{pct}%</span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: SENTIMENT_COLORS[i % SENTIMENT_COLORS.length],
                          }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{item.value} calls</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Call Duration Distribution */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <CardTitle className="text-base font-semibold text-slate-900">Call Duration Distribution</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.durationDistribution} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
