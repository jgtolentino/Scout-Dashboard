import { BarChart3, LayoutDashboard, TrendingUp, Package, Brain, MapPin } from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: TrendingUp, label: "Transaction Trends", active: false },
    { icon: Package, label: "Product Mix", active: false },
    { icon: Brain, label: "AI Insights", active: false },
    { icon: MapPin, label: "Geospatial", active: false },
  ];

  return (
    <div className={`${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out`}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-foreground">Client360</span>
          )}
        </div>
      </div>
      
      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item, index) => (
            <li key={index}>
              <a 
                href="#" 
                className={`nav-item ${item.active ? 'active' : 'text-foreground hover:bg-muted'}`}
              >
                <item.icon className="w-5 h-5" />
                {!collapsed && (
                  <span className="nav-text">{item.label}</span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
