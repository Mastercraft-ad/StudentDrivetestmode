import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, RotateCcw, BookOpen, Target, Lightbulb } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface StudyTip {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "reading" | "time" | "memory" | "focus";
  isActive?: boolean;
}

const studyTips: StudyTip[] = [
  {
    id: "active-reading",
    title: "Active Reading Technique",
    description: "Take notes while reading to improve retention and understanding",
    icon: BookOpen,
    category: "reading",
    isActive: true,
  },
  {
    id: "pomodoro",
    title: "Pomodoro Technique",
    description: "Study in 25-minute focused intervals with 5-minute breaks",
    icon: Clock,
    category: "time",
  },
  {
    id: "spaced-repetition",
    title: "Spaced Repetition",
    description: "Review materials at increasing intervals for long-term retention",
    icon: RotateCcw,
    category: "memory",
  },
  {
    id: "goal-setting",
    title: "SMART Goals",
    description: "Set Specific, Measurable, Achievable, Relevant, Time-bound goals",
    icon: Target,
    category: "focus",
  },
];

const categoryColors = {
  reading: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  time: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  memory: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  focus: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

export function StudyTipsWidget() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleViewAllTips = () => {
    // Navigate to notes page where study guides and tips are available
    setLocation("/notes");
  };

  const handleApplyTip = (tipId: string) => {
    // Show confirmation that tip has been noted
    const tip = studyTips.find(t => t.id === tipId);
    if (tip) {
      toast({
        title: "Study tip noted! 📚",
        description: `Remember to apply: ${tip.title}`,
      });
    }
  };

  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Study Tips</CardTitle>
        <Lightbulb className="text-primary h-5 w-5" />
      </CardHeader>
      <CardContent className="space-y-3">
        {studyTips.map((tip) => {
          const Icon = tip.icon;
          return (
            <div
              key={tip.id}
              className={`flex items-start p-3 rounded-lg transition-colors ${
                tip.isActive ? "bg-accent" : "bg-muted"
              }`}
              data-testid={`study-tip-${tip.id}`}
            >
              <div className="flex-shrink-0 mr-3 mt-0.5">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <p className={`text-sm font-medium ${
                    tip.isActive ? "text-accent-foreground" : "text-muted-foreground"
                  }`}>
                    {tip.title}
                  </p>
                  <Badge 
                    variant="secondary"
                    className={`text-xs ml-2 flex-shrink-0 ${categoryColors[tip.category]}`}
                  >
                    {tip.category}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {tip.description}
                </p>
                {tip.isActive && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 h-6 px-2 text-xs"
                    onClick={() => handleApplyTip(tip.id)}
                    data-testid={`button-apply-${tip.id}`}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Apply
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        <Button
          variant="ghost"
          className="w-full text-primary text-sm font-medium hover:text-primary/80 mt-4"
          onClick={handleViewAllTips}
          data-testid="button-view-all-tips"
        >
          View More Study Tips →
        </Button>

        <div className="text-center pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Tips personalized based on your learning patterns
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
