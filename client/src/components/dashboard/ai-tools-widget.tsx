import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, 
  FileStack, 
  HelpCircle, 
  Lightbulb, 
  Network, 
  Loader2,
  Sparkles,
  Brain
} from "lucide-react";

export function AiToolsWidget() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [flashcardCount, setFlashcardCount] = useState(10);
  const [questionCount, setQuestionCount] = useState(5);

  const generateFlashcardsMutation = useMutation({
    mutationFn: ({ content, count }: { content: string; count: number }) =>
      api.generateFlashcards(content, count),
    onSuccess: (data) => {
      toast({
        title: "Flashcards Generated! 🃏",
        description: `Created ${data.flashcards.length} flashcards from your content.`,
      });
      setActiveDialog(null);
      setContent("");
      // Navigate to tests page where flashcards can be reviewed
      setLocation("/tests");
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateQuizMutation = useMutation({
    mutationFn: ({ content, count }: { content: string; count: number }) =>
      api.generateQuiz(content, count),
    onSuccess: (assessment) => {
      toast({
        title: "Quiz Generated! 📝",
        description: `Created "${assessment.title}" with ${assessment.questions.length} questions.`,
      });
      setActiveDialog(null);
      setContent("");
      // Navigate to tests page to view the generated quiz
      setLocation("/tests");
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const summarizeMutation = useMutation({
    mutationFn: (content: string) => api.summarizeContent(content),
    onSuccess: (summary) => {
      toast({
        title: "Summary Generated! 📋",
        description: `Created summary: "${summary.title}"`,
      });
      setActiveDialog(null);
      setContent("");
      // Navigate to notes page where summaries are stored
      setLocation("/notes");
    },
    onError: (error) => {
      toast({
        title: "Summarization Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateMindMapMutation = useMutation({
    mutationFn: (content: string) => api.generateMindMap(content),
    onSuccess: () => {
      toast({
        title: "Mind Map Generated! 🧠",
        description: "Your visual mind map is ready to explore.",
      });
      setActiveDialog(null);
      setContent("");
      // Navigate to notes page where mind maps are accessible
      setLocation("/notes");
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const aiTools = [
    {
      id: "flashcards",
      title: "Flashcards",
      icon: FileStack,
      description: "Generate interactive flashcards",
      action: () => setActiveDialog("flashcards"),
      isPending: generateFlashcardsMutation.isPending,
    },
    {
      id: "quiz",
      title: "Quiz Gen",
      icon: HelpCircle,
      description: "Create quizzes from your notes",
      action: () => setActiveDialog("quiz"),
      isPending: generateQuizMutation.isPending,
    },
    {
      id: "summarize",
      title: "Summarize",
      icon: Lightbulb,
      description: "Get key points and summaries",
      action: () => setActiveDialog("summarize"),
      isPending: summarizeMutation.isPending,
    },
    {
      id: "mindmap",
      title: "Mind Map",
      icon: Network,
      description: "Visual knowledge organization",
      action: () => setActiveDialog("mindmap"),
      isPending: generateMindMapMutation.isPending,
    },
  ];

  const handleGenerate = (toolId: string) => {
    if (!content.trim()) {
      toast({
        title: "Content Required",
        description: "Please paste your study material to generate AI content.",
        variant: "destructive",
      });
      return;
    }

    switch (toolId) {
      case "flashcards":
        generateFlashcardsMutation.mutate({ content, count: flashcardCount });
        break;
      case "quiz":
        generateQuizMutation.mutate({ content, count: questionCount });
        break;
      case "summarize":
        summarizeMutation.mutate(content);
        break;
      case "mindmap":
        generateMindMapMutation.mutate(content);
        break;
    }
  };

  const isPending = 
    generateFlashcardsMutation.isPending ||
    generateQuizMutation.isPending ||
    summarizeMutation.isPending ||
    generateMindMapMutation.isPending;

  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">AI Study Tools</CardTitle>
        <div className="flex items-center text-primary">
          <Bot className="mr-1 h-4 w-4" />
          <Badge variant="secondary" className="text-xs font-medium">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Powered
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {aiTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Dialog 
                key={tool.id}
                open={activeDialog === tool.id}
                onOpenChange={(open) => setActiveDialog(open ? tool.id : null)}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center p-4 h-auto bg-accent hover:bg-accent/80 transition-colors space-y-2"
                    disabled={isPending}
                    data-testid={`button-ai-${tool.id}`}
                  >
                    {tool.isPending ? (
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    ) : (
                      <Icon className="h-6 w-6 text-primary" />
                    )}
                    <span className="text-sm font-medium text-accent-foreground">
                      {tool.title}
                    </span>
                  </Button>
                </DialogTrigger>
                
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <Brain className="w-5 h-5 mr-2 text-primary" />
                      AI {tool.title} Generator
                    </DialogTitle>
                    <DialogDescription>
                      {tool.description}. Paste your study material below to get started.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ai-content">Study Material</Label>
                      <Textarea
                        id="ai-content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Paste your notes, textbook content, or any study material here..."
                        rows={8}
                        className="resize-none"
                        data-testid={`textarea-${tool.id}-content`}
                      />
                    </div>
                    
                    {tool.id === "flashcards" && (
                      <div className="space-y-2">
                        <Label htmlFor="flashcard-count">Number of Flashcards</Label>
                        <Input
                          id="flashcard-count"
                          type="number"
                          min="1"
                          max="50"
                          value={flashcardCount}
                          onChange={(e) => setFlashcardCount(parseInt(e.target.value))}
                          data-testid="input-flashcard-count"
                        />
                      </div>
                    )}
                    
                    {tool.id === "quiz" && (
                      <div className="space-y-2">
                        <Label htmlFor="question-count">Number of Questions</Label>
                        <Input
                          id="question-count"
                          type="number"
                          min="1"
                          max="25"
                          value={questionCount}
                          onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                          data-testid="input-question-count"
                        />
                      </div>
                    )}
                    
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveDialog(null)}
                        disabled={isPending}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => handleGenerate(tool.id)}
                        disabled={isPending || !content.trim()}
                        data-testid={`button-generate-${tool.id}`}
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate {tool.title}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            );
          })}
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            AI tools powered by advanced language models
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
