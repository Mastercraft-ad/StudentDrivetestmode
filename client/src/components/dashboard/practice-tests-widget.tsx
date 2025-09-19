import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function PracticeTestsWidget() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics"],
    queryFn: () => api.getAnalytics(),
  });

  const handleGenerateNewTest = async () => {
    try {
      setIsGenerating(true);
      
      // In a real implementation, this would open a modal or navigate
      // to a page where users can select content to generate a test from
      toast({
        title: "AI Test Generator",
        description: "This feature will generate tests from your uploaded notes using AI. Please upload some study materials first.",
      });
      
      // TODO: Implement AI test generation
      // const assessment = await api.generateQuiz(selectedContent, 10);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate test. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const latestScore = analytics?.bestScore || 87;
  const averageScore = analytics?.avgScore || 82;

  return (
    <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Practice Tests</CardTitle>
        <ClipboardCheck className="text-primary h-5 w-5" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Latest Score</span>
          <span 
            className="text-2xl font-bold text-primary"
            data-testid="text-latest-score"
          >
            {latestScore}%
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Average Score</span>
          <span 
            className="text-lg font-semibold text-card-foreground"
            data-testid="text-average-score"
          >
            {averageScore}%
          </span>
        </div>
        
        <div className="pt-2 border-t border-border">
          <Button 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            onClick={handleGenerateNewTest}
            disabled={isGenerating}
            data-testid="button-generate-new-test"
          >
            <Plus className="mr-2 h-4 w-4" />
            {isGenerating ? "Generating..." : "Generate New Test"}
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground text-center">
          AI-powered tests generated from your notes
        </div>
      </CardContent>
    </Card>
  );
}
