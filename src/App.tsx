import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider, useApp } from "./contexts/AppContext";
<<<<<<< HEAD
import { DeepFetchProvider } from "./components/DeepFetchProvider";
=======
>>>>>>> a397210beb9a30ba0d5df243336fa4bc022922ae
import { Onboarding } from "./components/onboarding/Onboarding";
import Index from "./pages/Index";
import Disciplinas from "./pages/Disciplinas";
import Planejador from "./pages/Planejador";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 30, // 30 minutes
      gcTime: 1000 * 60 * 60, // 1 hour
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { isOnboarded } = useApp();

  if (!isOnboarded) {
    return <Onboarding />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/disciplinas" element={<Disciplinas />} />
        <Route path="/planejador" element={<Planejador />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
<<<<<<< HEAD
      <DeepFetchProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </DeepFetchProvider>
=======
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
>>>>>>> a397210beb9a30ba0d5df243336fa4bc022922ae
    </AppProvider>
  </QueryClientProvider>
);

export default App;
