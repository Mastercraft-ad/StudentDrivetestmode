import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Redirect } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";
import { CourseProgressWidget } from "@/components/dashboard/course-progress-widget";
import { PracticeTestsWidget } from "@/components/dashboard/practice-tests-widget";
import { AiToolsWidget } from "@/components/dashboard/ai-tools-widget";
import { StudyTipsWidget } from "@/components/dashboard/study-tips-widget";
import { AnalyticsSidebar } from "@/components/dashboard/analytics-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { FileText, CheckCircle, Brain } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["/api/profile"],
    queryFn: () => api.getProfile(),
    enabled: !!user,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["/api/activities"],
    queryFn: () => api.getActivities(),
    enabled: !!user,
  });

  // Redirect to onboarding if not completed
  if (user?.role === "student" && profile && !profile.completedOnboarding) {
    return <Redirect to="/onboarding" />;
  }

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case "content_upload":
        return <FileText className="w-4 h-4 text-primary" />;
      case "assessment_completion":
        return <CheckCircle className="w-4 h-4 text-primary" />;
      case "ai_generation":
        return <Brain className="w-4 h-4 text-primary" />;
      default:
        return <FileText className="w-4 h-4 text-primary" />;
    }
  };

  const formatActivityTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  return (
    <MainLayout rightSidebar={<AnalyticsSidebar />}>
      <div className="space-y-6">
        <WelcomeBanner />

        {/* Main Dashboard Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <CalendarWidget />
          <CourseProgressWidget />
          <PracticeTestsWidget />
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AiToolsWidget />
          <StudyTipsWidget />
        </div>

        {/* Recent Activity */}
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            <button 
              className="text-primary text-sm font-medium hover:text-primary/80"
              data-testid="button-view-all-activity"
            >
              View All →
            </button>
          </CardHeader>
          <CardContent className="space-y-3">
            {activities.length > 0 ? (
              activities.slice(0, 5).map((activity) => (
                <div 
                  key={activity.id}
                  className="flex items-center p-3 hover:bg-accent rounded-lg transition-colors"
                  data-testid={`activity-${activity.id}`}
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                    {getActivityIcon(activity.activityType)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-card-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatActivityTime(activity.createdAt)}
                    </p>
                  </div>
                  <div className="text-muted-foreground">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No recent activity</p>
                <p className="text-xs mt-1">Start by uploading notes or taking a quiz!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
