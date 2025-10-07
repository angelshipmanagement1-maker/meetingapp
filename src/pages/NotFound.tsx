import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden gradient-dark">
      {/* Animated Background */}
      <div className="absolute inset-0 gradient-mesh opacity-20 animate-pulse" />
      
      <div className="relative z-10 text-center animate-scale-in">
        <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full glass-strong shadow-elevated animate-bounce-in">
          <AlertCircle className="h-12 w-12 text-destructive animate-pulse" />
        </div>
        <h1 className="mb-4 text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-slide-down">404</h1>
        <p className="mb-8 text-xl text-foreground/90 animate-fade-in">Oops! Page not found</p>
        <p className="mb-8 text-sm text-muted-foreground animate-fade-in stagger-1">
          The page <code className="rounded bg-secondary px-2 py-1 font-mono text-foreground border border-border">{location.pathname}</code> doesn't exist.
        </p>
        <Button asChild variant="hero" size="lg" className="hover-lift animate-slide-up stagger-2">
          <Link to="/">
            <Home className="mr-2 h-5 w-5" />
            Return to Home
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;