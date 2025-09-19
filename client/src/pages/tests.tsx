import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ClipboardCheck, 
  Plus, 
  Clock, 
  Brain, 
  Target, 
  TrendingUp,
  Play,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export default function Tests() {
  const { toast } = useToast();
  const [createTestDialogOpen, setCreateTestDialogOpen] = useState(false);
  const [generateAITestDialogOpen, setGenerateAITestDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [testInProgress, setTestInProgress] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  const [newTestData, setNewTestData] = useState({
    title: "",
    description: "",
    type: "quiz" as const,
    timeLimit: 30,
    questions: [] as QuizQuestion[],
  });

  const [aiTestData, setAiTestData] = useState({
    content: "",
    questionCount: 5,
    timeLimit: 10,
  });

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ["/api/assessments"],
    queryFn: () => api.getAssessments(),
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics"],
    queryFn: () => api.getAnalytics(),
  });

  const createTestMutation = useMutation({
    mutationFn: (testData: any) => api.createAssessment(testData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      setCreateTestDialogOpen(false);
      toast({
        title: "Test created successfully!",
        description: "Your test is now available for practice.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create test",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateAITestMutation = useMutation({
    mutationFn: (data: typeof aiTestData) => 
      api.generateQuiz(data.content, data.questionCount),
    onSuccess: (assessment) => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      setGenerateAITestDialogOpen(false);
      setAiTestData({ content: "", questionCount: 5, timeLimit: 10 });
      toast({
        title: "AI test generated successfully! 🤖",
        description: `"${assessment.title}" is ready for practice.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate AI test",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const submitTestMutation = useMutation({
    mutationFn: ({ assessmentId, answers, timeSpent }: {
      assessmentId: string;
      answers: number[];
      timeSpent: number;
    }) => api.submitAssessmentAttempt(assessmentId, answers, timeSpent),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      setTestInProgress(null);
      setAnswers([]);
      setCurrentQuestionIndex(0);
      toast({
        title: "Test completed!",
        description: `Your score: ${result.percentage}%`,
      });
    },
  });

  const startTest = (test: any) => {
    setTestInProgress(test);
    setCurrentQuestionIndex(0);
    setAnswers(new Array(test.questions.length).fill(-1));
    setTimeLeft((test.timeLimit || 30) * 60); // Convert minutes to seconds
  };

  const submitAnswer = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < testInProgress.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const finishTest = () => {
    const timeSpent = ((testInProgress.timeLimit || 30) * 60) - timeLeft;
    submitTestMutation.mutate({
      assessmentId: testInProgress.id,
      answers,
      timeSpent,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Test taking interface
  if (testInProgress) {
    const currentQuestion = testInProgress.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / testInProgress.questions.length) * 100;

    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          {/* Test Header */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{testInProgress.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Question {currentQuestionIndex + 1} of {testInProgress.questions.length}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-mono font-bold text-primary">
                    {formatTime(timeLeft)}
                  </div>
                  <p className="text-xs text-muted-foreground">Time Remaining</p>
                </div>
              </div>
              <Progress value={progress} className="mt-4" />
            </CardHeader>
          </Card>

          {/* Question */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentQuestion.options.map((option: string, index: number) => (
                <Button
                  key={index}
                  variant={answers[currentQuestionIndex] === index ? "default" : "outline"}
                  className="w-full text-left justify-start h-auto p-4"
                  onClick={() => submitAnswer(index)}
                  data-testid={`option-${index}`}
                >
                  <span className="font-semibold mr-3">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
              data-testid="button-previous-question"
            >
              Previous
            </Button>
            
            <div className="flex space-x-2">
              {currentQuestionIndex < testInProgress.questions.length - 1 ? (
                <Button 
                  onClick={nextQuestion}
                  data-testid="button-next-question"
                >
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={finishTest}
                  disabled={submitTestMutation.isPending}
                  data-testid="button-finish-test"
                >
                  {submitTestMutation.isPending ? "Submitting..." : "Finish Test"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Practice Tests</h1>
            <p className="text-muted-foreground mt-1">
              Test your knowledge with quizzes and mock exams
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Dialog open={generateAITestDialogOpen} onOpenChange={setGenerateAITestDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-generate-ai-test">
                  <Brain className="mr-2 h-4 w-4" />
                  AI Test Generator
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate AI Test</DialogTitle>
                  <DialogDescription>
                    Create a test using AI from your study materials
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ai-content">Study Material</Label>
                    <Textarea
                      id="ai-content"
                      value={aiTestData.content}
                      onChange={(e) => setAiTestData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Paste your notes, textbook content, or any study material here..."
                      rows={8}
                      data-testid="textarea-ai-content"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="question-count">Number of Questions</Label>
                      <Input
                        id="question-count"
                        type="number"
                        min="1"
                        max="50"
                        value={aiTestData.questionCount}
                        onChange={(e) => setAiTestData(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
                        data-testid="input-question-count"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ai-time-limit">Time Limit (minutes)</Label>
                      <Input
                        id="ai-time-limit"
                        type="number"
                        min="5"
                        max="180"
                        value={aiTestData.timeLimit}
                        onChange={(e) => setAiTestData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                        data-testid="input-ai-time-limit"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setGenerateAITestDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => generateAITestMutation.mutate(aiTestData)}
                      disabled={generateAITestMutation.isPending || !aiTestData.content}
                      data-testid="button-generate-ai-test-confirm"
                    >
                      {generateAITestMutation.isPending ? "Generating..." : "Generate Test"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button data-testid="button-create-manual-test">
              <Plus className="mr-2 h-4 w-4" />
              Create Test
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tests Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.sessionsThisMonth || 0}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {analytics?.avgScore || 0}%
              </div>
              <p className="text-xs text-muted-foreground">All time average</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {analytics?.bestScore || 0}%
              </div>
              <p className="text-xs text-muted-foreground">Personal best</p>
            </CardContent>
          </Card>
        </div>

        {/* Tests List */}
        <Tabs defaultValue="available" className="w-full">
          <TabsList>
            <TabsTrigger value="available">Available Tests</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="ai-generated">AI Generated</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-5 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : assessments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assessments.map((test) => (
                  <Card key={test.id} className="card-hover" data-testid={`test-card-${test.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{test.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {test.description}
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          <Badge variant="outline" className="text-xs">
                            {test.type.toUpperCase()}
                          </Badge>
                          {test.isAiGenerated && (
                            <Badge variant="secondary" className="text-xs">
                              AI
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <ClipboardCheck className="w-4 h-4" />
                          <span>{test.questions.length} questions</span>
                        </div>
                        {test.timeLimit && (
                          <div className="flex items-center space-x-1 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>{test.timeLimit} min</span>
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        className="w-full"
                        onClick={() => startTest(test)}
                        data-testid={`button-start-test-${test.id}`}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Start Test
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No tests available</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first test or generate one using AI from your study materials.
                  </p>
                  <Button onClick={() => setGenerateAITestDialogOpen(true)}>
                    <Brain className="mr-2 h-4 w-4" />
                    Generate AI Test
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed">
            <div className="text-center py-12 text-muted-foreground">
              <p>Completed tests history would be shown here.</p>
            </div>
          </TabsContent>

          <TabsContent value="ai-generated">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assessments.filter(test => test.isAiGenerated).map((test) => (
                <Card key={test.id} className="card-hover">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{test.title}</CardTitle>
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        <Brain className="w-3 h-3 mr-1" />
                        AI
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{test.description}</p>
                    <Button 
                      className="w-full"
                      onClick={() => startTest(test)}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Start AI Test
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
