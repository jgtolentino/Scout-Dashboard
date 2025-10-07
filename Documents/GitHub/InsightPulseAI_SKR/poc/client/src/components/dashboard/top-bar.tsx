import { Menu, Calendar, MapPin, Tag, Grid3X3, Download, HelpCircle, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  onToggleSidebar: () => void;
  filters: {
    dateRange: string;
    location: string;
    brand: string;
    category: string;
  };
  onUpdateFilter: (key: string, value: string) => void;
}

export default function TopBar({ onToggleSidebar, filters }: TopBarProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Toggle and Filters */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onToggleSidebar}
            className="p-2 hover:bg-muted rounded"
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          {/* Filter Pills */}
          <div className="flex items-center gap-3">
            <div className="filter-pill active">
              <Calendar className="w-4 h-4" />
              <span>{filters.dateRange}</span>
              <ChevronDown className="w-4 h-4" />
            </div>
            <div className="filter-pill">
              <MapPin className="w-4 h-4" />
              <span>{filters.location}</span>
              <ChevronDown className="w-4 h-4" />
            </div>
            <div className="filter-pill">
              <Tag className="w-4 h-4" />
              <span>{filters.brand}</span>
              <ChevronDown className="w-4 h-4" />
            </div>
            <div className="filter-pill">
              <Grid3X3 className="w-4 h-4" />
              <span>{filters.category}</span>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>
        
        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <Button className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
          <Button variant="ghost" size="sm" className="p-2 hover:bg-muted rounded">
            <HelpCircle className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2 hover:bg-muted rounded">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
