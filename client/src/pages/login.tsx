import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { AuthService } from "@/lib/auth";
import { LoginData, loginSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Hash, Loader2 } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginData) => {
    try {
      setIsLoading(true);
      await AuthService.login(data);
      
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      
      // Force a page refresh to ensure navbar updates
      window.location.href = "/";
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-2 sm:px-4">
      <Card className="w-full max-w-md p-3 sm:p-6">
        <CardHeader className="text-center p-2 sm:p-4">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-primary to-violet-600 rounded-lg flex items-center justify-center">
              <Hash className="text-white h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                placeholder="Enter your email"
                className="mt-1 text-xs sm:text-sm"
              />
              {form.formState.errors.email && (
                <p className="text-xs sm:text-sm text-destructive mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="text-xs sm:text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                {...form.register('password')}
                placeholder="Enter your password"
                className="mt-1 text-xs sm:text-sm"
              />
              {form.formState.errors.password && (
                <p className="text-xs sm:text-sm text-destructive mt-1">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full text-base sm:text-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
