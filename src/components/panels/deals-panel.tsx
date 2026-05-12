'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { toast } from 'sonner';

interface Deal {
  id: string;
  title: string;
  value: number;
  status: string;
  probability: number;
  expectedClose: string | null;
  leadId: string;
  lead: { name: string; company: string | null };
  payments: Array<{ id: string; amount: number; status: string }>;
  createdAt: string;
}

interface DealsData {
  deals: Deal[];
  monthlyRevenueBreakdown: Record<string, number>;
  upcomingPayments: Array<{
    id: string;
    amount: number;
    status: string;
    dueDate: string | null;
    deal: { title: string; lead: { name: string } };
  }>;
  revenueForecast: number;
}

interface Lead {
  id: string;
  name: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  pipeline: { label: 'Pipeline', color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock },
  negotiation: { label: 'Negotiation', color: 'text-blue-700', bg: 'bg-blue-100', icon: TrendingUp },
  'closed-won': { label: 'Closed Won', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle2 },
  'closed-lost': { label: 'Closed Lost', color: 'text-rose-700', bg: 'bg-rose-100', icon: XCircle },
};

const pieColors = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'];

export function DealsPanel() {
  const [data, setData] = useState<DealsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    value: 0,
    leadId: '',
    status: 'pipeline',
    probability: 50,
    expectedClose: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/deals');
      const d = await res.json();
      setData(d);
    } catch (error) {
      console.error('Failed to fetch deals:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/leads');
      const d = await res.json();
      setLeads(d);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchLeads();
  }, [fetchData, fetchLeads]);

  const handleCreateDeal = async () => {
    if (!form.title.trim() || !form.leadId) {
      toast.error('Title and lead are required');
      return;
    }
    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          value: Number(form.value),
          probability: Number(form.probability),
          expectedClose: form.expectedClose || undefined,
        }),
      });
      if (res.ok) {
        toast.success('Deal created successfully');
        setDialogOpen(false);
        setForm({ title: '', value: 0, leadId: '', status: 'pipeline', probability: 50, expectedClose: '' });
        fetchData();
      } else {
        toast.error('Failed to create deal');
      }
    } catch {
      toast.error('Failed to create deal');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  const pipelineValue = data.deals.filter(d => d.status === 'pipeline').reduce((s, d) => s + d.value, 0);
  const negotiationValue = data.deals.filter(d => d.status === 'negotiation').reduce((s, d) => s + d.value, 0);
  const closedWonValue = data.deals.filter(d => d.status === 'closed-won').reduce((s, d) => s + d.value, 0);
  const closedLostValue = data.deals.filter(d => d.status === 'closed-lost').reduce((s, d) => s + d.value, 0);

  const summaryCards = [
    { label: 'Pipeline', value: pipelineValue, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Negotiation', value: negotiationValue, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Closed Won', value: closedWonValue, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Closed Lost', value: closedLostValue, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const pieData = Object.entries(data.monthlyRevenueBreakdown || {}).map(([status, value]) => ({
    name: status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                  <p className="text-xl font-bold mt-1">{formatCurrency(card.value)}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Forecast */}
      {data.revenueForecast > 0 && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-emerald-900">Revenue Forecast</p>
                <p className="text-xs text-emerald-700">
                  Weighted pipeline: <span className="font-bold">{formatCurrency(data.revenueForecast)}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }: { name: string; percent: number }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No deal data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deals Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">All Deals</CardTitle>
              <CardDescription>{data.deals.length} total deals</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Deal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Deal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Deal Title *</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Deal title" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Value ($)</Label>
                      <Input type="number" min={0} value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Probability (%)</Label>
                      <Input type="number" min={0} max={100} value={form.probability} onChange={(e) => setForm({ ...form, probability: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Lead *</Label>
                    <Select value={form.leadId} onValueChange={(v) => setForm({ ...form, leadId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select a lead" /></SelectTrigger>
                      <SelectContent>
                        {leads.map((lead) => (
                          <SelectItem key={lead.id} value={lead.id}>{lead.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pipeline">Pipeline</SelectItem>
                          <SelectItem value="negotiation">Negotiation</SelectItem>
                          <SelectItem value="closed-won">Closed Won</SelectItem>
                          <SelectItem value="closed-lost">Closed Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Expected Close</Label>
                      <Input type="date" value={form.expectedClose} onChange={(e) => setForm({ ...form, expectedClose: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateDeal} className="bg-emerald-600 hover:bg-emerald-700">Create Deal</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {data.deals.length > 0 ? (
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deal</TableHead>
                      <TableHead>Lead</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Probability</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Close Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.deals.map((deal) => {
                      const config = statusConfig[deal.status] || statusConfig.pipeline;
                      return (
                        <TableRow key={deal.id}>
                          <TableCell className="font-medium">{deal.title}</TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{deal.lead?.name}</p>
                              {deal.lead?.company && (
                                <p className="text-xs text-muted-foreground">{deal.lead.company}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">{formatCurrency(deal.value)}</TableCell>
                          <TableCell>{deal.probability}%</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`${config.bg} ${config.color} text-xs`}>
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {deal.expectedClose ? new Date(deal.expectedClose).toLocaleDateString() : '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No deals yet. Create your first deal to get started.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Payments */}
      {data.upcomingPayments && data.upcomingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Payments</CardTitle>
            <CardDescription>Pending payments due</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.upcomingPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{payment.deal?.title || 'Unknown Deal'}</p>
                    <p className="text-xs text-muted-foreground">{payment.deal?.lead?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(payment.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      Due: {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : 'No date'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
