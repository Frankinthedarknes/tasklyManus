import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Feed from "./pages/Feed";
import FeedTinder from "./pages/FeedTinder";
import FeedTinderWithFilters from "./pages/FeedTinderWithFilters";
import FeedTinderFinal from "./pages/FeedTinderFinal";
import Profile from "./pages/Profile";
import Publish from "./pages/Publish";
import Chat from "./pages/Chat";
import Activity from "./pages/Activity";
import AdminDashboard from "./pages/AdminDashboard";
import { useAuth } from "./_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component }: { component: any }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="animate-spin w-12 h-12 text-blue-500" />
      </div>
    );
  }

  if (!user) {
    window.location.href = "/";
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/app/feed"}>
        {() => <ProtectedRoute component={FeedTinderFinal} />}
      </Route>
      <Route path={"\app/profile"}>
        {() => <ProtectedRoute component={Profile} />}
      </Route>
      <Route path={"\app/publish"}>
        {() => <ProtectedRoute component={Publish} />}
      </Route>
      <Route path={"\app/chat"}>
        {() => <ProtectedRoute component={Chat} />}
      </Route>
      <Route path={"\app/activity"}>
        {() => <ProtectedRoute component={Activity} />}
      </Route>
      <Route path={"\admin"}>
        {() => <ProtectedRoute component={AdminDashboard} />}
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
