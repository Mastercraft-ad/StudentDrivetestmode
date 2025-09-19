import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  GraduationCap, 
  Home, 
  StickyNote, 
  Brain, 
  ClipboardCheck, 
  Calendar, 
  Crown, 
  Settings,
  LogOut
} from "lucide-react";
import { Link, useLocation } from "wouter";

export function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const navigationItems = [
    { 
      path: "/", 
      label: "Dashboard", 
      icon: Home,
      badge: null
    },
    { 
      path: "/notes", 
      label: "Notes", 
      icon: StickyNote,
      badge: "24"
    },
    { 
      path: "/mindmaps", 
      label: "Mind Maps", 
      icon: Brain,
      badge: null
    },
    { 
      path: "/tests", 
      label: "Tests", 
      icon: ClipboardCheck,
      badge: "3"
    },
    { 
      path: "/calendar", 
      label: "Calendar", 
      icon: Calendar,
      badge: null
    },
    { 
      path: "/subscription", 
      label: "Subscription", 
      icon: Crown,
      badge: null
    },
    { 
      path: "/settings", 
      label: "Settings", 
      icon: Settings,
      badge: null
    },
  ];

  const getUserInitials = (username: string) => {
    return username
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-card border-r border-border">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="text-primary-foreground text-lg" />
            </div>
            <h1 className="ml-3 text-xl font-bold text-foreground">StudentDrive</h1>
          </div>

          {/* Navigation */}
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path || 
                (item.path === "/" && location === "/");
              
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start transition-all duration-200 hover:translate-x-1 ${
                      isActive 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className="mr-3 w-5 h-5" />
                    {item.label}
                    {item.badge && (
                      <Badge 
                        variant={isActive ? "secondary" : "default"}
                        className="ml-auto"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* User Profile Summary */}
          <div className="flex-shrink-0 px-4 pb-4">
            <div className="bg-muted rounded-lg p-4 mt-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold text-sm">
                    {user ? getUserInitials(user.username) : "??"}
                  </span>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-foreground" data-testid="text-username">
                    {user?.username || "Unknown User"}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize" data-testid="text-user-role">
                    {user?.role || "Student"}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {user?.subscriptionTier === "premium" ? "Premium Plan" : "Free Plan"}
                  </span>
                  <span className={`font-medium ${
                    user?.subscriptionTier === "premium" ? "text-primary" : "text-muted-foreground"
                  }`}>
                    {user?.subscriptionTier === "premium" ? "Active" : "Basic"}
                  </span>
                </div>
                <div className="w-full bg-background rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-primary h-1.5 rounded-full" 
                    style={{ 
                      width: user?.subscriptionTier === "premium" ? "100%" : "25%" 
                    }}
                  />
                </div>
              </div>
              
              {/* Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3 text-muted-foreground hover:text-foreground"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
