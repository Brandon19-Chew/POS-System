import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Categories from "@/pages/Categories";
import Brands from "@/pages/Brands";
import Customers from "./pages/Customers";
import POS from "./pages/POS";
import Inventory from "./pages/Inventory";
import Promotions from "./pages/Promotions";
import Suppliers from "./pages/Suppliers";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import AuditLog from "./pages/AuditLog";
import Analytics from "./pages/Analytics";
import Forecasting from "./pages/Forecasting";
import DashboardLayout from "@/components/DashboardLayout";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"}>
        {() => (
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/pos"}>
        {() => (
          <DashboardLayout>
            <POS />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/products"}>
        {() => (
          <DashboardLayout>
            <Products />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/categories"}>
        {() => (
          <DashboardLayout>
            <Categories />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/brands"}>
        {() => (
          <DashboardLayout>
            <Brands />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/customers"}>
        {() => (
          <DashboardLayout>
            <Customers />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/inventory"}>
        {() => (
          <DashboardLayout>
            <Inventory />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/customers"}>
        {() => (
          <DashboardLayout>
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold mb-2">Customers</h1>
              <p className="text-muted-foreground">Coming soon...</p>
            </div>
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/promotions"}>
        {() => (
          <DashboardLayout>
            <Promotions />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/suppliers"}>
        {() => (
          <DashboardLayout>
            <Suppliers />
          </DashboardLayout>
        )}
      </Route>
       <Route path="/reports">
        {() => (
          <DashboardLayout>
            <Reports />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/settings">
        {() => (
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/audit">
        {() => (
          <DashboardLayout>
            <AuditLog />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/analytics">
        {() => (
          <DashboardLayout>
            <Analytics />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/forecasting">
        {() => (
          <DashboardLayout>
            <Forecasting />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
