import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api, type LearningPath } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isAfter, isBefore, addDays } from "date-fns";

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  type: "urgent" | "due" | "upcoming";
  source: "assessment" | "learning_path" | "study_session";
}

const formatEventTime = (date: Date): string => {
  const now = new Date();
  const tomorrow = addDays(now, 1);
  const diffInDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return `Today, ${format(date, 'h:mm a')}`;
  } else if (diffInDays === 1) {
    return `Tomorrow, ${format(date, 'h:mm a')}`;
  } else if (diffInDays < 7) {
    return format(date, 'EEEE, h:mm a');
  } else {
    return format(date, 'MMM d, h:mm a');
  }
};

const determineEventType = (date: Date): "urgent" | "due" | "upcoming" => {
  const now = new Date();
  const hoursUntil = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntil < 24) return "urgent";
  if (hoursUntil < 72) return "due";
  return "upcoming";
};

export function CalendarWidget() {
  const { data: learningPaths = [], isLoading: loadingPaths } = useQuery({
    queryKey: ["/api/learning-paths"],
    queryFn: () => api.getUserLearningPaths(),
  });

  const { data: assessments = [], isLoading: loadingAssessments } = useQuery({
    queryKey: ["/api/assessments"],
    queryFn: () => api.getAssessments(),
  });

  const isLoading = loadingPaths || loadingAssessments;

  // Generate calendar events from real data
  const calendarEvents: CalendarEvent[] = [
    // Learning path milestones
    ...learningPaths
      .filter((path: LearningPath) => path.targetDate && isAfter(new Date(path.targetDate), new Date()))
      .map((path: LearningPath) => ({
        id: `path-${path.id}`,
        title: path.title,
        time: formatEventTime(new Date(path.targetDate!)),
        type: determineEventType(new Date(path.targetDate!)),
        source: "learning_path" as const
      })),
    
    // Assessment deadlines (if they have timeLimit, assume they're scheduled)
    ...assessments
      .filter(assessment => assessment.timeLimit)
      .slice(0, 3) // Limit to recent assessments
      .map(assessment => {
        // Create a mock due date based on creation + reasonable study time
        const dueDate = addDays(new Date(assessment.createdAt), 7);
        return {
          id: `assessment-${assessment.id}`,
          title: `${assessment.title} - Practice`,
          time: formatEventTime(dueDate),
          type: determineEventType(dueDate),
          source: "assessment" as const
        };
      })
  ].sort((a, b) => {
    // Sort by urgency: urgent -> due -> upcoming
    const typeOrder: Record<CalendarEvent['type'], number> = { urgent: 0, due: 1, upcoming: 2 };
    return typeOrder[a.type] - typeOrder[b.type];
  }).slice(0, 4); // Show max 4 events

  if (isLoading) {
    return (
      <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Academic Calendar</CardTitle>
          <Calendar className="text-primary h-5 w-5" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center p-3 bg-accent rounded-lg">
              <Skeleton className="w-3 h-3 rounded-full mr-3" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  const getEventBadgeVariant = (type: CalendarEvent['type']) => {
    switch (type) {
      case "urgent":
        return "destructive";
      case "due":
        return "default";
      case "upcoming":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getEventBadgeText = (type: CalendarEvent['type']) => {
    switch (type) {
      case "urgent":
        return "Urgent";
      case "due":
        return "Due";
      case "upcoming":
        return "Upcoming";
      default:
        return "Event";
    }
  };

  const handleViewFullCalendar = () => {
    // Navigate to a calendar or schedule page (to be implemented)
    window.location.href = "/calendar";
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Academic Calendar</CardTitle>
        <Calendar className="text-primary h-5 w-5" />
      </CardHeader>
      <CardContent className="space-y-3">
        {calendarEvents.length > 0 ? calendarEvents.map((event) => (
          <div 
            key={event.id}
            className="flex items-center p-3 bg-accent rounded-lg"
            data-testid={`calendar-event-${event.id}`}
          >
            <div className="w-3 h-3 bg-primary rounded-full mr-3 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-accent-foreground truncate">
                {event.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {event.time}
              </p>
            </div>
            <Badge 
              variant={getEventBadgeVariant(event.type)}
              className="text-xs flex-shrink-0"
            >
              {getEventBadgeText(event.type)}
            </Badge>
          </div>
        )) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No upcoming events</p>
            <p className="text-xs mt-1">Create learning paths or practice tests to see your schedule!</p>
          </div>
        )}
        
        <Button 
          variant="ghost"
          className="w-full text-primary text-sm font-medium hover:text-primary/80 mt-4"
          onClick={handleViewFullCalendar}
          data-testid="button-view-full-calendar"
        >
          View Full Calendar →
        </Button>
      </CardContent>
    </Card>
  );
}
