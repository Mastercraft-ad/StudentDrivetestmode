import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Onboarding from "@/pages/onboarding";
import Notes from "@/pages/notes";
import Tests from "@/pages/tests";
import Subscription from "@/pages/subscription";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/onboarding">
        <Onboarding />
      </ProtectedRoute>
      <ProtectedRoute path="/">
        <Dashboard />
      </ProtectedRoute>
      <ProtectedRoute path="/notes">
        <Notes />
      </ProtectedRoute>
      <ProtectedRoute path="/tests">
        <Tests />
      </ProtectedRoute>
      <ProtectedRoute path="/subscription">
        <Subscription />
      </ProtectedRoute>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
