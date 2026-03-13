import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AIChatWidget from "@/components/AIChatWidget";
import CloudButton from "@/components/CloudButton";
import Home from "./pages/Home";
import FeaturesPage from "./pages/FeaturesPage";
import HistoryPage from "./pages/HistoryPage";
import Index from "./pages/Index";
import CompressPage from "./pages/CompressPage";
import ConvertPage from "./pages/ConvertPage";
import CropPage from "./pages/CropPage";
import EnhancePage from "./pages/EnhancePage";
import RotatePage from "./pages/RotatePage";
import BackgroundRemovalPage from "./pages/BackgroundRemovalPage";
import AdjustPage from "./pages/AdjustPage";
import CreativeEditPage from "./pages/CreativeEditPage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/" element={<Home />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/studio" element={<Index />} />
              <Route path="/compress" element={<CompressPage />} />
              <Route path="/convert" element={<ConvertPage />} />
              <Route path="/crop" element={<CropPage />} />
              <Route path="/enhance" element={<EnhancePage />} />
              <Route path="/rotate" element={<RotatePage />} />
              <Route path="/remove-bg" element={<BackgroundRemovalPage />} />
              <Route path="/adjust" element={<AdjustPage />} />
              <Route path="/creative-edit" element={<CreativeEditPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <AIChatWidget />
            <CloudButton />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
