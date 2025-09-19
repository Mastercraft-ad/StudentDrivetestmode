import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || "default_key" 
});

export interface FlashcardData {
  question: string;
  answer: string;
  category?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface SummaryData {
  title: string;
  summary: string;
  keyPoints: string[];
}

export interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
}

export async function generateFlashcards(content: string, count: number = 10): Promise<FlashcardData[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert educational content creator. Generate flashcards from the provided content that will help students learn and remember key concepts. Return JSON with an array of flashcards."
        },
        {
          role: "user",
          content: `Generate ${count} flashcards from this content. Return as JSON array with format: [{"question": "...", "answer": "...", "category": "..."}]\n\nContent:\n${content}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.flashcards || [];
  } catch (error) {
    throw new Error("Failed to generate flashcards: " + (error as Error).message);
  }
}

export async function generateQuiz(content: string, questionCount: number = 5): Promise<QuizQuestion[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert quiz creator. Generate multiple choice questions from the provided content. Each question should have 4 options with one correct answer. Return JSON format."
        },
        {
          role: "user",
          content: `Generate ${questionCount} multiple choice questions from this content. Return as JSON with format: {"questions": [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "..."}]}\n\nContent:\n${content}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.questions || [];
  } catch (error) {
    throw new Error("Failed to generate quiz: " + (error as Error).message);
  }
}

export async function summarizeContent(content: string): Promise<SummaryData> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert content summarizer for educational materials. Create concise, informative summaries that capture the main concepts and key points."
        },
        {
          role: "user",
          content: `Summarize this content for a student. Return as JSON with format: {"title": "...", "summary": "...", "keyPoints": ["point1", "point2", ...]}\n\nContent:\n${content}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      title: result.title || "Summary",
      summary: result.summary || "",
      keyPoints: result.keyPoints || []
    };
  } catch (error) {
    throw new Error("Failed to summarize content: " + (error as Error).message);
  }
}

export async function generateMindMap(content: string): Promise<MindMapNode> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert at creating mind maps for educational content. Create a hierarchical mind map structure that organizes the content into logical branches and sub-topics."
        },
        {
          role: "user",
          content: `Create a mind map from this content. Return as JSON with nested structure: {"id": "root", "label": "Main Topic", "children": [{"id": "branch1", "label": "...", "children": [...]}]}\n\nContent:\n${content}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.mindMap || { id: "root", label: "Mind Map", children: [] };
  } catch (error) {
    throw new Error("Failed to generate mind map: " + (error as Error).message);
  }
}

export async function generateStudyPlan(goals: string[], targetDate: Date, currentLevel: string): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert study planner. Create personalized study plans with daily and weekly tasks based on student goals, timeline, and current level."
        },
        {
          role: "user",
          content: `Create a study plan with these details:
          Goals: ${goals.join(", ")}
          Target Date: ${targetDate.toDateString()}
          Current Level: ${currentLevel}
          
          Return as JSON with format: {"title": "...", "description": "...", "tasks": [{"title": "...", "description": "...", "dueDate": "...", "priority": "high|medium|low", "estimatedTime": "..."}]}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result;
  } catch (error) {
    throw new Error("Failed to generate study plan: " + (error as Error).message);
  }
}
