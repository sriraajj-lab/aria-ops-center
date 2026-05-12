'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  PhoneMissed,
  Clock,
  UserCheck,
  UserX,
  Plus,
  Play,
  Pause,
  Wifi,
  WifiOff,
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
import { Progress } from '@/components/ui/progress';
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
import { toast } from 'sonner';

interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
  vapiAgentId: string | null;
  speciality: string | null;
  totalCalls: number;
  successRate: number;
  recentCalls?: number;
}

interface CallLog {
  id: string;
  leadId: string;
  agentId: string | null;
  outcome: string | null;
  duration: number;
  recording: string | null;
  transcript: string | null;
  summary: string | null;
  createdAt: string;
  lead: { name: string };
  agent: { name: string } | null;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

const outcomeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  interested: UserCheck,
  qualified: UserCheck,
  callback: Clock,
  'not-interested': UserX,
  'no-answer': PhoneMissed,
  busy: PhoneOff,
  voicemail: Phone,
};

const outcomeColors: Record<string, string> = {
  interested: 'bg-emerald-100 text-emerald-800',
  qualified: 'bg-emerald-100 text-emerald-800',
  callback: 'bg-amber-100 text-amber-800',
  'not-interested': 'bg-rose-100 text-rose-800',
  'no-answer': 'bg-zinc-100 text-zinc-800',
  busy: 'bg-zinc-100 text-zinc-800',
  voicemail: 'bg-blue-100 text-blue-800',
};

const agentStatusConfig: Record<string, { color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  available: { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Wifi },
  busy: { color: 'text-amber-600', bg: 'bg-amber-50', icon: PhoneCall },
  offline: { color: 'text-zinc-500', bg: 'bg-zinc-50', icon: WifiOff },
};

export function CallingAgentPanel() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [agentStats, setAgentStats] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    speciality: '',
    vapiAgentId: '',
    status: 'available',
  });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/calling');
      const data = await res.json();
      setAgents(data.agents || []);
      setCallLogs(data.callLogs || []);
      setAgentStats(data.agentStats || []);
    } catch (error) {
      console.error('Failed to fetch calling data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateAgent = async () => {
    if (!form.name.trim()) {
      toast.error('Agent name is required');
      return;
    }
    try {
      const res = await fetch('/api/calling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, type: 'calling' }),
      });
      if (res.ok) {
        toast.success('Agent created successfully');
        setDialogOpen(false);
        setForm({ name: '', speciality: '', vapiAgentId: '', status: 'available' });
        fetchData();
      } else {
        toast.error('Failed to create agent');
      }
    } catch {
      toast.error('Failed to create agent');
    }
  };

  const toggleAgentStatus = async (agent: Agent) => {
    const newStatus = agent.status === 'available' ? 'offline' : 'available';
    try {
      const res = await fetch('/api/calling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: agent.id, status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Agent ${newStatus === 'available' ? 'activated' : 'deactivated'}`);
        fetchData();
      }
    } catch {
      toast.error('Failed to update agent status');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const totalCalls = agents.reduce((s, a) => s + a.totalCalls, 0);
  const avgSuccessRate = agents.length > 0
    ? agents.reduce((s, a) => s + a.successRate, 0) / agents.length
    : 0;
  const activeAgents = agents.filter(a => a.status === 'available').length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Active Agents</p>
                <p className="text-2xl font-bold">{activeAgents}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <Phone className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Calls Made</p>
                <p className="text-2xl font-bold">{totalCalls}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <PhoneCall className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Avg Success Rate</p>
                <p className="text-2xl font-bold">{avgSuccessRate.toFixed(1)}%</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                <UserCheck className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Cards */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">AI Calling Agents</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-1" />
              Add Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Calling Agent</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Agent Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Agent name" />
              </div>
              <div className="space-y-2">
                <Label>Speciality</Label>
                <Input value={form.speciality} onChange={(e) => setForm({ ...form, speciality: e.target.value })} placeholder="e.g. Cold calls, Follow-ups" />
              </div>
              <div className="space-y-2">
                <Label>Vapi Agent ID</Label>
                <Input value={form.vapiAgentId} onChange={(e) => setForm({ ...form, vapiAgentId: e.target.value })} placeholder="Vapi.ai agent ID" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateAgent} className="bg-emerald-600 hover:bg-emerald-700">Create Agent</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {agents.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Phone className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No calling agents yet. Create your first AI agent.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agentStats.map((agent) => {
            const config = agentStatusConfig[agent.status] || agentStatusConfig.offline;
            return (
              <Card key={agent.id} className="relative overflow-hidden">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${config.bg}`}>
                        <config.icon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{agent.name}</p>
                        <Badge variant="secondary" className={`${config.bg} ${config.color} text-[10px]`}>
                          {agent.status}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAgentStatus(agent)}
                    >
                      {agent.status === 'available' ? (
                        <Pause className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Play className="h-4 w-4 text-emerald-500" />
                      )}
                    </Button>
                  </div>

                  {agent.speciality && (
                    <p className="text-xs text-muted-foreground">Speciality: {agent.speciality}</p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Total Calls</span>
                      <span className="font-medium">{agent.totalCalls}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span className="font-medium">{agent.successRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={agent.successRate} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Call Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Call Logs</CardTitle>
          <CardDescription>Recent call history</CardDescription>
        </CardHeader>
        <CardContent>
          {callLogs.length > 0 ? (
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {callLogs.map((log) => {
                    const OutcomeIcon = outcomeIcons[log.outcome || ''] || Phone;
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.lead?.name || 'Unknown'}</TableCell>
                        <TableCell>{log.agent?.name || 'Unassigned'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`text-xs ${outcomeColors[log.outcome || ''] || ''}`}>
                            <OutcomeIcon className="h-3 w-3 mr-1" />
                            {log.outcome || 'pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDuration(log.duration)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No call logs yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
