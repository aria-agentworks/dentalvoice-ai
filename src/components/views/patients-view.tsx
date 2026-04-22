'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Shield,
  FileText,
} from 'lucide-react';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  dateOfBirth: string | null;
  insurance: string | null;
  notes: string | null;
  createdAt: string;
  _count: { calls: number; appointments: number };
}

interface PatientsResponse {
  patients: Patient[];
  total: number;
  page: number;
  limit: number;
}

export function PatientsView() {
  const [patients, setPatients] = useState<PatientsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    insurance: '',
    notes: '',
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await fetch(`/api/patients?${params}`);
      const data = await res.json();
      setPatients(data);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleCreate = async () => {
    if (!form.firstName || !form.lastName || !form.phone) return;
    setCreating(true);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          email: form.email || null,
          dateOfBirth: form.dateOfBirth || null,
          insurance: form.insurance || null,
          notes: form.notes || null,
        }),
      });
      if (res.ok) {
        setDialogOpen(false);
        setForm({ firstName: '', lastName: '', phone: '', email: '', dateOfBirth: '', insurance: '', notes: '' });
        fetchPatients();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create patient');
      }
    } catch (err) {
      console.error('Failed to create patient:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
          <p className="text-slate-500 mt-1">
            {patients ? `${patients.total} total patients` : 'Loading...'}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-teal-600 hover:bg-teal-700 text-white" variant="default">
              <Plus className="w-4 h-4" />
              Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium text-slate-700">First Name *</Label>
                  <Input
                    className="mt-1"
                    placeholder="John"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Last Name *</Label>
                  <Input
                    className="mt-1"
                    placeholder="Doe"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">Phone *</Label>
                <Input
                  className="mt-1"
                  placeholder="(555) 123-4567"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">Email</Label>
                <Input
                  className="mt-1"
                  type="email"
                  placeholder="patient@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium text-slate-700">Date of Birth</Label>
                  <Input
                    className="mt-1"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Insurance</Label>
                  <Input
                    className="mt-1"
                    placeholder="Delta Dental PPO"
                    value={form.insurance}
                    onChange={(e) => setForm({ ...form, insurance: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">Notes</Label>
                <Textarea
                  className="mt-1"
                  placeholder="Any patient notes..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <Button
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                onClick={handleCreate}
                disabled={creating || !form.firstName || !form.lastName || !form.phone}
              >
                {creating ? 'Adding...' : 'Add Patient'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              className="pl-9 h-10"
              placeholder="Search patients by name, phone, or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-slate-400 mt-2">Loading patients...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100">
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Insurance</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Calls</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Appts</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Added</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients && patients.patients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        {search ? 'No patients match your search' : 'No patients yet'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    patients?.patients.map((p) => (
                      <TableRow key={p.id} className="border-slate-50 hover:bg-slate-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center text-teal-700 text-sm font-semibold flex-shrink-0">
                              {p.firstName[0]}{p.lastName[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {p.firstName} {p.lastName}
                              </p>
                              {p.dateOfBirth && (
                                <p className="text-xs text-slate-400">
                                  DOB: {new Date(p.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span className="text-xs text-slate-600">{p.phone}</span>
                            </div>
                            {p.email && (
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span className="text-xs text-slate-600 truncate max-w-[180px]">{p.email}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {p.insurance ? (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-200 text-slate-600 flex items-center gap-1 w-fit">
                              <Shield className="w-3 h-3" />
                              {p.insurance}
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-300">Self-pay</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-600">
                            {p._count.calls}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-600">
                            {p._count.appointments}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-slate-400">
                            {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
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
      {patients && patients.total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, patients.total)} of {patients.total}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-slate-600 px-2">Page {page}</span>
            <Button variant="outline" size="sm" className="h-8" disabled={page * 20 >= patients.total} onClick={() => setPage(page + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
