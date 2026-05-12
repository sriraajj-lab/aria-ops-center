'use client';

import { useState } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar, type PanelType } from '@/components/app-sidebar';
import { DashboardPanel } from '@/components/panels/dashboard-panel';
import { LeadPipelinePanel } from '@/components/panels/lead-pipeline-panel';
import { DealsPanel } from '@/components/panels/deals-panel';
import { CallingAgentPanel } from '@/components/panels/calling-agent-panel';
import { FulfillmentPanel } from '@/components/panels/fulfillment-panel';
import { SettingsPanel } from '@/components/panels/settings-panel';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';

const panelTitles: Record<PanelType, string> = {
  dashboard: 'Dashboard',
  leads: 'Lead Pipeline',
  deals: 'Deals',
  calling: 'Calling Agents',
  fulfillment: 'Fulfillment',
  settings: 'Settings',
};

export default function HomePage() {
  const [activePanel, setActivePanel] = useState<PanelType>('dashboard');

  const renderPanel = () => {
    switch (activePanel) {
      case 'dashboard':
        return <DashboardPanel />;
      case 'leads':
        return <LeadPipelinePanel />;
      case 'deals':
        return <DealsPanel />;
      case 'calling':
        return <CallingAgentPanel />;
      case 'fulfillment':
        return <FulfillmentPanel />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <DashboardPanel />;
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar activePanel={activePanel} onPanelChange={setActivePanel} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h2 className="text-sm font-semibold">{panelTitles[activePanel]}</h2>
        </header>
        <div className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePanel}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                {renderPanel()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
