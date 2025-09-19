import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Button } from "@/components/ui/button";
import { Bell, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";

interface MainLayoutProps {
  children: ReactNode;
  rightSidebar?: ReactNode;
}

export function MainLayout({ children, rightSidebar }: MainLayoutProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
              <div className="flex items-center justify-end p-4 space-x-4">
                {/* Theme Toggle */}
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="text-muted-foreground hover:text-foreground"
                  data-testid="button-theme-toggle"
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </Button>
                
                {/* Notifications */}
                <Button 
                  variant="ghost"
                  size="icon"
                  className="relative text-muted-foreground hover:text-foreground"
                  data-testid="button-notifications"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
                </Button>
              </div>
            </div>
            
            {/* Page Content */}
            <div className="p-6">
              {children}
            </div>
          </main>

          {/* Right Sidebar */}
          {rightSidebar && (
            <aside className="hidden xl:block w-80 overflow-y-auto p-6 bg-muted/30">
              {rightSidebar}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
