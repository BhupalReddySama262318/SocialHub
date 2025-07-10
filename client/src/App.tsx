import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/navbar";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";
import React, { useState } from "react";

function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<Error | null>(null);
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-destructive">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <pre className="mb-4 text-sm max-w-xl whitespace-pre-wrap">{error.message}</pre>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded" onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }
  return (
    <ErrorCatcher onError={setError}>{children}</ErrorCatcher>
  );
}

class ErrorCatcher extends React.Component<{ onError: (e: Error) => void, children: React.ReactNode }> {
  componentDidCatch(error: Error) {
    this.props.onError(error);
  }
  render() {
    return this.props.children;
  }
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <div className="min-h-screen bg-background">
            <Navbar />
            <Router />
          </div>
          <Toaster />
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
