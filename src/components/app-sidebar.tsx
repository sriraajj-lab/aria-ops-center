'use client';

import {
  LayoutDashboard,
  Users,
  DollarSign,
  Phone,
  Package,
  Settings,
  Zap,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';

export type PanelType = 'dashboard' | 'leads' | 'deals' | 'calling' | 'fulfillment' | 'settings';

const navItems = [
  { id: 'dashboard' as PanelType, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'leads' as PanelType, label: 'Lead Pipeline', icon: Users },
  { id: 'deals' as PanelType, label: 'Deals', icon: DollarSign },
  { id: 'calling' as PanelType, label: 'Calling Agent', icon: Phone },
  { id: 'fulfillment' as PanelType, label: 'Fulfillment', icon: Package },
  { id: 'settings' as PanelType, label: 'Settings', icon: Settings },
];

interface AppSidebarProps {
  activePanel: PanelType;
  onPanelChange: (panel: PanelType) => void;
}

export function AppSidebar({ activePanel, onPanelChange }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-4">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shrink-0">
            <Zap className="h-4 w-4" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h1 className="text-lg font-bold tracking-tight text-foreground">Aria</h1>
            <p className="text-[10px] text-muted-foreground -mt-1">AI Ops Center</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activePanel === item.id}
                    onClick={() => onPanelChange(item.id)}
                    tooltip={item.label}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-4 py-3">
        <div className="group-data-[collapsible=icon]:hidden">
          <p className="text-xs text-muted-foreground">Aria AI Ops Center v1.0</p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
