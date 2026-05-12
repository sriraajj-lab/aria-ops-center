'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Search,
  GripVertical,
  Building2,
  Star,
  DollarSign,
  X,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string;
  status: string;
  score: number;
  estimatedValue: number;
  notes: string | null;
  lastContactAt: string | null;
  createdAt: string;
  deals: Array<{ id: string; title: string; value: number; status: string }>;
  callLogs: Array<{ id: string; outcome: string | null; createdAt: string }>;
  contactAttempts: Array<{ id: string; method: string; status: string }>;
}

const columns = [
  { id: 'new', label: 'New', color: 'border-t-zinc-400' },
  { id: 'contacted', label: 'Contacted', color: 'border-t-blue-400' },
  { id: 'qualified', label: 'Qualified', color: 'border-t-amber-400' },
  { id: 'proposal', label: 'Proposal', color: 'border-t-purple-400' },
  { id: 'negotiation', label: 'Negotiation', color: 'border-t-orange-400' },
  { id: 'won', label: 'Won', color: 'border-t-emerald-400' },
  { id: 'lost', label: 'Lost', color: 'border-t-rose-400' },
];

const sourceColors: Record<string, string> = {
  manual: 'bg-zinc-100 text-zinc-700',
  website: 'bg-emerald-100 text-emerald-700',
  referral: 'bg-blue-100 text-blue-700',
  linkedin: 'bg-sky-100 text-sky-700',
  'cold-outreach': 'bg-amber-100 text-amber-700',
};

function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500 text-white';
  if (score >= 60) return 'bg-amber-500 text-white';
  if (score >= 40) return 'bg-orange-500 text-white';
  return 'bg-zinc-400 text-white';
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function LeadPipelinePanel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'manual',
    score: 0,
    estimatedValue: 0,
    notes: '',
    status: 'new',
  });

  const fetchLeads = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterSource !== 'all') params.set('source', filterSource);
      const res = await fetch(`/api/leads?${params.toString()}`);
      const data = await res.json();
      setLeads(data);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  }, [search, filterSource]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleCreateLead = async () => {
    if (!form.name.trim()) {
      toast.error('Lead name is required');
      return;
    }
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          estimatedValue: Number(form.estimatedValue),
          score: Number(form.score),
        }),
      });
      if (res.ok) {
        toast.success('Lead created successfully');
        setDialogOpen(false);
        setEditLead(null);
        setForm({ name: '', email: '', phone: '', company: '', source: 'manual', score: 0, estimatedValue: 0, notes: '', status: 'new' });
        fetchLeads();
      } else {
        toast.error('Failed to create lead');
      }
    } catch {
      toast.error('Failed to create lead');
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, status: newStatus }),
      });
      if (res.ok) {
        toast.success('Lead status updated');
        fetchLeads();
      }
    } catch {
      toast.error('Failed to update lead status');
    }
  };

  const openEditDialog = (lead: Lead) => {
    setEditLead(lead);
    setForm({
      name: lead.name,
      email: lead.email || '',
      phone: lead.phone || '',
      company: lead.company || '',
      source: lead.source,
      score: lead.score,
      estimatedValue: lead.estimatedValue,
      notes: lead.notes || '',
      status: lead.status,
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditLead(null);
    setForm({ name: '', email: '', phone: '', company: '', source: 'manual', score: 0, estimatedValue: 0, notes: '', status: 'new' });
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-72 shrink-0 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              className="pl-9 w-full sm:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="cold-outreach">Cold Outreach</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-1" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editLead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Lead name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@company.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555 000 0000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="cold-outreach">Cold Outreach</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="score">Score (0-100)</Label>
                  <Input id="score" type="number" min={0} max={100} value={form.score} onChange={(e) => setForm({ ...form, score: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedValue">Est. Value ($)</Label>
                  <Input id="estimatedValue" type="number" min={0} value={form.estimatedValue} onChange={(e) => setForm({ ...form, estimatedValue: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." rows={3} />
              </div>
              {editLead && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {columns.map(col => (
                        <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateLead} className="bg-emerald-600 hover:bg-emerald-700">
                  {editLead ? 'Update Lead' : 'Create Lead'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnLeads = leads.filter((l) => l.status === column.id);
          return (
            <div
              key={column.id}
              className={`shrink-0 w-72 rounded-xl border-t-4 ${column.color} bg-muted/30`}
            >
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">{column.label}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {columnLeads.length}
                  </Badge>
                </div>
                <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto">
                  {columnLeads.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-xs text-muted-foreground">No leads</p>
                    </div>
                  ) : (
                    columnLeads.map((lead) => (
                      <Card
                        key={lead.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => openEditDialog(lead)}
                      >
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{lead.name}</p>
                              {lead.company && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Building2 className="h-3 w-3" />
                                  <span className="truncate">{lead.company}</span>
                                </div>
                              )}
                            </div>
                            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold shrink-0 ${getScoreColor(lead.score)}`}>
                              {lead.score}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className={`text-[10px] ${sourceColors[lead.source] || ''}`}>
                              {lead.source}
                            </Badge>
                            {lead.estimatedValue > 0 && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <DollarSign className="h-3 w-3" />
                                {formatCurrency(lead.estimatedValue)}
                              </div>
                            )}
                          </div>
                          {lead.callLogs.length > 0 && (
                            <p className="text-[10px] text-muted-foreground">
                              Last call: {lead.callLogs[0]?.outcome || 'N/A'}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
