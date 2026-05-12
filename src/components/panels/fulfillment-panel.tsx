'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  ArrowRight,
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
import { Progress } from '@/components/ui/progress';

interface FulfillmentAgent {
  id: string;
  name: string;
  type: string;
  status: string;
  speciality: string | null;
  totalCalls: number;
  successRate: number;
}

interface DeliveryItem {
  id: string;
  title: string;
  value: number;
  status: string;
  updatedAt: string;
  lead: { name: string; company: string | null };
  payments: Array<{ id: string; amount: number; status: string }>;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const agentStatusConfig: Record<string, { color: string; bg: string; label: string }> = {
  available: { color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Available' },
  busy: { color: 'text-amber-600', bg: 'bg-amber-50', label: 'Working' },
  offline: { color: 'text-zinc-500', bg: 'bg-zinc-50', label: 'Offline' },
};

const progressStages = [
  { label: 'Onboarding', progress: 15 },
  { label: 'Setup', progress: 35 },
  { label: 'Development', progress: 60 },
  { label: 'Testing', progress: 80 },
  { label: 'Delivery', progress: 100 },
];

function getDeliveryStage(updatedAt: string): { stage: string; progress: number } {
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const idx = Math.min(Math.floor(daysSinceUpdate / 3), progressStages.length - 1);
  return progressStages[idx];
}

export function FulfillmentPanel() {
  const [agents, setAgents] = useState<FulfillmentAgent[]>([]);
  const [deliveryQueue, setDeliveryQueue] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/fulfillment');
      const data = await res.json();
      setAgents(data.agents || []);
      setDeliveryQueue(data.deliveryQueue || []);
    } catch (error) {
      console.error('Failed to fetch fulfillment data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const totalValue = deliveryQueue.reduce((s, d) => s + d.value, 0);
  const activeAgents = agents.filter(a => a.status !== 'offline').length;
  const totalAgents = agents.length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Active Deliveries</p>
                <p className="text-2xl font-bold">{deliveryQueue.length}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <Package className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Delivery Value</p>
                <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Fulfillment Agents</p>
                <p className="text-2xl font-bold">{activeAgents}/{totalAgents}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                <User className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fulfillment Agents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fulfillment Agents</CardTitle>
          <CardDescription>Agent availability and assignments</CardDescription>
        </CardHeader>
        <CardContent>
          {agents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => {
                const config = agentStatusConfig[agent.status] || agentStatusConfig.offline;
                return (
                  <div key={agent.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${config.bg}`}>
                      <User className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{agent.name}</p>
                      {agent.speciality && (
                        <p className="text-xs text-muted-foreground truncate">{agent.speciality}</p>
                      )}
                    </div>
                    <Badge variant="secondary" className={`${config.bg} ${config.color} text-[10px]`}>
                      {config.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No fulfillment agents yet. Add agents from the Calling Agent panel.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Delivery Queue</CardTitle>
          <CardDescription>Closed-won deals being fulfilled</CardDescription>
        </CardHeader>
        <CardContent>
          {deliveryQueue.length > 0 ? (
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {deliveryQueue.map((deal) => {
                const stage = getDeliveryStage(deal.updatedAt);
                const completedPayments = deal.payments.filter(p => p.status === 'completed');
                const totalPayments = deal.payments.length;
                return (
                  <div key={deal.id} className="p-4 rounded-lg border space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{deal.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {deal.lead?.name} {deal.lead?.company ? `· ${deal.lead.company}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{formatCurrency(deal.value)}</p>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[10px]">
                          Closed Won
                        </Badge>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Stage: {stage.stage}</span>
                        <span className="font-medium">{stage.progress}%</span>
                      </div>
                      <Progress value={stage.progress} className="h-2" />
                    </div>

                    {/* Payment Status */}
                    {totalPayments > 0 && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{completedPayments.length}/{totalPayments} payments received</span>
                      </div>
                    )}

                    {/* Timeline */}
                    <div className="flex items-center gap-2 pt-1">
                      {progressStages.map((s, i) => (
                        <div key={s.label} className="flex items-center">
                          <div className={`h-2 w-2 rounded-full ${stage.progress >= s.progress ? 'bg-emerald-500' : 'bg-zinc-200'}`} />
                          {i < progressStages.length - 1 && (
                            <div className={`w-6 h-0.5 ${stage.progress >= progressStages[i + 1]?.progress ? 'bg-emerald-500' : 'bg-zinc-200'}`} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No active deliveries</p>
              <p className="text-xs text-muted-foreground mt-1">Closed-won deals will appear here for fulfillment</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
