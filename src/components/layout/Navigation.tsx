import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  TruckIcon, 
  Building, 
  FileText, 
  BarChart3,
  AlertTriangle
} from "lucide-react";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const tabs = [
    { id: 'stock', label: 'Stock', icon: Package },
    { id: 'incoming', label: 'Incoming', icon: TruckIcon },
    { id: 'ksa', label: 'KSA', icon: Building },
    { id: 'specs-upload', label: 'Specs Upload', icon: FileText },
    { id: 'alerts', label: 'Follow-Up', icon: AlertTriangle },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border h-screen sticky top-0">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Navigation</h2>
        <nav className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 px-3 py-2",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
                onClick={() => onTabChange(tab.id)}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};