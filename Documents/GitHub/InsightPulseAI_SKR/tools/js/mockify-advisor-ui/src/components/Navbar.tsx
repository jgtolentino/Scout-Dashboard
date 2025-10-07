
import React from "react";
import { Search, Bell, Settings, HelpCircle, User, Menu, Brain, BarChart3, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <header className="sticky top-0 w-full bg-gradient-to-r from-azure-blue to-blue-700 text-white z-50 shadow-elevation-1">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center space-x-4">
          <button className="p-1 rounded-md hover:bg-white/10 transition-colors">
            <Menu size={20} />
          </button>
          <div className="text-lg font-medium flex items-center gap-2">
            <Brain size={20} className="text-white" />
            <span>TBWA Project Scout AI</span>
          </div>
        </div>

        <div className="relative flex-1 max-w-2xl mx-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-white/70" />
            </div>
            <input
              type="text"
              placeholder="Search insights, brands, and analytics..."
              className="w-full bg-white/10 border border-white/20 rounded-md py-1.5 pl-10 pr-4 text-sm focus:bg-white/20 transition-colors duration-200 placeholder:text-white/70"
            />
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors">
            <Bell size={18} />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors">
            <Settings size={18} />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors">
            <HelpCircle size={18} />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors">
            <User size={18} />
          </button>
        </div>
      </div>
      
      <div className="bg-white text-azure-blue h-10 shadow-sm">
        <div className="container h-full mx-auto px-4">
          <div className="flex items-center h-full space-x-4">
            <Link to="/" className="text-sm hover:text-azure-blueDark">Dashboard</Link>
            <Link to="/advisor" className="text-sm hover:text-azure-blueDark">Advisor</Link>
            <Link to="/gpt-test" className="text-sm hover:text-azure-blueDark">GPT Actions</Link>
            <Link to="/llm-pricing" className="text-sm hover:text-azure-blueDark flex items-center">
              <DollarSign className="h-3 w-3 mr-1" />
              LLM Pricing
            </Link>
            <Link to="/theme-audit" className="text-sm hover:text-azure-blueDark">Theme</Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
