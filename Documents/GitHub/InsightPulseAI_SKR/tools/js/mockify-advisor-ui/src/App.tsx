import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DataConnectorProvider } from "@/context/DataConnectorContext";
import { RoleProvider } from "@/context/RoleContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Analytics from "./pages/Analytics";
import Advisor from "./pages/Advisor";
import AutoSDR from "./pages/AutoSDR";
import InsightTest from "./pages/InsightTest";
import Settings from "./pages/Settings";
import GptTest from "./pages/GptTest";
import ThemeAudit from "./pages/ThemeAudit";
import LLMPricingTest from "./pages/LLMPricingTest";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <RoleProvider>
      <DataConnectorProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/advisor" element={<Advisor />} />
              <Route path="/autosdr" element={<AutoSDR />} />
              <Route path="/insight-test" element={<InsightTest />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/gpt-test" element={<GptTest />} />
              <Route path="/theme-audit" element={<ThemeAudit />} />
              <Route path="/llm-pricing" element={<LLMPricingTest />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DataConnectorProvider>
    </RoleProvider>
  </QueryClientProvider>
);

export default App;