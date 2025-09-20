import { 
  users, 
  userProfiles,
  institutions,
  programmes,
  courses,
  userCourses,
  content,
  contentRatings,
  assessments,
  assessmentAttempts,
  studySessions,
  learningPaths,
  aiGeneratedContent,
  userActivity,
  type User, 
  type InsertUser,
  type UserProfile,
  type InsertUserProfile,
  type Institution,
  type InsertInstitution,
  type Programme,
  type InsertProgramme,
  type Course,
  type InsertCourse,
  type Content,
  type InsertContent,
  type Assessment,
  type InsertAssessment,
  type AssessmentAttempt,
  type InsertAssessmentAttempt,
  type StudySession,
  type LearningPath,
  type UserActivity
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User>;
  
  // User profile methods
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile>;
  
  // Institution methods
  getInstitutions(): Promise<Institution[]>;
  getInstitution(id: string): Promise<Institution | undefined>;
  createInstitution(institution: InsertInstitution): Promise<Institution>;
  
  // Programme methods
  getProgrammes(): Promise<Programme[]>;
  getProgrammesByInstitution(institutionId: string): Promise<Programme[]>;
  getProgramme(id: string): Promise<Programme | undefined>;
  createProgramme(programme: InsertProgramme): Promise<Programme>;
  
  // Course methods
  getCourses(): Promise<Course[]>;
  getUserCourses(userId: string): Promise<any[]>;
  enrollUserInCourse(userId: string, courseId: string): Promise<void>;
  updateCourseProgress(userId: string, courseId: string, progress: number): Promise<void>;
  
  // Content methods
  getContent(filters?: any): Promise<Content[]>;
  getUserContent(userId: string): Promise<Content[]>;
  getPublicContent(filters?: any): Promise<Content[]>;
  getContentById(id: string): Promise<Content | undefined>;
  createContent(content: InsertContent): Promise<Content>;
  updateContent(id: string, content: Partial<InsertContent>): Promise<Content>;
  deleteContent(id: string): Promise<void>;
  rateContent(contentId: string, userId: string, rating: number, review?: string): Promise<void>;
  
  // Assessment methods
  getAssessments(filters?: any): Promise<Assessment[]>;
  getAssessmentById(id: string): Promise<Assessment | undefined>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  createAssessmentAttempt(attempt: InsertAssessmentAttempt): Promise<AssessmentAttempt>;
  getUserAssessmentAttempts(userId: string): Promise<AssessmentAttempt[]>;
  
  // Study session methods
  createStudySession(session: any): Promise<StudySession>;
  getUserStudySessions(userId: string): Promise<StudySession[]>;
  
  // Learning path methods
  getUserLearningPaths(userId: string): Promise<LearningPath[]>;
  createLearningPath(path: any): Promise<LearningPath>;
  
  // AI content methods
  createAiContent(content: any): Promise<any>;
  getUserAiContent(userId: string, type?: string): Promise<any[]>;
  
  // Activity methods
  createUserActivity(activity: any): Promise<UserActivity>;
  getUserActivities(userId: string, limit?: number): Promise<UserActivity[]>;
  
  // Analytics methods
  getUserAnalytics(userId: string): Promise<any>;
  
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ pool, createTableIfMissing: true });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId,
        ...(stripeSubscriptionId && { stripeSubscriptionId }),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile || undefined;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [newProfile] = await db
      .insert(userProfiles)
      .values(profile)
      .returning();
    return newProfile;
  }

  async updateUserProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile> {
    const [updatedProfile] = await db
      .update(userProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return updatedProfile;
  }

  async getInstitutions(): Promise<Institution[]> {
    return await db.select().from(institutions).orderBy(institutions.name);
  }

  async getInstitution(id: string): Promise<Institution | undefined> {
    const [institution] = await db.select().from(institutions).where(eq(institutions.id, id));
    return institution || undefined;
  }

  async createInstitution(institution: InsertInstitution): Promise<Institution> {
    const [newInstitution] = await db
      .insert(institutions)
      .values(institution)
      .returning();
    return newInstitution;
  }

  // Programme methods
  async getProgrammes(): Promise<Programme[]> {
    return await db.select().from(programmes).orderBy(programmes.name);
  }

  async getProgrammesByInstitution(institutionId: string): Promise<Programme[]> {
    return await db.select().from(programmes)
      .where(eq(programmes.institutionId, institutionId))
      .orderBy(programmes.name);
  }

  async getProgramme(id: string): Promise<Programme | undefined> {
    const [programme] = await db.select().from(programmes).where(eq(programmes.id, id));
    return programme || undefined;
  }

  async createProgramme(programme: InsertProgramme): Promise<Programme> {
    const [newProgramme] = await db
      .insert(programmes)
      .values(programme)
      .returning();
    return newProgramme;
  }

  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses).orderBy(courses.name);
  }

  async getUserCourses(userId: string): Promise<any[]> {
    return await db
      .select({
        course: courses,
        progress: userCourses.progress,
        enrolledAt: userCourses.enrolledAt,
      })
      .from(userCourses)
      .innerJoin(courses, eq(userCourses.courseId, courses.id))
      .where(eq(userCourses.userId, userId));
  }

  async enrollUserInCourse(userId: string, courseId: string): Promise<void> {
    await db.insert(userCourses).values({ userId, courseId });
  }

  async updateCourseProgress(userId: string, courseId: string, progress: number): Promise<void> {
    await db
      .update(userCourses)
      .set({ progress })
      .where(and(eq(userCourses.userId, userId), eq(userCourses.courseId, courseId)));
  }

  async getContent(filters?: any): Promise<Content[]> {
    if (filters?.courseId) {
      return await db.select().from(content)
        .where(eq(content.courseId, filters.courseId))
        .orderBy(desc(content.createdAt));
    }
    
    return await db.select().from(content).orderBy(desc(content.createdAt));
  }

  async getContentById(id: string): Promise<Content | undefined> {
    const [contentItem] = await db.select().from(content).where(eq(content.id, id));
    return contentItem || undefined;
  }

  async getUserContent(userId: string): Promise<Content[]> {
    return await db.select().from(content)
      .where(eq(content.uploadedBy, userId))
      .orderBy(desc(content.createdAt));
  }

  async getPublicContent(filters?: any): Promise<Content[]> {
    const conditions = [eq(content.isPublic, true)];
    
    if (filters?.institutionId) {
      conditions.push(eq(content.institutionId, filters.institutionId));
    }
    
    if (filters?.programmeId) {
      conditions.push(eq(content.programmeId, filters.programmeId));
    }
    
    return await db.select().from(content)
      .where(and(...conditions))
      .orderBy(desc(content.createdAt));
  }

  async createContent(contentData: InsertContent): Promise<Content> {
    const [newContent] = await db
      .insert(content)
      .values(contentData)
      .returning();
    return newContent;
  }

  async updateContent(id: string, contentData: Partial<InsertContent>): Promise<Content> {
    const [updatedContent] = await db
      .update(content)
      .set({ ...contentData, updatedAt: new Date() })
      .where(eq(content.id, id))
      .returning();
    return updatedContent;
  }

  async deleteContent(id: string): Promise<void> {
    await db.delete(content).where(eq(content.id, id));
  }

  async rateContent(contentId: string, userId: string, rating: number, review?: string): Promise<void> {
    // Insert or update rating
    await db
      .insert(contentRatings)
      .values({ contentId, userId, rating, review })
      .onConflictDoUpdate({
        target: [contentRatings.contentId, contentRatings.userId],
        set: { rating, review, createdAt: new Date() }
      });

    // Update content average rating
    const result = await db
      .select({
        avgRating: sql<number>`AVG(${contentRatings.rating})`,
        count: sql<number>`COUNT(${contentRatings.id})`
      })
      .from(contentRatings)
      .where(eq(contentRatings.contentId, contentId));

    if (result[0]) {
      await db
        .update(content)
        .set({
          rating: Math.round(result[0].avgRating),
          ratingCount: result[0].count
        })
        .where(eq(content.id, contentId));
    }
  }

  async getAssessments(filters?: any): Promise<Assessment[]> {
    if (filters?.courseId && filters?.createdBy) {
      return await db.select().from(assessments)
        .where(and(eq(assessments.courseId, filters.courseId), eq(assessments.createdBy, filters.createdBy)))
        .orderBy(desc(assessments.createdAt));
    }
    if (filters?.courseId) {
      return await db.select().from(assessments)
        .where(eq(assessments.courseId, filters.courseId))
        .orderBy(desc(assessments.createdAt));
    }
    if (filters?.createdBy) {
      return await db.select().from(assessments)
        .where(eq(assessments.createdBy, filters.createdBy))
        .orderBy(desc(assessments.createdAt));
    }
    
    return await db.select().from(assessments).orderBy(desc(assessments.createdAt));
  }

  async getAssessmentById(id: string): Promise<Assessment | undefined> {
    const [assessment] = await db.select().from(assessments).where(eq(assessments.id, id));
    return assessment || undefined;
  }

  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const [newAssessment] = await db
      .insert(assessments)
      .values(assessment)
      .returning();
    return newAssessment;
  }

  async createAssessmentAttempt(attempt: InsertAssessmentAttempt): Promise<AssessmentAttempt> {
    const [newAttempt] = await db
      .insert(assessmentAttempts)
      .values(attempt)
      .returning();
    return newAttempt;
  }

  async getUserAssessmentAttempts(userId: string): Promise<AssessmentAttempt[]> {
    return await db
      .select()
      .from(assessmentAttempts)
      .where(eq(assessmentAttempts.userId, userId))
      .orderBy(desc(assessmentAttempts.completedAt));
  }

  async createStudySession(session: any): Promise<StudySession> {
    const [newSession] = await db
      .insert(studySessions)
      .values(session)
      .returning();
    return newSession;
  }

  async getUserStudySessions(userId: string): Promise<StudySession[]> {
    return await db
      .select()
      .from(studySessions)
      .where(eq(studySessions.userId, userId))
      .orderBy(desc(studySessions.createdAt));
  }

  async getUserLearningPaths(userId: string): Promise<LearningPath[]> {
    return await db
      .select()
      .from(learningPaths)
      .where(eq(learningPaths.userId, userId))
      .orderBy(desc(learningPaths.createdAt));
  }

  async createLearningPath(path: any): Promise<LearningPath> {
    const [newPath] = await db
      .insert(learningPaths)
      .values(path)
      .returning();
    return newPath;
  }

  async createAiContent(aiContent: any): Promise<any> {
    const [newContent] = await db
      .insert(aiGeneratedContent)
      .values(aiContent)
      .returning();
    return newContent;
  }

  async getUserAiContent(userId: string, type?: string): Promise<any[]> {
    if (type) {
      return await db.select().from(aiGeneratedContent)
        .where(and(eq(aiGeneratedContent.userId, userId), eq(aiGeneratedContent.type, type)))
        .orderBy(desc(aiGeneratedContent.createdAt));
    }
    
    return await db.select().from(aiGeneratedContent)
      .where(eq(aiGeneratedContent.userId, userId))
      .orderBy(desc(aiGeneratedContent.createdAt));
  }

  async createUserActivity(activity: any): Promise<UserActivity> {
    const [newActivity] = await db
      .insert(userActivity)
      .values(activity)
      .returning();
    return newActivity;
  }

  async getUserActivities(userId: string, limit: number = 20): Promise<UserActivity[]> {
    return await db
      .select()
      .from(userActivity)
      .where(eq(userActivity.userId, userId))
      .orderBy(desc(userActivity.createdAt))
      .limit(limit);
  }

  async getUserAnalytics(userId: string): Promise<any> {
    // Get study streak
    const sessions = await db
      .select()
      .from(studySessions)
      .where(eq(studySessions.userId, userId))
      .orderBy(desc(studySessions.createdAt));

    // Get assessment stats
    const attempts = await db
      .select()
      .from(assessmentAttempts)
      .where(eq(assessmentAttempts.userId, userId))
      .orderBy(desc(assessmentAttempts.completedAt));

    // Calculate analytics
    const totalStudyTime = sessions.reduce((total, session) => total + session.duration, 0);
    const avgScore = attempts.length > 0 
      ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / attempts.length)
      : 0;
    const bestScore = attempts.length > 0 
      ? Math.max(...attempts.map(attempt => attempt.percentage))
      : 0;

    // Calculate study streak (simplified)
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const recentSessions = sessions.filter(session => 
      session.createdAt >= yesterday
    );

    return {
      studyStreak: recentSessions.length > 0 ? 7 : 0, // Simplified streak calculation
      totalStudyTime,
      avgScore,
      bestScore,
      sessionsThisMonth: sessions.filter(session => {
        const sessionDate = new Date(session.createdAt);
        return sessionDate.getMonth() === today.getMonth() && 
               sessionDate.getFullYear() === today.getFullYear();
      }).length,
      learningVelocity: totalStudyTime > 0 ? Math.round(totalStudyTime / 60 * 10) / 10 : 0, // hours per day average
    };
  }
}

export const storage = new DatabaseStorage();
