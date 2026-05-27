import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout";
import { DashboardPage } from "@/pages/dashboard";
import { CustomersPage, CustomerDetailPage } from "@/pages/customers";
import { RequestsPage, RequestDetailPage, KanbanPage } from "@/pages/requests";
import { ContractsPage, ContractDetailPage, ContractEditor } from "@/pages/contracts";
import { EmployeesPage } from "@/pages/employees";
import { EntitiesPage } from "@/pages/entities";
import { CalculatorPage } from "@/pages/calculator";
import { LoginPage } from "@/pages/auth";
import { useSession } from "@/lib/auth-client";
import { PermissionsProvider } from "@/lib/permissions";
import NotFound from "./pages/NotFound";
import { AnimatePresence, motion } from "framer-motion";

// Import i18n configuration
import "@/i18n";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds — don't refetch if data is fresh
      gcTime: 5 * 60 * 1000, // keep unused data in cache for 5 minutes
      retry: 1,
      refetchOnWindowFocus: false, // don't refetch when switching tabs
    },
  },
});

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -20,
  },
};

const pageTransition = {
  type: "tween" as const,
  ease: "anticipate" as const,
  duration: 0.4,
};

// Animated page wrapper component
function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}

function AuthGuard() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center bg-gradient-mesh">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-2xl shadow-primary/30"
        >
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-primary-foreground font-bold text-xl"
          >
            SS
          </motion.span>
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <PermissionsProvider>
      <MainLayout>
        <Outlet />
      </MainLayout>
    </PermissionsProvider>
  );
}

// Animated routes wrapper
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/login"
          element={
            <AnimatedPage>
              <LoginPage />
            </AnimatedPage>
          }
        />
        <Route element={<AuthGuard />}>
          <Route
            path="/"
            element={
              <AnimatedPage>
                <DashboardPage />
              </AnimatedPage>
            }
          />
          <Route
            path="/customers"
            element={
              <AnimatedPage>
                <CustomersPage />
              </AnimatedPage>
            }
          />
          <Route
            path="/customers/:id"
            element={
              <AnimatedPage>
                <CustomerDetailPage />
              </AnimatedPage>
            }
          />
          <Route
            path="/requests"
            element={
              <AnimatedPage>
                <RequestsPage />
              </AnimatedPage>
            }
          />
          <Route
            path="/requests/kanban"
            element={
              <AnimatedPage>
                <KanbanPage />
              </AnimatedPage>
            }
          />
          <Route
            path="/requests/:id"
            element={
              <AnimatedPage>
                <RequestDetailPage />
              </AnimatedPage>
            }
          />
          <Route
            path="/contracts"
            element={
              <AnimatedPage>
                <ContractsPage />
              </AnimatedPage>
            }
          />
          <Route
            path="/contracts/create-brokerage"
            element={
              <AnimatedPage>
                <ContractEditor />
              </AnimatedPage>
            }
          />
          <Route
            path="/contracts/:id"
            element={
              <AnimatedPage>
                <ContractDetailPage />
              </AnimatedPage>
            }
          />
          <Route
            path="/employees"
            element={
              <AnimatedPage>
                <EmployeesPage />
              </AnimatedPage>
            }
          />
          <Route
            path="/entities"
            element={
              <AnimatedPage>
                <EntitiesPage />
              </AnimatedPage>
            }
          />
          <Route
            path="/calculator"
            element={
              <AnimatedPage>
                <CalculatorPage />
              </AnimatedPage>
            }
          />
        </Route>
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route
          path="*"
          element={
            <AnimatedPage>
              <NotFound />
            </AnimatedPage>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
