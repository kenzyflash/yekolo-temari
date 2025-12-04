import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { CsrfProvider } from "@/hooks/useCsrfToken";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoadingSpinner from "@/components/LoadingSpinner";
import IdleTimeoutWarning from "@/components/IdleTimeoutWarning";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Events = lazy(() => import("./pages/Events"));
const Projects = lazy(() => import("./pages/Projects"));
const Join = lazy(() => import("./pages/Join"));
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Configure query client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Page loading fallback
const PageLoader = () => (
  <div className="min-h-screen bg-brand-dark flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

// Auth redirect component
const AuthRedirect = () => {
  const { user, loading } = useAuth();
  const { isAdmin, loading: rolesLoading } = useUserRoles();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !rolesLoading && user) {
      if (isAdmin()) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, loading, rolesLoading, isAdmin, navigate]);

  if (loading || rolesLoading) {
    return <PageLoader />;
  }

  return <Navigate to="/auth" replace />;
};

// Idle timeout wrapper component
const IdleTimeoutWrapper = () => {
  const { showTimeoutWarning, timeoutRemainingTime, resetIdleTimer, handleTimeoutLogout } = useAuth();
  
  return (
    <IdleTimeoutWarning
      isOpen={showTimeoutWarning}
      remainingTime={timeoutRemainingTime}
      onStayLoggedIn={resetIdleTimer}
      onLogout={handleTimeoutLogout}
    />
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <CsrfProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <IdleTimeoutWrapper />
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/blog/:id" element={<BlogPost />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/join" element={<Join />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route 
                      path="/admin" 
                      element={
                        <ProtectedRoute requireAdmin>
                          <Admin />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/dashboard" 
                      element={
                        <ProtectedRoute>
                          <UserDashboard />
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="/auth-redirect" element={<AuthRedirect />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </CsrfProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
