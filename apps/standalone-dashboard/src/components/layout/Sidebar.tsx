import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps {
  menuItems: MenuItem[];
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function Sidebar({ menuItems, currentView, onViewChange }: SidebarProps) {
  return (
    <div className="w-64 bg-dashboard-900 text-white flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Analytics Hub</h1>
        <p className="text-dashboard-300 text-sm mt-1">Standalone Dashboard</p>
      </div>
      
      <nav className="flex-1 px-4 pb-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2
                transition-all duration-200
                ${isActive 
                  ? 'bg-dashboard-700 text-white' 
                  : 'text-dashboard-300 hover:bg-dashboard-800 hover:text-white'
                }
              `}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-dashboard-800">
        <p className="text-xs text-dashboard-400 text-center">
          Inspired by Superset & Tableau
        </p>
      </div>
    </div>
  );
}