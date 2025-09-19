import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  type: "urgent" | "due" | "upcoming";
}

// Mock data for now - in real app this would come from API
const mockEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Data Structures Exam",
    time: "Tomorrow, 2:00 PM",
    type: "urgent"
  },
  {
    id: "2", 
    title: "Assignment Due",
    time: "Friday, 11:59 PM",
    type: "due"
  },
  {
    id: "3",
    title: "Study Group Meeting",
    time: "Next Monday, 3:00 PM", 
    type: "upcoming"
  }
];

export function CalendarWidget() {
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
    // TODO: Navigate to calendar page
    console.log("Navigate to full calendar");
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Academic Calendar</CardTitle>
        <Calendar className="text-primary h-5 w-5" />
      </CardHeader>
      <CardContent className="space-y-3">
        {mockEvents.map((event) => (
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
        ))}
        
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
