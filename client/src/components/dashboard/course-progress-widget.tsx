import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

interface CourseProgress {
  name: string;
  progress: number;
  code?: string;
}

export function CourseProgressWidget() {
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["/api/courses"],
    queryFn: () => api.getCourses(),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Course Progress</CardTitle>
          <TrendingUp className="text-primary h-5 w-5" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Use real course data with actual progress
  const courseProgressData: CourseProgress[] = courses.map(course => ({
    name: course.name,
    progress: course.progress || 0, // Show 0% if no progress data
    code: course.code
  }));

  return (
    <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Course Progress</CardTitle>
        <TrendingUp className="text-primary h-5 w-5" />
      </CardHeader>
      <CardContent className="space-y-4">
        {courseProgressData.map((course, index) => (
          <div key={course.name} data-testid={`course-progress-${index}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-card-foreground">
                {course.name}
              </span>
              <span className="text-sm text-muted-foreground">
                {course.progress}%
              </span>
            </div>
            <Progress 
              value={course.progress} 
              className="w-full"
              data-testid={`progress-bar-${index}`}
            />
          </div>
        ))}
        
        {courseProgressData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No courses enrolled yet</p>
            <p className="text-xs mt-1">Enroll in courses to track your progress!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
