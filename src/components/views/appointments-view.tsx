'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  CalendarDays,
  Plus,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
} from 'lucide-react';

interface Appointment {
  id: string;
  patientId: string;
  date: string;
  duration: number;
  type: string;
  status: string;
  notes: string | null;
  createdAt: string;
  patient: { id: string; firstName: string; lastName: string; phone: string; email?: string };
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface ApptsResponse {
  appointments: Appointment[];
  total: number;
  page: number;
  limit: number;
}

const typeIcons: Record<string, string> = {
  cleaning: '🦷',
  checkup: '🔍',
  emergency: '🚨',
  consultation: '💬',
  whitening: '✨',
};

const typeColors: Record<string, string> = {
  cleaning: 'bg-teal-50 text-teal-700 border-teal-200',
  checkup: 'bg-blue-50 text-blue-700 border-blue-200',
  emergency: 'bg-red-50 text-red-700 border-red-200',
  consultation: 'bg-purple-50 text-purple-700 border-purple-200',
  whitening: 'bg-amber-50 text-amber-700 border-amber-200',
};

const statusStyles: Record<string, { class: string; icon: React.ReactNode }> = {
  scheduled: { class: 'bg-amber-100 text-amber-700', icon: <Clock className="w-3 h-3" /> },
  confirmed: { class: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="w-3 h-3" /> },
  completed: { class: 'bg-blue-100 text-blue-700', icon: <CheckCircle2 className="w-3 h-3" /> },
  cancelled: { class: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" /> },
  'no-show': { class: 'bg-slate-100 text-slate-600', icon: <AlertCircle className="w-3 h-3" /> },
};

function formatApptDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function isUpcoming(dateStr: string): boolean {
  return new Date(dateStr) > new Date();
}

export function AppointmentsView() {
  const [appts, setAppts] = useState<ApptsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [form, setForm] = useState({
    patientId: '',
    date: '',
    duration: '30',
    type: 'checkup',
    notes: '',
  });
  const [creating, setCreating] = useState(false);

  const fetchAppts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (showUpcoming) params.set('upcoming', 'true');

      const res = await fetch(`/api/appointments?${params}`);
      const data = await res.json();
      setAppts(data);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter, showUpcoming]);

  useEffect(() => {
    fetchAppts();
  }, [fetchAppts]);

  useEffect(() => {
    async function fetchPatients() {
      try {
        const res = await fetch('/api/patients?limit=100');
        const data = await res.json();
        setPatients(data.patients || []);
      } catch (err) {
        console.error('Failed to fetch patients:', err);
      }
    }
    fetchPatients();
  }, []);

  const handleCreate = async () => {
    if (!form.patientId || !form.date) return;
    setCreating(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          duration: parseInt(form.duration),
        }),
      });
      if (res.ok) {
        setDialogOpen(false);
        setForm({ patientId: '', date: '', duration: '30', type: 'checkup', notes: '' });
        fetchAppts();
      }
    } catch (err) {
      console.error('Failed to create appointment:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleFilterChange = (filter: string, setter: (v: string) => void) => {
    setter(filter);
    setPage(1);
  };

  const upcoming = appts?.appointments.filter((a) => isUpcoming(a.date)).length || 0;
  const today = appts?.appointments.filter((a) => {
    const d = new Date(a.date);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
          <p className="text-slate-500 mt-1">
            {upcoming} upcoming &middot; {today} today
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-teal-600 hover:bg-teal-700 text-white" variant="default">
              <Plus className="w-4 h-4" />
              New Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule New Appointment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-sm font-medium text-slate-700">Patient</Label>
                <Select value={form.patientId} onValueChange={(v) => setForm({ ...form, patientId: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} — {p.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium text-slate-700">Date & Time</Label>
                  <Input
                    type="datetime-local"
                    className="mt-1"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Duration (min)</Label>
                  <Select value={form.duration} onValueChange={(v) => setForm({ ...form, duration: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">60 min</SelectItem>
                      <SelectItem value="90">90 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">Appointment Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checkup">Checkup</SelectItem>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="whitening">Whitening</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">Notes</Label>
                <Textarea
                  className="mt-1"
                  placeholder="Optional notes..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <Button
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                onClick={handleCreate}
                disabled={creating || !form.patientId || !form.date}
              >
                {creating ? 'Scheduling...' : 'Schedule Appointment'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filters:</span>
            </div>
            <Button
              size="sm"
              variant={showUpcoming ? 'default' : 'outline'}
              className={`h-8 text-xs ${showUpcoming ? 'bg-teal-600 text-white hover:bg-teal-700' : 'border-slate-200 text-slate-600'}`}
              onClick={() => setShowUpcoming(!showUpcoming)}
            >
              Upcoming Only
            </Button>
            <Select value={statusFilter} onValueChange={(v) => handleFilterChange(v, setStatusFilter)}>
              <SelectTrigger className="w-[150px] h-9 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no-show">No Show</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => handleFilterChange(v, setTypeFilter)}>
              <SelectTrigger className="w-[150px] h-9 text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="cleaning">Cleaning</SelectItem>
                <SelectItem value="checkup">Checkup</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="consultation">Consultation</SelectItem>
                <SelectItem value="whitening">Whitening</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appts && appts.appointments.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400">
              <CalendarDays className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">No appointments found matching your filters</p>
            </div>
          ) : (
            appts?.appointments.map((appt) => {
              const st = statusStyles[appt.status] || statusStyles.scheduled;
              const upcoming = isUpcoming(appt.date);
              return (
                <Card
                  key={appt.id}
                  className={`border-slate-200 shadow-sm hover:shadow-md transition-all ${
                    appt.status === 'cancelled' ? 'opacity-60' : ''
                  } ${upcoming ? 'ring-1 ring-teal-100' : ''}`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-2xl">{typeIcons[appt.type] || '📋'}</div>
                      <Badge className={`text-[10px] px-2 py-0.5 flex items-center gap-1 ${st.class}`}>
                        {st.icon}
                        {appt.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <p className="text-sm font-semibold text-slate-900">
                          {appt.patient.firstName} {appt.patient.lastName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                        <p className="text-xs text-slate-500">{formatApptDate(appt.date)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <p className="text-xs text-slate-500">{appt.duration} minutes</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <Badge variant="outline" className={`text-[10px] ${typeColors[appt.type] || ''}`}>
                        {appt.type}
                      </Badge>
                      {appt.notes && (
                        <p className="text-xs text-slate-400 mt-1.5 truncate">{appt.notes}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Pagination */}
      {appts && appts.total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, appts.total)} of {appts.total}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-slate-600 px-2">Page {page}</span>
            <Button variant="outline" size="sm" className="h-8" disabled={page * 20 >= appts.total} onClick={() => setPage(page + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
