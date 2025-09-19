import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["student", "institution", "admin"]);
export const subscriptionTierEnum = pgEnum("subscription_tier", ["free", "premium", "institution"]);
export const assessmentTypeEnum = pgEnum("assessment_type", ["quiz", "test", "exam", "flashcard"]);
export const contentTypeEnum = pgEnum("content_type", ["pdf", "ppt", "image", "video", "text"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default("student"),
  subscriptionTier: subscriptionTierEnum("subscription_tier").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Institutions table
export const institutions = pgTable("institutions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // university, college, school
  country: text("country").notNull(),
  website: text("website"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User profiles (onboarding data)
export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  institutionId: varchar("institution_id").references(() => institutions.id),
  program: text("program"), // e.g., Software Engineering
  currentLevel: text("current_level"), // e.g., Year 2, Graduate
  discoverySource: text("discovery_source"), // How they found us
  goals: text("goals").array(), // Array of goals
  targetExamDate: timestamp("target_exam_date"),
  completedOnboarding: boolean("completed_onboarding").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Courses
export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code"),
  description: text("description"),
  institutionId: varchar("institution_id").references(() => institutions.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User courses (enrollment)
export const userCourses = pgTable("user_courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  progress: integer("progress").default(0), // 0-100
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
});

// Content library
export const content = pgTable("content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  type: contentTypeEnum("type").notNull(),
  filePath: text("file_path"),
  fileSize: integer("file_size"),
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  courseId: varchar("course_id").references(() => courses.id),
  isPublic: boolean("is_public").default(true),
  rating: integer("rating").default(0), // Average rating
  ratingCount: integer("rating_count").default(0),
  downloadCount: integer("download_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Content ratings
export const contentRatings = pgTable("content_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").notNull().references(() => content.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Assessments (quizzes, tests, exams)
export const assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  type: assessmentTypeEnum("type").notNull(),
  questions: jsonb("questions").notNull(), // Array of question objects
  timeLimit: integer("time_limit"), // in minutes
  totalPoints: integer("total_points").default(0),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  courseId: varchar("course_id").references(() => courses.id),
  isAiGenerated: boolean("is_ai_generated").default(false),
  sourceContentId: varchar("source_content_id").references(() => content.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Assessment attempts
export const assessmentAttempts = pgTable("assessment_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assessmentId: varchar("assessment_id").notNull().references(() => assessments.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  answers: jsonb("answers").notNull(), // User's answers
  score: integer("score").notNull(),
  percentage: integer("percentage").notNull(),
  timeSpent: integer("time_spent"), // in seconds
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

// Study sessions
export const studySessions = pgTable("study_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: varchar("course_id").references(() => courses.id),
  contentId: varchar("content_id").references(() => content.id),
  duration: integer("duration").notNull(), // in minutes
  activitiesCompleted: text("activities_completed").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Learning paths
export const learningPaths = pgTable("learning_paths", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  targetDate: timestamp("target_date"),
  tasks: jsonb("tasks").notNull(), // Array of task objects with dates
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// AI-generated content
export const aiGeneratedContent = pgTable("ai_generated_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sourceContentId: varchar("source_content_id").references(() => content.id),
  type: text("type").notNull(), // flashcard, summary, mindmap, quiz
  aiContent: jsonb("ai_content").notNull(),
  model: text("model").notNull(), // e.g., gpt-5
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User activity
export const userActivity = pgTable("user_activity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  activityType: text("activity_type").notNull(), // upload, test_completion, login, etc.
  description: text("description").notNull(),
  metadata: jsonb("metadata"), // Additional activity data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  courses: many(userCourses),
  content: many(content),
  assessmentAttempts: many(assessmentAttempts),
  studySessions: many(studySessions),
  learningPaths: many(learningPaths),
  activities: many(userActivity),
}));

export const institutionsRelations = relations(institutions, ({ many }) => ({
  courses: many(courses),
  userProfiles: many(userProfiles),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
  institution: one(institutions, {
    fields: [userProfiles.institutionId],
    references: [institutions.id],
  }),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [courses.institutionId],
    references: [institutions.id],
  }),
  userCourses: many(userCourses),
  content: many(content),
  assessments: many(assessments),
}));

export const contentRelations = relations(content, ({ one, many }) => ({
  uploader: one(users, {
    fields: [content.uploadedBy],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [content.courseId],
    references: [courses.id],
  }),
  ratings: many(contentRatings),
  assessments: many(assessments),
}));

export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  creator: one(users, {
    fields: [assessments.createdBy],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [assessments.courseId],
    references: [courses.id],
  }),
  sourceContent: one(content, {
    fields: [assessments.sourceContentId],
    references: [content.id],
  }),
  attempts: many(assessmentAttempts),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInstitutionSchema = createInsertSchema(institutions).omit({
  id: true,
  createdAt: true,
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
});

export const insertContentSchema = createInsertSchema(content).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  rating: true,
  ratingCount: true,
  downloadCount: true,
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true,
});

export const insertAssessmentAttemptSchema = createInsertSchema(assessmentAttempts).omit({
  id: true,
  completedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type Institution = typeof institutions.$inferSelect;
export type InsertInstitution = z.infer<typeof insertInstitutionSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Content = typeof content.$inferSelect;
export type InsertContent = z.infer<typeof insertContentSchema>;
export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type AssessmentAttempt = typeof assessmentAttempts.$inferSelect;
export type InsertAssessmentAttempt = z.infer<typeof insertAssessmentAttemptSchema>;
export type StudySession = typeof studySessions.$inferSelect;
export type LearningPath = typeof learningPaths.$inferSelect;
export type UserActivity = typeof userActivity.$inferSelect;
