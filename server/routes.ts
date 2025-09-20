import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { generateFlashcards, generateQuiz, summarizeContent, generateMindMap, generateStudyPlan } from "./services/openai";
import Stripe from "stripe";

// File upload configuration for Note Library - only PDF, PPTX, DOC, DOCX allowed
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit for Note Library
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.pptx', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, PPTX, DOC, and DOCX files are allowed.'));
    }
  }
});

// Validation schemas
const contentUploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["pdf", "pptx", "doc", "docx"]),
  institutionId: z.string().uuid().optional(),
  programmeId: z.string().uuid().optional(),
  isPublic: z.string().transform(val => val !== 'false')
});

const contentUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  institutionId: z.string().uuid().optional(),
  programmeId: z.string().uuid().optional(),
  isPublic: z.boolean().optional()
});

// Stripe setup
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
}) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // User profile routes
  app.get("/api/profile", requireAuth, async (req, res) => {
    try {
      const profile = await storage.getUserProfile(req.user!.id);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post("/api/profile", requireAuth, async (req, res) => {
    try {
      const profileData = {
        userId: req.user!.id,
        ...req.body
      };
      
      const existingProfile = await storage.getUserProfile(req.user!.id);
      let profile;
      
      if (existingProfile) {
        profile = await storage.updateUserProfile(req.user!.id, req.body);
      } else {
        profile = await storage.createUserProfile(profileData);
      }
      
      // Log activity
      await storage.createUserActivity({
        userId: req.user!.id,
        activityType: "profile_update",
        description: "Updated profile information",
        metadata: { completedOnboarding: req.body.completedOnboarding }
      });
      
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Institution routes
  app.get("/api/institutions", async (req, res) => {
    try {
      const institutions = await storage.getInstitutions();
      res.json(institutions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch institutions" });
    }
  });

  // Programme routes
  app.get("/api/programmes", async (req, res) => {
    try {
      const programmes = await storage.getProgrammes();
      res.json(programmes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch programmes" });
    }
  });

  app.get("/api/institutions/:institutionId/programmes", async (req, res) => {
    try {
      const programmes = await storage.getProgrammesByInstitution(req.params.institutionId);
      res.json(programmes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch programmes" });
    }
  });

  // Seed data endpoint for Nigerian universities and programmes (development only)
  app.post("/api/seed-nigerian-data", requireAuth, async (req, res) => {
    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: "Seeding is not allowed in production" });
    }
    try {
      // Check if data already exists
      const existingInstitutions = await storage.getInstitutions();
      if (existingInstitutions.length > 0) {
        return res.json({ message: "Data already seeded", count: existingInstitutions.length });
      }

      const nigerianUniversities = [
        { name: "University of Lagos", type: "university", country: "Nigeria", website: "https://unilag.edu.ng" },
        { name: "University of Ibadan", type: "university", country: "Nigeria", website: "https://ui.edu.ng" },
        { name: "Ahmadu Bello University", type: "university", country: "Nigeria", website: "https://abu.edu.ng" },
        { name: "University of Nigeria, Nsukka", type: "university", country: "Nigeria", website: "https://unn.edu.ng" },
        { name: "Obafemi Awolowo University", type: "university", country: "Nigeria", website: "https://oauife.edu.ng" },
        { name: "University of Ilorin", type: "university", country: "Nigeria", website: "https://unilorin.edu.ng" },
        { name: "Lagos State University", type: "university", country: "Nigeria", website: "https://lasu.edu.ng" },
        { name: "Covenant University", type: "university", country: "Nigeria", website: "https://covenantuniversity.edu.ng" }
      ];

      const institutions = [];
      for (const uni of nigerianUniversities) {
        const institution = await storage.createInstitution(uni);
        institutions.push(institution);
      }

      // Create common programmes for each university
      const commonProgrammes = [
        "Computer Science", "Software Engineering", "Information Technology", "Electrical Engineering",
        "Mechanical Engineering", "Civil Engineering", "Medicine", "Pharmacy", "Law", "Business Administration",
        "Economics", "Accounting", "Mass Communication", "English Literature", "Mathematics", "Physics",
        "Chemistry", "Biology", "Psychology", "Political Science"
      ];

      let programmesCreated = 0;
      for (const institution of institutions) {
        for (const programmeName of commonProgrammes) {
          await storage.createProgramme({
            name: programmeName,
            institutionId: institution.id,
            description: `${programmeName} programme at ${institution.name}`
          });
          programmesCreated++;
        }
      }

      res.json({ 
        message: "Nigerian universities and programmes seeded successfully",
        institutions: institutions.length,
        programmes: programmesCreated
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to seed data" });
    }
  });

  // Course routes
  app.get("/api/courses", requireAuth, async (req, res) => {
    try {
      const courses = await storage.getUserCourses(req.user!.id);
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.post("/api/courses/:courseId/enroll", requireAuth, async (req, res) => {
    try {
      await storage.enrollUserInCourse(req.user!.id, req.params.courseId);
      res.json({ message: "Enrolled successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to enroll in course" });
    }
  });

  // Content routes
  app.get("/api/content", requireAuth, async (req, res) => {
    try {
      const content = await storage.getContent(req.query);
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.post("/api/content", requireAuth, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Validate request body
      const validationResult = contentUploadSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: validationResult.error.errors 
        });
      }

      const validatedData = validationResult.data;

      const contentData = {
        title: validatedData.title,
        description: validatedData.description || null,
        type: validatedData.type,
        filePath: req.file.path,
        fileSize: req.file.size,
        uploadedBy: req.user!.id,
        courseId: req.body.courseId || null,
        institutionId: validatedData.institutionId || null,
        programmeId: validatedData.programmeId || null,
        isPublic: validatedData.isPublic
      };

      const content = await storage.createContent(contentData);
      
      // Log activity
      await storage.createUserActivity({
        userId: req.user!.id,
        activityType: "content_upload",
        description: `Uploaded "${content.title}"`,
        metadata: { contentId: content.id, type: content.type }
      });

      res.status(201).json(content);
    } catch (error) {
      console.error('Content upload error:', error);
      res.status(500).json({ message: "Failed to upload content" });
    }
  });

  app.post("/api/content/:contentId/rate", requireAuth, async (req, res) => {
    try {
      const { rating, review } = req.body;
      await storage.rateContent(req.params.contentId, req.user!.id, rating, review);
      res.json({ message: "Rating submitted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to submit rating" });
    }
  });

  // Additional content routes for Note Library
  app.get("/api/content/my-notes", requireAuth, async (req, res) => {
    try {
      const content = await storage.getUserContent(req.user!.id);
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user content" });
    }
  });

  app.get("/api/content/public", requireAuth, async (req, res) => {
    try {
      const content = await storage.getPublicContent(req.query);
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch public content" });
    }
  });

  app.put("/api/content/:contentId", requireAuth, async (req, res) => {
    try {
      const contentId = req.params.contentId;
      
      // Validate content ID format
      if (!contentId || typeof contentId !== 'string') {
        return res.status(400).json({ message: "Invalid content ID" });
      }
      
      // Verify user owns the content
      const existingContent = await storage.getContentById(contentId);
      if (!existingContent || existingContent.uploadedBy !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Validate request body
      const validationResult = contentUpdateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: validationResult.error.errors 
        });
      }

      const validatedData = validationResult.data;
      const updatedContent = await storage.updateContent(contentId, validatedData);
      res.json(updatedContent);
    } catch (error) {
      console.error('Content update error:', error);
      res.status(500).json({ message: "Failed to update content" });
    }
  });

  app.delete("/api/content/:contentId", requireAuth, async (req, res) => {
    try {
      const contentId = req.params.contentId;
      
      // Verify user owns the content
      const existingContent = await storage.getContentById(contentId);
      if (!existingContent || existingContent.uploadedBy !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteContent(contentId);
      
      // Delete the physical file
      if (existingContent.filePath && fs.existsSync(existingContent.filePath)) {
        fs.unlinkSync(existingContent.filePath);
      }
      
      res.json({ message: "Content deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete content" });
    }
  });

  // Assessment routes
  app.get("/api/assessments", requireAuth, async (req, res) => {
    try {
      const assessments = await storage.getAssessments(req.query);
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });

  app.post("/api/assessments", requireAuth, async (req, res) => {
    try {
      const assessmentData = {
        ...req.body,
        createdBy: req.user!.id
      };
      
      const assessment = await storage.createAssessment(assessmentData);
      res.status(201).json(assessment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create assessment" });
    }
  });

  app.post("/api/assessments/:assessmentId/attempt", requireAuth, async (req, res) => {
    try {
      const { answers, timeSpent } = req.body;
      const assessment = await storage.getAssessmentById(req.params.assessmentId);
      
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      // Calculate score (simplified)
      const questions = assessment.questions as any[];
      let correctAnswers = 0;
      
      questions.forEach((question, index) => {
        if (answers[index] === question.correctAnswer) {
          correctAnswers++;
        }
      });

      const score = correctAnswers;
      const percentage = Math.round((correctAnswers / questions.length) * 100);

      const attempt = await storage.createAssessmentAttempt({
        assessmentId: req.params.assessmentId,
        userId: req.user!.id,
        answers,
        score,
        percentage,
        timeSpent
      });

      // Log activity
      await storage.createUserActivity({
        userId: req.user!.id,
        activityType: "assessment_completion",
        description: `Completed "${assessment.title}" - Score: ${percentage}%`,
        metadata: { assessmentId: assessment.id, score: percentage }
      });

      res.json(attempt);
    } catch (error) {
      res.status(500).json({ message: "Failed to submit assessment" });
    }
  });

  // AI-powered features
  app.post("/api/ai/flashcards", requireAuth, async (req, res) => {
    try {
      const { content, count = 10 } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }

      const flashcards = await generateFlashcards(content, count);
      
      // Save AI generated content
      await storage.createAiContent({
        userId: req.user!.id,
        type: "flashcard",
        aiContent: { flashcards, originalContent: content },
        model: "gpt-5"
      });

      res.json({ flashcards });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/ai/quiz", requireAuth, async (req, res) => {
    try {
      const { content, questionCount = 5 } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }

      const questions = await generateQuiz(content, questionCount);
      
      // Create assessment
      const assessment = await storage.createAssessment({
        title: "AI Generated Quiz",
        description: "Quiz generated from uploaded content",
        type: "quiz",
        questions,
        timeLimit: questionCount * 2, // 2 minutes per question
        totalPoints: questions.length,
        createdBy: req.user!.id,
        isAiGenerated: true
      });

      res.json(assessment);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/ai/summarize", requireAuth, async (req, res) => {
    try {
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }

      const summary = await summarizeContent(content);
      
      // Save AI generated content
      await storage.createAiContent({
        userId: req.user!.id,
        type: "summary",
        aiContent: { summary, originalContent: content },
        model: "gpt-5"
      });

      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/ai/mindmap", requireAuth, async (req, res) => {
    try {
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }

      const mindMap = await generateMindMap(content);
      
      // Save AI generated content
      await storage.createAiContent({
        userId: req.user!.id,
        type: "mindmap",
        aiContent: { mindMap, originalContent: content },
        model: "gpt-5"
      });

      res.json(mindMap);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Learning paths
  app.get("/api/learning-paths", requireAuth, async (req, res) => {
    try {
      const paths = await storage.getUserLearningPaths(req.user!.id);
      res.json(paths);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch learning paths" });
    }
  });

  app.post("/api/learning-paths", requireAuth, async (req, res) => {
    try {
      const { goals, targetDate, currentLevel } = req.body;
      
      const studyPlan = await generateStudyPlan(goals, new Date(targetDate), currentLevel);
      
      const path = await storage.createLearningPath({
        userId: req.user!.id,
        title: studyPlan.title,
        description: studyPlan.description,
        targetDate: new Date(targetDate),
        tasks: studyPlan.tasks
      });

      res.status(201).json(path);
    } catch (error) {
      res.status(500).json({ message: "Failed to create learning path" });
    }
  });

  // Analytics
  app.get("/api/analytics", requireAuth, async (req, res) => {
    try {
      const analytics = await storage.getUserAnalytics(req.user!.id);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Activity feed
  app.get("/api/activities", requireAuth, async (req, res) => {
    try {
      const activities = await storage.getUserActivities(req.user!.id, 20);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Study sessions
  app.post("/api/study-sessions", requireAuth, async (req, res) => {
    try {
      const sessionData = {
        userId: req.user!.id,
        ...req.body
      };
      
      const session = await storage.createStudySession(sessionData);
      
      // Log activity
      await storage.createUserActivity({
        userId: req.user!.id,
        activityType: "study_session",
        description: `Studied for ${req.body.duration} minutes`,
        metadata: { duration: req.body.duration, courseId: req.body.courseId }
      });

      res.status(201).json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to create study session" });
    }
  });

  // Subscription routes (Stripe integration)
  if (stripe) {
    app.post("/api/create-subscription", requireAuth, async (req, res) => {
      try {
        let user = req.user!;

        if (user.stripeSubscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          res.send({
            subscriptionId: subscription.id,
            clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
          });
          return;
        }

        if (!user.email) {
          throw new Error('No user email on file');
        }

        const customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
        });

        user = await storage.updateUserStripeInfo(user.id, customer.id);

        const subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{
            price: process.env.STRIPE_PRICE_ID || "price_default",
          }],
          payment_behavior: 'default_incomplete',
          expand: ['latest_invoice.payment_intent'],
        });

        await storage.updateUserStripeInfo(user.id, customer.id, subscription.id);

        res.send({
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        });
      } catch (error: any) {
        return res.status(400).send({ error: { message: error.message } });
      }
    });
  }

  const httpServer = createServer(app);
  return httpServer;
}
