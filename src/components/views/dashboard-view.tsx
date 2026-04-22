'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Phone,
  CalendarDays,
  Users,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  PhoneIncoming,
  PhoneOutgoing,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DashboardStats {
  totalPatients: number;
  todayCalls: number;
  totalCalls: number;
  upcomingAppointments: number;
  todayCompletedCalls: number;
  weekCalls: number;
  avgCallDuration: number;
  todayBookings: number;
  activePatients: number;
  recentCalls: RecentCall[];
  upcomingApptList: UpcomingAppt[];
  callsThisWeek: { date: string; count: number }[];
}

interface RecentCall {
  id: string;
  direction: string;
  status: string;
  duration: number | null;
  outcome: string | null;
  sentiment: string | null;
  createdAt: string;
  patient: { firstName: string; lastName: string; phone: string } | null;
}

interface UpcomingAppt {
  id: string;
  date: string;
  duration: number;
  type: string;
  status: string;
  notes: string | null;
  patient: { firstName: string; lastName: string; phone: string };
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatApptDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  
  if (isToday) return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  if (isTomorrow) return `Tomorrow at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + 
    ' at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

const outcomeColors: Record<string, string> = {
  appointment_booked: 'bg-emerald-100 text-emerald-700',
  rescheduled: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-700',
  information: 'bg-blue-100 text-blue-700',
  voicemail: 'bg-slate-100 text-slate-600',
  no_answer: 'bg-slate-100 text-slate-600',
  transferred: 'bg-purple-100 text-purple-700',
  spam: 'bg-gray-100 text-gray-600',
};

const sentimentIcons: Record<string, React.ReactNode> = {
  positive: <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />,
  neutral: <AlertCircle className="w-3.5 h-3.5 text-amber-500" />,
  negative: <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />,
};

const typeIcons: Record<string, string> = {
  cleaning: '🦷',
  checkup: '🔍',
  emergency: '🚨',
  consultation: '💬',
  whitening: '✨',
};

export function DashboardView() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/stats');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-72 bg-slate-100 rounded animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center py-20 text-slate-500">Failed to load dashboard data.</div>;
  }

  const statCards = [
    {
      title: 'Today\'s Calls',
      value: stats.todayCalls,
      subtitle: `${stats.todayCompletedCalls} completed`,
      icon: Phone,
      color: 'from-teal-500 to-emerald-600',
      trend: stats.todayCalls > 0 ? 'up' : 'neutral' as const,
    },
    {
      title: 'Upcoming Appts',
      value: stats.upcomingAppointments,
      subtitle: `${stats.todayBookings} booked today`,
      icon: CalendarDays,
      color: 'from-blue-500 to-indigo-600',
      trend: stats.todayBookings > 0 ? 'up' : 'neutral' as const,
    },
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      subtitle: `${stats.activePatients} active (30d)`,
      icon: Users,
      color: 'from-violet-500 to-purple-600',
      trend: 'neutral' as const,
    },
    {
      title: 'Avg Call Time',
      value: formatDuration(stats.avgCallDuration),
      subtitle: `${stats.weekCalls} calls this week`,
      icon: Clock,
      color: 'from-amber-500 to-orange-600',
      trend: 'neutral' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Real-time overview of your dental front desk operations
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{card.title}</p>
                    <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                    <p className="text-xs text-slate-400">{card.subtitle}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Call Volume Chart */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900">Call Volume This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.callsThisWeek} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '13px',
                    }}
                  />
                  <Bar dataKey="count" fill="#0d9488" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start gap-3 bg-teal-600 hover:bg-teal-700 text-white" variant="default">
              <Phone className="w-4 h-4" />
              Make Outbound Call
            </Button>
            <Button className="w-full justify-start gap-3 border-slate-200 hover:bg-slate-50 text-slate-700" variant="outline">
              <CalendarDays className="w-4 h-4" />
              New Appointment
            </Button>
            <Button className="w-full justify-start gap-3 border-slate-200 hover:bg-slate-50 text-slate-700" variant="outline">
              <Users className="w-4 h-4" />
              Add Patient
            </Button>
            <Button className="w-full justify-start gap-3 border-slate-200 hover:bg-slate-50 text-slate-700" variant="outline">
              <PhoneOutgoing className="w-4 h-4" />
              Batch Call Reminders
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Calls */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-900">Recent Calls</CardTitle>
              <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                {stats.totalCalls} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {stats.recentCalls.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No calls yet</p>
              ) : (
                stats.recentCalls.map((call) => (
                  <div
                    key={call.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      call.direction === 'inbound' ? 'bg-blue-50' : 'bg-emerald-50'
                    }`}>
                      {call.direction === 'inbound' 
                        ? <PhoneIncoming className="w-4 h-4 text-blue-600" />
                        : <PhoneOutgoing className="w-4 h-4 text-emerald-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {call.patient ? `${call.patient.firstName} ${call.patient.lastName}` : 'Unknown Caller'}
                        </p>
                        {call.sentiment && sentimentIcons[call.sentiment]}
                      </div>
                      <p className="text-xs text-slate-400">
                        {formatDuration(call.duration)} &middot; {timeAgo(call.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {call.outcome && (
                        <Badge className={`text-[10px] px-1.5 py-0 ${outcomeColors[call.outcome] || 'bg-slate-100 text-slate-600'}`}>
                          {call.outcome.replace(/_/g, ' ')}
                        </Badge>
                      )}
                      {call.status === 'completed' 
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        : call.status === 'failed'
                        ? <XCircle className="w-3.5 h-3.5 text-red-500" />
                        : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      }
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-900">Upcoming Appointments</CardTitle>
              <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-600">
                {stats.upcomingAppointments} scheduled
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {stats.upcomingApptList.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No upcoming appointments</p>
              ) : (
                stats.upcomingApptList.map((appt) => (
                  <div
                    key={appt.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
                  >
                    <div className="text-2xl flex-shrink-0">
                      {typeIcons[appt.type] || '📋'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {appt.patient.firstName} {appt.patient.lastName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatApptDate(appt.date)} &middot; {appt.duration} min
                      </p>
                      {appt.notes && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{appt.notes}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={`text-[10px] px-1.5 py-0 ${
                        appt.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {appt.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-200 text-slate-500">
                        {appt.type}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
