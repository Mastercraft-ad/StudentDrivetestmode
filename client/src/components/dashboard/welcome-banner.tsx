import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

export function WelcomeBanner() {
  const { user } = useAuth();

  const handleStartStudySession = () => {
    // TODO: Implement study session tracking
    console.log("Starting study session...");
  };

  return (
    <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-6 mb-6 text-primary-foreground">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2" data-testid="text-welcome-title">
            Welcome back, {user?.username || "Student"}! 👋
          </h2>
          <p className="opacity-90 mb-4">
            Ready to continue your learning journey?
          </p>
          <Button 
            variant="secondary"
            onClick={handleStartStudySession}
            className="bg-white text-primary hover:bg-white/90 font-medium"
            data-testid="button-start-study-session"
          >
            Start Study Session
          </Button>
        </div>
        <div className="hidden lg:block">
          <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center">
            <BookOpen className="text-4xl w-16 h-16 opacity-80" />
          </div>
        </div>
      </div>
    </div>
  );
}
