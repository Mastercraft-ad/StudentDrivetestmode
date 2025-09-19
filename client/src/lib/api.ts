import { apiRequest } from "./queryClient";

export interface UserProfile {
  userId: string;
  institutionId?: string;
  program?: string;
  currentLevel?: string;
  discoverySource?: string;
  goals?: string[];
  targetExamDate?: string;
  completedOnboarding?: boolean;
}

export interface Institution {
  id: string;
  name: string;
  type: string;
  country: string;
  website?: string;
}

export interface Course {
  id: string;
  name: string;
  code?: string;
  description?: string;
  progress?: number;
}

export interface Content {
  id: string;
  title: string;
  description?: string;
  type: string;
  uploadedBy: string;
  courseId?: string;
  rating: number;
  ratingCount: number;
  downloadCount: number;
  fileSize?: number;
  createdAt: string;
}

export interface Assessment {
  id: string;
  title: string;
  description?: string;
  type: string;
  questions: any[];
  timeLimit?: number;
  totalPoints: number;
  isAiGenerated: boolean;
  createdAt: string;
}

export interface UserAnalytics {
  studyStreak: number;
  totalStudyTime: number;
  avgScore: number;
  bestScore: number;
  sessionsThisMonth: number;
  learningVelocity: number;
}

export interface UserActivity {
  id: string;
  activityType: string;
  description: string;
  metadata?: any;
  createdAt: string;
}

export interface LearningPath {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetDate?: string;
  tasks: any[];
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// API functions
export const api = {
  // Profile
  async getProfile(): Promise<UserProfile> {
    const res = await apiRequest("GET", "/api/profile");
    return res.json();
  },

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const res = await apiRequest("POST", "/api/profile", profile);
    return res.json();
  },

  // Institutions
  async getInstitutions(): Promise<Institution[]> {
    const res = await apiRequest("GET", "/api/institutions");
    return res.json();
  },

  // Courses
  async getCourses(): Promise<Course[]> {
    const res = await apiRequest("GET", "/api/courses");
    return res.json();
  },

  // Content
  async getContent(filters?: any): Promise<Content[]> {
    const params = new URLSearchParams(filters).toString();
    const res = await apiRequest("GET", `/api/content?${params}`);
    return res.json();
  },

  async uploadContent(formData: FormData): Promise<Content> {
    const res = await fetch("/api/content", {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res.json();
  },

  async rateContent(contentId: string, rating: number, review?: string): Promise<void> {
    await apiRequest("POST", `/api/content/${contentId}/rate`, { rating, review });
  },

  // Assessments
  async getAssessments(filters?: any): Promise<Assessment[]> {
    const params = new URLSearchParams(filters).toString();
    const res = await apiRequest("GET", `/api/assessments?${params}`);
    return res.json();
  },

  async createAssessment(assessment: any): Promise<Assessment> {
    const res = await apiRequest("POST", "/api/assessments", assessment);
    return res.json();
  },

  async submitAssessmentAttempt(assessmentId: string, answers: any[], timeSpent: number): Promise<any> {
    const res = await apiRequest("POST", `/api/assessments/${assessmentId}/attempt`, {
      answers,
      timeSpent
    });
    return res.json();
  },

  // AI Features
  async generateFlashcards(content: string, count?: number): Promise<any> {
    const res = await apiRequest("POST", "/api/ai/flashcards", { content, count });
    return res.json();
  },

  async generateQuiz(content: string, questionCount?: number): Promise<Assessment> {
    const res = await apiRequest("POST", "/api/ai/quiz", { content, questionCount });
    return res.json();
  },

  async summarizeContent(content: string): Promise<any> {
    const res = await apiRequest("POST", "/api/ai/summarize", { content });
    return res.json();
  },

  async generateMindMap(content: string): Promise<any> {
    const res = await apiRequest("POST", "/api/ai/mindmap", { content });
    return res.json();
  },

  // Analytics
  async getAnalytics(): Promise<UserAnalytics> {
    const res = await apiRequest("GET", "/api/analytics");
    return res.json();
  },

  // Activities
  async getActivities(): Promise<UserActivity[]> {
    const res = await apiRequest("GET", "/api/activities");
    return res.json();
  },

  // Learning Paths
  async getUserLearningPaths(): Promise<LearningPath[]> {
    const res = await apiRequest("GET", "/api/learning-paths");
    return res.json();
  },

  async createLearningPath(goals: string[], targetDate: string, currentLevel: string): Promise<LearningPath> {
    const res = await apiRequest("POST", "/api/learning-paths", {
      goals,
      targetDate,
      currentLevel
    });
    return res.json();
  },

  // Study Sessions
  async createStudySession(session: any): Promise<any> {
    const res = await apiRequest("POST", "/api/study-sessions", session);
    return res.json();
  },
};
