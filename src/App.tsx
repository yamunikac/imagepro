import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Navbar from "@/components/Navbar";
import AIChatWidget from "@/components/AIChatWidget";
import AuthPage from "./pages/AuthPage";
import FeaturesPage from "./pages/Home";
import Index from "./pages/Index";
import CompressPage from "./pages/CompressPage";
import ConvertPage from "./pages/ConvertPage";
import CropPage from "./pages/CropPage";
import EnhancePage from "./pages/EnhancePage";
import RotatePage from "./pages/RotatePage";
import BackgroundRemovalPage from "./pages/BackgroundRemovalPage";
import HistoryPage from "./pages/HistoryPage";
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Navbar />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/studio" element={<Index />} />
              <Route path="/compress" element={<CompressPage />} />
              <Route path="/convert" element={<ConvertPage />} />
              <Route path="/crop" element={<CropPage />} />
              <Route path="/enhance" element={<EnhancePage />} />
              <Route path="/rotate" element={<RotatePage />} />
              <Route path="/remove-bg" element={<BackgroundRemovalPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <AIChatWidget />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
