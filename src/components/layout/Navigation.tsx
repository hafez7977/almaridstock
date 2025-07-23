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
    { id: 'alerts', label: 'Follow-Up', icon: AlertTriangle },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <nav className="bg-card border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 rounded-none border-b-2 transition-all",
                  activeTab === tab.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-transparent hover:border-border hover:bg-muted"
                )}
                onClick={() => onTabChange(tab.id)}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};