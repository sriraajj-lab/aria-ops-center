import { db } from './db';
import { startOfMonth, endOfMonth, subDays, format, startOfDay } from 'date-fns';

// Dashboard queries
export async function getDashboardStats() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const thirtyDaysAgo = subDays(now, 30);

  const [
    totalLeads,
    newLeadsToday,
    totalDeals,
    totalCalls,
    contactAttemptsToday,
    allLeads,
    allDeals,
    recentCallLogs,
    allPayments,
    allCallLogs,
  ] = await Promise.all([
    db.lead.count(),
    db.lead.count({ where: { createdAt: { gte: todayStart } } }),
    db.deal.count(),
    db.callLog.count(),
    db.contactAttempt.count({ where: { createdAt: { gte: todayStart } } }),
    db.lead.findMany({ select: { status: true, estimatedValue: true, createdAt: true } }),
    db.deal.findMany({
      include: { lead: { select: { name: true } }, payments: true },
    }),
    db.callLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { lead: { select: { name: true } }, agent: { select: { name: true } } },
    }),
    db.payment.findMany({ include: { deal: { include: { lead: true } } } }),
    db.callLog.findMany({ select: { createdAt: true } }),
  ]);

  // Revenue from completed payments
  const totalRevenue = allPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  // Monthly revenue
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const monthlyRevenue = allPayments
    .filter(p => p.status === 'completed' && p.paidAt && new Date(p.paidAt) >= monthStart && new Date(p.paidAt) <= monthEnd)
    .reduce((sum, p) => sum + p.amount, 0);

  // Revenue by day (last 30 days)
  const revenueByDay = [];
  for (let i = 29; i >= 0; i--) {
    const day = subDays(now, i);
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayRevenue = allPayments
      .filter(p => p.status === 'completed' && p.paidAt && format(new Date(p.paidAt), 'yyyy-MM-dd') === dayStr)
      .reduce((sum, p) => sum + p.amount, 0);
    revenueByDay.push({ date: dayStr, revenue: dayRevenue });
  }

  // Lead engine stats
  const leadEngineStats: Record<string, number> = {};
  allLeads.forEach(l => {
    leadEngineStats[l.status] = (leadEngineStats[l.status] || 0) + 1;
  });

  // Deals in pipeline
  const dealsInPipeline = allDeals.filter(d => d.status === 'pipeline' || d.status === 'negotiation').length;

  // Monthly revenue breakdown
  const monthlyRevenueBreakdown: Record<string, number> = {};
  allDeals.forEach(d => {
    if (!monthlyRevenueBreakdown[d.status]) monthlyRevenueBreakdown[d.status] = 0;
    monthlyRevenueBreakdown[d.status] += d.value;
  });

  // Revenue forecast (weighted pipeline)
  const revenueForecast = allDeals
    .filter(d => d.status === 'pipeline' || d.status === 'negotiation')
    .reduce((sum, d) => sum + (d.value * d.probability / 100), 0);

  // Call stats
  const callsByDay: { date: string; calls: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = subDays(now, i);
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayCalls = allCallLogs.filter(c => format(new Date(c.createdAt), 'yyyy-MM-dd') === dayStr).length;
    callsByDay.push({ date: dayStr, calls: dayCalls });
  }

  return {
    totalLeads,
    newLeadsToday,
    leadsAddedToday: newLeadsToday,
    totalRevenue,
    monthlyRevenue,
    revenueByDay,
    totalDeals,
    dealsInPipeline,
    totalCalls,
    recentCallLogs,
    contactAttemptsToday,
    leadEngineStats,
    monthlyRevenueBreakdown,
    revenueForecast,
    callsByDay,
  };
}

// Lead queries
export async function getLeads(filters?: { status?: string; source?: string; search?: string }) {
  const where: Record<string, unknown> = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.source) where.source = filters.source;
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { email: { contains: filters.search } },
      { company: { contains: filters.search } },
    ];
  }

  return db.lead.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      deals: true,
      callLogs: { take: 3, orderBy: { createdAt: 'desc' } },
      contactAttempts: { take: 3, orderBy: { createdAt: 'desc' } },
    },
  });
}

