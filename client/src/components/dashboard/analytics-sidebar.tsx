import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  Clock, 
  Trophy, 
  Calendar,
  StickyNote,
  ClipboardCheck,
  Crown,
  HelpCircle,
  Headphones,
  PlayCircle
} from "lucide-react";

export function AnalyticsSidebar() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/analytics"],
    queryFn: () => api.getAnalytics(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Study Analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <Skeleton className="w-24 h-24 rounded-full" />
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const studyStreak = analytics?.studyStreak || 0;
  const learningVelocity = analytics?.learningVelocity || 0;
  const bestScore = analytics?.bestScore || 0;
  const monthlyHours = Math.round((analytics?.totalStudyTime || 0) / 60);

  // Calculate progress ring stroke-dashoffset
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const streakProgress = Math.min(studyStreak / 30, 1); // Max 30 days
  const strokeDashoffset = circumference - (streakProgress * circumference);

  const quickAccessLinks = [
    {
      label: "Course Notes",
      icon: StickyNote,
      href: "/notes",
    },
    {
      label: "Practice Tests",
      icon: ClipboardCheck,
      href: "/tests",
    },
    {
      label: "Study Calendar",
      icon: Calendar,
      href: "/calendar",
    },
    {
      label: "Upgrade Plan",
      icon: Crown,
      href: "/subscription",
    },
  ];

  const helpOptions = [
    {
      label: "FAQ",
      icon: HelpCircle,
      action: "openFAQ",
    },
    {
      label: "Contact Support",
      icon: Headphones,
      action: "contactSupport",
    },
    {
      label: "Video Tutorials",
      icon: PlayCircle,
      action: "openTutorials",
    },
  ];

  const handleQuickAction = (href?: string, action?: string) => {
    if (href) {
      // TODO: Navigate to the specified route
      console.log("Navigate to:", href);
    } else if (action) {
      // TODO: Handle specific actions
      console.log("Execute action:", action);
    }
  };

  return (
    <div className="space-y-6">
      {/* Study Analytics */}
      <Card className="shadow-sm border border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-card-foreground">
            Study Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Circular Progress for Study Streak */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 progress-ring">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="var(--muted)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="var(--primary)"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="progress-ring-fill"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div 
                    className="text-2xl font-bold text-primary"
                    data-testid="text-study-streak"
                  >
                    {studyStreak}
                  </div>
                  <div className="text-xs text-muted-foreground">Day Streak</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Learning Velocity</span>
              <div className="text-right">
                <span 
                  className="text-sm font-semibold text-card-foreground"
                  data-testid="text-learning-velocity"
                >
                  {learningVelocity}h
                </span>
                <span className="text-xs text-muted-foreground">/day</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Best Test Score</span>
              <span 
                className="text-sm font-semibold text-primary"
                data-testid="text-best-score"
              >
                {bestScore}%
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">This Month</span>
              <span 
                className="text-sm font-semibold text-card-foreground"
                data-testid="text-monthly-hours"
              >
                {monthlyHours}h
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Access Links */}
      <Card className="shadow-sm border border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-card-foreground">
            Quick Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {quickAccessLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Button
                key={link.label}
                variant="ghost"
                className="w-full justify-start text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
                onClick={() => handleQuickAction(link.href)}
                data-testid={`quick-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className="mr-3 w-4 h-4" />
                {link.label}
              </Button>
            );
          })}
        </CardContent>
      </Card>

      {/* Help Center Widget */}
      <Card className="shadow-sm border border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-card-foreground">
            Help Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Need assistance? Our support team is here to help you succeed.
          </p>
          <div className="space-y-2">
            {helpOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Button
                  key={option.label}
                  variant="ghost"
                  className="w-full justify-start text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
                  onClick={() => handleQuickAction(undefined, option.action)}
                  data-testid={`help-option-${option.action}`}
                >
                  <Icon className="mr-3 w-4 h-4" />
                  {option.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
