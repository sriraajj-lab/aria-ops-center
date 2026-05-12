'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Save,
  Key,
  Bell,
  Cog,
  Globe,
  Zap,
  RefreshCw,
  CheckCircle2,
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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface EngineStatus {
  lastRun: string | null;
  nextRun: string | null;
  activeAgents: number;
  status: string;
}

export function SettingsPanel() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEngineStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/engine/status');
      const data = await res.json();
      setEngineStatus(data);
    } catch (error) {
      console.error('Failed to fetch engine status:', error);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchEngineStatus();
  }, [fetchSettings, fetchEngineStatus]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast.success('Settings saved successfully');
      } else {
        toast.error('Failed to save settings');
      }
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleRunEngineCycle = async () => {
    try {
      const res = await fetch('/api/cron/engine-cycle');
      const data = await res.json();
      if (data.success) {
        toast.success(`Engine cycle completed: ${data.staleLeads} stale leads, ${data.availableAgents} agents available`);
        fetchEngineStatus();
      } else {
        toast.error('Failed to run engine cycle');
      }
    } catch {
      toast.error('Failed to run engine cycle');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Engine Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-600" />
                Engine Status
              </CardTitle>
              <CardDescription>AI engine cycle information</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRunEngineCycle}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Run Cycle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {engineStatus && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 mt-1">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Running
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Agents</p>
                <p className="text-sm font-semibold mt-1">{engineStatus.activeAgents}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Run</p>
                <p className="text-sm font-semibold mt-1">
                  {engineStatus.lastRun ? new Date(engineStatus.lastRun).toLocaleString() : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Next Run</p>
                <p className="text-sm font-semibold mt-1">
                  {engineStatus.nextRun ? new Date(engineStatus.nextRun).toLocaleString() : 'Not scheduled'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            General Settings
          </CardTitle>
          <CardDescription>Company and application settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              value={settings.company_name || ''}
              onChange={(e) => updateSetting('company_name', e.target.value)}
              placeholder="Your company name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_email">Company Email</Label>
            <Input
              id="company_email"
              type="email"
              value={settings.company_email || ''}
              onChange={(e) => updateSetting('company_email', e.target.value)}
              placeholder="hello@company.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="default_currency">Default Currency</Label>
            <Input
              id="default_currency"
              value={settings.default_currency || 'USD'}
              onChange={(e) => updateSetting('default_currency', e.target.value)}
              placeholder="USD"
            />
          </div>
        </CardContent>
      </Card>

      {/* Integration Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4" />
            Integration Settings
          </CardTitle>
          <CardDescription>API keys and third-party integrations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vapi_api_key">Vapi.ai API Key</Label>
            <Input
              id="vapi_api_key"
              type="password"
              value={settings.vapi_api_key || ''}
              onChange={(e) => updateSetting('vapi_api_key', e.target.value)}
              placeholder="sk-..."
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="razorpay_key_id">Razorpay Key ID</Label>
            <Input
              id="razorpay_key_id"
              value={settings.razorpay_key_id || ''}
              onChange={(e) => updateSetting('razorpay_key_id', e.target.value)}
              placeholder="rzp_live_..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="razorpay_key_secret">Razorpay Key Secret</Label>
            <Input
              id="razorpay_key_secret"
              type="password"
              value={settings.razorpay_key_secret || ''}
              onChange={(e) => updateSetting('razorpay_key_secret', e.target.value)}
              placeholder="Your Razorpay secret"
            />
          </div>
        </CardContent>
      </Card>

      {/* Engine Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cog className="h-4 w-4" />
            Engine Configuration
          </CardTitle>
          <CardDescription>Configure the AI engine behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="engine_cycle_interval">Cycle Interval (minutes)</Label>
            <Input
              id="engine_cycle_interval"
              type="number"
              min={1}
              value={settings.engine_cycle_interval || '60'}
              onChange={(e) => updateSetting('engine_cycle_interval', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stale_lead_hours">Stale Lead Threshold (hours)</Label>
            <Input
              id="stale_lead_hours"
              type="number"
              min={1}
              value={settings.stale_lead_hours || '24'}
              onChange={(e) => updateSetting('stale_lead_hours', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max_calls_per_cycle">Max Calls Per Cycle</Label>
            <Input
              id="max_calls_per_cycle"
              type="number"
              min={1}
              value={settings.max_calls_per_cycle || '10'}
              onChange={(e) => updateSetting('max_calls_per_cycle', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Configure when and how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">New Lead Notifications</p>
              <p className="text-xs text-muted-foreground">Get notified when a new lead is added</p>
            </div>
            <Switch
              checked={settings.notify_new_lead !== 'false'}
              onCheckedChange={(checked) => updateSetting('notify_new_lead', checked ? 'true' : 'false')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Deal Updates</p>
              <p className="text-xs text-muted-foreground">Get notified when deals change status</p>
            </div>
            <Switch
              checked={settings.notify_deal_update !== 'false'}
              onCheckedChange={(checked) => updateSetting('notify_deal_update', checked ? 'true' : 'false')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Call Outcomes</p>
              <p className="text-xs text-muted-foreground">Get notified when AI calls complete</p>
            </div>
            <Switch
              checked={settings.notify_call_outcome !== 'false'}
              onCheckedChange={(checked) => updateSetting('notify_call_outcome', checked ? 'true' : 'false')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Payment Alerts</p>
              <p className="text-xs text-muted-foreground">Get notified about payment events</p>
            </div>
            <Switch
              checked={settings.notify_payment !== 'false'}
              onCheckedChange={(checked) => updateSetting('notify_payment', checked ? 'true' : 'false')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
          <Save className="h-4 w-4 mr-1" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
