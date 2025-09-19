import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Redirect } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { queryClient } from "@/lib/queryClient";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronRight } from "lucide-react";
import { format } from "date-fns";

export default function Onboarding() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [targetDate, setTargetDate] = useState<Date>();
  const [formData, setFormData] = useState({
    program: "",
    institutionId: "",
    currentLevel: "",
    discoverySource: "",
    customGoal: "",
  });

  const { data: institutions = [] } = useQuery({
    queryKey: ["/api/institutions"],
    queryFn: () => api.getInstitutions(),
  });

  const { data: profile } = useQuery({
    queryKey: ["/api/profile"],
    queryFn: () => api.getProfile(),
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => api.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Welcome to StudentDrive! 🎉",
        description: "Your profile has been completed successfully.",
      });
    },
  });

  // Redirect if already completed onboarding
  if (profile?.completedOnboarding) {
    return <Redirect to="/" />;
  }

  const commonGoals = [
    "Improve exam performance",
    "Better time management",
    "Create effective study notes",
    "Track learning progress",
    "Collaborate with peers",
    "Prepare for certifications",
    "Develop study habits",
    "Reduce study stress",
  ];

  const discoveryOptions = [
    "Search engine (Google, Bing)",
    "Social media (Facebook, Twitter, Instagram)",
    "Friend or family recommendation",
    "Educational website or blog",
    "Advertisement",
    "School/University recommendation",
    "Other",
  ];

  const currentLevelOptions = [
    "High School",
    "Undergraduate Year 1",
    "Undergraduate Year 2", 
    "Undergraduate Year 3",
    "Undergraduate Year 4+",
    "Graduate Student",
    "Professional/Continuing Education",
  ];

  const handleGoalToggle = (goal: string) => {
    setSelectedGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = () => {
    const goals = [...selectedGoals];
    if (formData.customGoal) goals.push(formData.customGoal);

    const profileData = {
      ...formData,
      goals,
      targetExamDate: targetDate?.toISOString(),
      completedOnboarding: true,
    };

    updateProfileMutation.mutate(profileData);
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.program && formData.institutionId && formData.currentLevel;
      case 2:
        return formData.discoverySource;
      case 3:
        return selectedGoals.length > 0 || formData.customGoal;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const progress = (step / 4) * 100;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="space-y-2">
            <Progress value={progress} className="w-full" data-testid="progress-onboarding" />
            <CardTitle>Welcome to StudentDrive!</CardTitle>
            <CardDescription>
              Let's personalize your learning experience (Step {step} of 4)
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tell us about your studies</h3>
              
              <div className="space-y-2">
                <Label htmlFor="program">Program/Field of Study</Label>
                <Input
                  id="program"
                  placeholder="e.g., Software Engineering, Business Administration"
                  value={formData.program}
                  onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                  data-testid="input-program"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="institution">Institution</Label>
                <Select 
                  value={formData.institutionId}
                  onValueChange={(value) => setFormData({ ...formData, institutionId: value })}
                  data-testid="select-institution"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your institution" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions.map((institution) => (
                      <SelectItem key={institution.id} value={institution.id}>
                        {institution.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentLevel">Current Level</Label>
                <Select 
                  value={formData.currentLevel}
                  onValueChange={(value) => setFormData({ ...formData, currentLevel: value })}
                  data-testid="select-current-level"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your current level" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentLevelOptions.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">How did you discover StudentDrive?</h3>
              
              <div className="space-y-2">
                <Label>Discovery Source</Label>
                <Select 
                  value={formData.discoverySource}
                  onValueChange={(value) => setFormData({ ...formData, discoverySource: value })}
                  data-testid="select-discovery-source"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="How did you find us?" />
                  </SelectTrigger>
                  <SelectContent>
                    {discoveryOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">What are your learning goals?</h3>
              <p className="text-sm text-muted-foreground">Select all that apply to you</p>
              
              <div className="grid grid-cols-2 gap-3">
                {commonGoals.map((goal) => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      id={goal}
                      checked={selectedGoals.includes(goal)}
                      onCheckedChange={() => handleGoalToggle(goal)}
                      data-testid={`checkbox-goal-${goal.toLowerCase().replace(/\s+/g, '-')}`}
                    />
                    <Label htmlFor={goal} className="text-sm">
                      {goal}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customGoal">Other (specify your own goal)</Label>
                <Textarea
                  id="customGoal"
                  placeholder="Describe your specific learning goal..."
                  value={formData.customGoal}
                  onChange={(e) => setFormData({ ...formData, customGoal: e.target.value })}
                  data-testid="textarea-custom-goal"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Set your target exam date (optional)</h3>
              <p className="text-sm text-muted-foreground">
                This helps us create a personalized study schedule for you
              </p>
              
              <div className="space-y-2">
                <Label>Target Exam Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="button-select-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {targetDate ? format(targetDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={targetDate}
                      onSelect={setTargetDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={handleBack} 
              disabled={step === 1}
              data-testid="button-back"
            >
              Back
            </Button>
            
            {step < 4 ? (
              <Button 
                onClick={handleNext} 
                disabled={!isStepValid()}
                data-testid="button-next"
              >
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleComplete}
                disabled={updateProfileMutation.isPending}
                data-testid="button-complete"
              >
                {updateProfileMutation.isPending ? "Completing..." : "Complete Setup"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