export async function createLead(data: {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  status?: string;
  score?: number;
  estimatedValue?: number;
  notes?: string;
}) {
  return db.lead.create({ data });
}

export async function updateLead(id: string, data: Record<string, unknown>) {
  return db.lead.update({ where: { id }, data });
}

// Deal queries
export async function getDeals() {
  const deals = await db.deal.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      lead: { select: { name: true, company: true } },
      payments: true,
    },
  });

  const monthlyRevenueBreakdown: Record<string, number> = {};
  deals.forEach(d => {
    if (!monthlyRevenueBreakdown[d.status]) monthlyRevenueBreakdown[d.status] = 0;
    monthlyRevenueBreakdown[d.status] += d.value;
  });

  const upcomingPayments = await db.payment.findMany({
    where: { status: 'pending', dueDate: { not: null } },
    orderBy: { dueDate: 'asc' },
    take: 10,
    include: { deal: { include: { lead: { select: { name: true } } } } },
  });

  const revenueForecast = deals
    .filter(d => d.status === 'pipeline' || d.status === 'negotiation')
    .reduce((sum, d) => sum + (d.value * d.probability / 100), 0);

  return { deals, monthlyRevenueBreakdown, upcomingPayments, revenueForecast };
}

export async function createDeal(data: {
  title: string;
  value: number;
  leadId: string;
  status?: string;
  probability?: number;
  expectedClose?: string;
}) {
  return db.deal.create({ data });
}

// Calling / Agent queries
export async function getCallingData() {
  const agents = await db.agent.findMany({
    where: { type: 'calling' },
    orderBy: { createdAt: 'desc' },
  });

  const callLogs = await db.callLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      lead: { select: { name: true } },
      agent: { select: { name: true } },
    },
  });

  const agentStats = agents.map(a => {
    const agentCalls = callLogs.filter(c => c.agentId === a.id);
    const successfulCalls = agentCalls.filter(c =>
      c.outcome === 'interested' || c.outcome === 'qualified' || c.outcome === 'callback'
    );
    return {
      ...a,
      recentCalls: agentCalls.length,
      successRate: agentCalls.length > 0
        ? (successfulCalls.length / agentCalls.length) * 100
        : a.successRate,
    };
  });

  return { agents, callLogs, agentStats };
}

export async function createAgent(data: {
  name: string;
  type?: string;
  status?: string;
  vapiAgentId?: string;
  speciality?: string;
}) {
  return db.agent.create({ data });
}

export async function updateAgent(id: string, data: Record<string, unknown>) {
  return db.agent.update({ where: { id }, data });
}

// Fulfillment queries
export async function getFulfillmentData() {
  const fulfillmentAgents = await db.agent.findMany({
    where: { type: 'fulfillment' },
    orderBy: { createdAt: 'desc' },
  });

  const deliveryQueue = await db.deal.findMany({
    where: { status: 'closed-won' },
    orderBy: { updatedAt: 'desc' },
    include: {
      lead: { select: { name: true, company: true } },
      payments: true,
    },
  });

  return { agents: fulfillmentAgents, deliveryQueue };
}

// Settings queries
export async function getSettings() {
  return db.setting.findMany();
}

export async function upsertSetting(key: string, value: string) {
  return db.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function getSetting(key: string) {
  const setting = await db.setting.findUnique({ where: { key } });
  return setting?.value;
}

// Payment queries
export async function createPayment(data: {
  dealId: string;
  amount: number;
  status?: string;
  razorpayOrderId?: string;
  dueDate?: string;
}) {
  return db.payment.create({ data });
}

export async function updatePayment(id: string, data: Record<string, unknown>) {
  return db.payment.update({ where: { id }, data });
}

// Call log queries
export async function createCallLog(data: {
  leadId: string;
  agentId?: string;
  outcome?: string;
  duration?: number;
  recording?: string;
  transcript?: string;
  summary?: string;
}) {
  return db.callLog.create({ data });
}

// Contact attempt queries
export async function createContactAttempt(data: {
  leadId: string;
  method?: string;
  status?: string;
  notes?: string;
  scheduledAt?: string;
}) {
  return db.contactAttempt.create({ data });
}
