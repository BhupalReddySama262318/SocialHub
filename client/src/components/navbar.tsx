import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { AuthService } from "@/lib/auth";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CreatePostModal } from "./create-post-modal";
import { Hash, Home, User as UserIcon, Plus } from "lucide-react";

export function Navbar() {
  const [location] = useLocation();
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    await AuthService.logout();
    setUser(null);
    window.location.href = '/';
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-violet-600 rounded-lg flex items-center justify-center">
                <Hash className="text-white text-sm" />
              </div>
              <span className="ml-2 text-xl font-bold text-foreground">SocialHub</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-muted-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                <Home className="inline mr-1 h-4 w-4" />
                Home
              </Link>
              {user && (
                <Link href="/profile" className="text-muted-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  <UserIcon className="inline mr-1 h-4 w-4" />
                  Profile
                </Link>
              )}
            </nav>

            {/* Auth Section */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <Button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create Post
                  </Button>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden sm:inline">{user.name}</span>
                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                      Logout
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/login">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link href="/register">
                    <Button>Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <CreatePostModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </>
  );
}
