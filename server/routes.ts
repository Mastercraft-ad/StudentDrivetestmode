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

// File upload configuration
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
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

      const contentData = {
        title: req.body.title,
        description: req.body.description,
        type: req.body.type,
        filePath: req.file.path,
        fileSize: req.file.size,
        uploadedBy: req.user!.id,
        courseId: req.body.courseId || null,
        isPublic: req.body.isPublic !== 'false'
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
