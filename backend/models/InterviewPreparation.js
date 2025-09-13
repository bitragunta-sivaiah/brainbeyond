import mongoose from "mongoose";

/**
 * @description Represents a comprehensive, multi-stage preparation plan for a specific job interview.
 * This model is structured to support an initial user setup followed by AI-driven content generation for learning, practice, and assessment.
 */
const interviewPreparationSchema = new mongoose.Schema(
  {
    // --- STAGE 1: CORE DETAILS & OWNERSHIP (User Input) ---
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "A title for your preparation plan is required."],
      trim: true,
      maxlength: 150,
      default: "My Interview Prep Plan",
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    target: {
      company: { type: String, required: true, trim: true },
      role: { type: String, required: true, trim: true },
      level: { type: String, trim: true, default: "Entry-level" },
      location: { type: String, trim: true },
    },
    startDate: { type: Date, default: Date.now },
    targetDate: { type: Date },
    generalNotes: [
      {
        content: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // --- STAGE 2: LEARNING & KNOWLEDGE ACQUISITION (AI-Generated & User-Managed) ---
    learning: {
      studyTopics: [
        {
          topic: { type: String, required: true, trim: true },
          category: {
            type: String,
            enum: [
              "data-structures",
              "algorithms",
              "system-design",
              "behavioral",
              "domain-knowledge",
              "company-values",
            ],
            required: true,
          },
          lastReviewed: Date,
          resources: [
            {
              title: String,
              url: String,
              type: {
                type: String,
                enum: ["article", "video", "course", "documentation", "book"],
              },
              userNotes: { type: String, maxlength: 500 },
            },
          ],
          priority: { type: Number, min: 1, max: 5, default: 3 },
        },
      ],
      preparedQuestions: [
        {
          question: { type: String, required: true, trim: true },
          answer: { type: String, trim: true },
          notes: { type: String, trim: true },
          category: {
            type: String,
            enum: [
              "behavioral",
              "technical",
              "situational",
              "company-specific",
              "general",
            ],
            required: true,
          },
          lastRevised: { type: Date, default: Date.now },
          timeSpentMinutes: { type: Number, default: 0 },
          keywords: [String],
        },
      ],
    },

    // --- STAGE 3: SKILL APPLICATION & PRACTICE (AI-Generated & User-Managed) ---
    practice: {
      practiceProblems: [
        {
          title: { type: String, required: true },
          url: { type: String, required: true },
          source: {
            type: String,
            enum: ["leetcode", "hackerrank", "codewars", "custom", "other"],
            default: "other",
          },
          difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
            required: true,
          },
          attempts: [
            {
              date: { type: Date, default: Date.now },
              timeTakenMinutes: Number,
              outcome: {
                type: String,
                enum: ["solved-optimal", "solved-suboptimal", "unsolved"],
              },
              solution: { code: String, language: String, notes: String },
            },
          ],
        },
      ],
      storyBank: [
        {
          prompt: { type: String, required: true },
          situation: { type: String, required: true },
          task: { type: String, required: true },
          action: { type: String, required: true },
          result: { type: String, required: true },
          keywords: [String],
        },
      ],
    },

    // --- STAGE 4: ASSESSMENT & FEEDBACK (AI-Powered) ---
    assessment: {
      aiMockInterviews: [
        {
          date: { type: Date, default: Date.now },
          type: {
            type: String,
            enum: [
              "behavioral",
              "technical-quiz",
              "coding-challenge",
              "system-design",
              "role-based",
              "resume-based",
            ],
            required: true,
          },
          resumeUrl: {
            type: String,
            required: function () {
              return this.type === "resume-based";
            },
          },
          focusArea: String,
          difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
            default: "medium",
          },
          interviewDurationSeconds: { type: Number },
          sessionRecordingUrl: String,
          transcript: [
            {
              speaker: { type: String, enum: ["ai", "user"], required: true },
              content: { type: String, required: true },
              timestamp: { type: Date, required: true },
            },
          ],
          aiFeedback: {
            overallScore: { type: Number, min: 0, max: 100 },
            performanceSummary: String,
            contentAnalysis: {
              clarity: {
                score: { type: Number, min: 0, max: 10 },
                feedback: String,
              },
              conciseness: {
                score: { type: Number, min: 0, max: 10 },
                feedback: String,
              },
              technicalAccuracy: {
                score: { type: Number, min: 0, max: 10 },
                feedback: String,
              },
              useOfKeywords: [String],
            },
            communicationAnalysis: {
              pacing: {
                type: String,
                enum: ["too-slow", "good", "too-fast"],
              },
              fillerWords: {
                count: { type: Number, default: 0 },
                words: [String],
              },
              confidenceLevel: {
                type: String,
                enum: ["low", "medium", "high"],
              },
            },
            suggestedAnswers: [{ question: String, suggestedAnswer: String }],
          },
        },
      ],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --- VIRTUAL PROPERTIES ---

interviewPreparationSchema.virtual("daysRemaining").get(function () {
  if (!this.targetDate) return null;
  const today = new Date();
  const target = new Date(this.targetDate);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  if (diffTime < 0) return 0;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

const InterviewPreparation = mongoose.model(
  "InterviewPreparation",
  interviewPreparationSchema
);

export default InterviewPreparation;