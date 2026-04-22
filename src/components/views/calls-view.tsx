'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Search,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';

interface CallRecord {
  id: string;
  patientId: string | null;
  direction: string;
  status: string;
  duration: number | null;
  outcome: string | null;
  transcript: string | null;
  sentiment: string | null;
  providerCallId: string | null;
  createdAt: string;
  patient: { id: string; firstName: string; lastName: string; phone: string } | null;
}

interface CallsResponse {
  calls: CallRecord[];
  total: number;
  page: number;
  limit: number;
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

const statusIcons: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  failed: <XCircle className="w-4 h-4 text-red-500" />,
  voicemail: <AlertCircle className="w-4 h-4 text-amber-500" />,
  transferred: <AlertCircle className="w-4 h-4 text-purple-500" />,
};

const sentimentBadges: Record<string, { class: string; label: string }> = {
  positive: { class: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Positive' },
  neutral: { class: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Neutral' },
  negative: { class: 'bg-red-50 text-red-700 border-red-200', label: 'Negative' },
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function CallsView() {
  const [calls, setCalls] = useState<CallsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (outcomeFilter !== 'all') params.set('outcome', outcomeFilter);
      if (directionFilter !== 'all') params.set('direction', directionFilter);
      
      const res = await fetch(`/api/calls?${params}`);
      const data = await res.json();
      setCalls(data);
    } catch (err) {
      console.error('Failed to fetch calls:', err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, outcomeFilter, directionFilter]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  const handleFilterChange = (filter: string, setter: (v: string) => void) => {
    setter(filter);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Call History</h1>
          <p className="text-slate-500 mt-1">Complete log of all inbound and outbound calls</p>
        </div>
        <Button className="gap-2 bg-teal-600 hover:bg-teal-700 text-white" variant="default">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filters:</span>
            </div>
            <Select value={statusFilter} onValueChange={(v) => handleFilterChange(v, setStatusFilter)}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="voicemail">Voicemail</SelectItem>
                <SelectItem value="transferred">Transferred</SelectItem>
              </SelectContent>
            </Select>
            <Select value={outcomeFilter} onValueChange={(v) => handleFilterChange(v, setOutcomeFilter)}>
              <SelectTrigger className="w-[180px] h-9 text-xs">
                <SelectValue placeholder="Outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outcomes</SelectItem>
                <SelectItem value="appointment_booked">Booked</SelectItem>
                <SelectItem value="rescheduled">Rescheduled</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="information">Information</SelectItem>
                <SelectItem value="transferred">Transferred</SelectItem>
                <SelectItem value="no_answer">No Answer</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
              </SelectContent>
            </Select>
            <Select value={directionFilter} onValueChange={(v) => handleFilterChange(v, setDirectionFilter)}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Calls</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
              </SelectContent>
            </Select>
            {(statusFilter !== 'all' || outcomeFilter !== 'all' || directionFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs text-slate-500"
                onClick={() => {
                  setStatusFilter('all');
                  setOutcomeFilter('all');
                  setDirectionFilter('all');
                  setPage(1);
                }}
              >
                Clear All
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Calls Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-slate-400 mt-2">Loading calls...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100">
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Direction</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Duration</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outcome</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sentiment</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calls && calls.calls.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                        No calls found matching your filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    calls?.calls.map((call) => (
                      <TableRow key={call.id} className="border-slate-50 hover:bg-slate-50">
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {call.patient ? `${call.patient.firstName} ${call.patient.lastName}` : 'Unknown Caller'}
                            </p>
                            {call.patient && (
                              <p className="text-xs text-slate-400">{call.patient.phone}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {call.direction === 'inbound'
                              ? <PhoneIncoming className="w-3.5 h-3.5 text-blue-500" />
                              : <PhoneOutgoing className="w-3.5 h-3.5 text-emerald-500" />
                            }
                            <span className="text-xs text-slate-600 capitalize">{call.direction}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {statusIcons[call.status] || <AlertCircle className="w-4 h-4 text-slate-400" />}
                            <span className="text-xs text-slate-600 capitalize">{call.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600 font-mono">{formatDuration(call.duration)}</span>
                        </TableCell>
                        <TableCell>
                          {call.outcome ? (
                            <Badge className={`text-[10px] px-1.5 py-0 ${outcomeColors[call.outcome] || ''}`}>
                              {call.outcome.replace(/_/g, ' ')}
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {call.sentiment && sentimentBadges[call.sentiment] ? (
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${sentimentBadges[call.sentiment].class}`}>
                              {sentimentBadges[call.sentiment].label}
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-slate-500">{formatDate(call.createdAt)}</span>
                        </TableCell>
                        <TableCell>
                          {call.transcript && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-slate-400 hover:text-teal-600"
                                  onClick={() => setSelectedCall(call)}
                                >
                                  <FileText className="w-3.5 h-3.5 mr-1" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg">
                                <DialogHeader>
                                  <DialogTitle className="text-lg">Call Transcript</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-3 mt-4">
                                  <div className="flex items-center gap-4 text-sm text-slate-500">
                                    {call.patient && (
                                      <span><strong>Patient:</strong> {call.patient.firstName} {call.patient.lastName}</span>
                                    )}
                                    <span><strong>Duration:</strong> {formatDuration(call.duration)}</span>
                                    <span><strong>Date:</strong> {formatDate(call.createdAt)}</span>
                                  </div>
                                  <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap border border-slate-200">
                                    {call.transcript}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {calls && calls.total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, calls.total)} of {calls.total} calls
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-slate-600 px-2">Page {page}</span>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={page * 20 >= calls.total}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
