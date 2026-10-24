import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Course from "../models/courses.models.js";
import {
  AddInterviewQuestionsToTopic,
} from "../dbc/courses.dbc.js";

// ===============================
// GEMINI CONFIG
// ===============================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();

if (!GEMINI_API_KEY) {
  console.error("[AI Course] GEMINI_API_KEY is missing");
}

const genAI = GEMINI_API_KEY
  ? new GoogleGenerativeAI(GEMINI_API_KEY)
  : null;

// ===============================
// GENERATE INTERVIEW QUESTIONS
// ===============================

async function generateInterviewQuestionsWithGemini(topicTitle) {
  if (!genAI) {
    console.error("[AI Course] Gemini client not initialized");
    return [];
  }

  const prompt = `
You are a technical interview expert.

Generate exactly 5 unique interview questions for the topic: "${topicTitle}"

Return ONLY valid JSON array of strings.

Rules:
- Questions must be relevant to the topic
- Mix of easy, medium, and hard difficulty
- Questions should be practical and commonly asked in interviews
- Do NOT include explanations or answers
- Return ONLY JSON array

Example:
["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]
`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    });

    let result = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(
          `[AI Course] Gemini attempt ${attempt}/3 for topic: ${topicTitle}`
        );

        result = await model.generateContent(prompt);

        break;
      } catch (error) {
        console.error(
          `[AI Course] Gemini attempt ${attempt} failed:`,
          error.message
        );

        if (attempt === 3) {
          throw error;
        }

        const delay = attempt * 5000;

        console.log(
          `[AI Course] Retrying in ${delay / 1000}s...`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, delay)
        );
      }
    }

    if (!result) {
      console.error("[AI Course] Gemini did not return a result");
      return [];
    }

    const text = result.response.text().trim();

    if (!text) {
      console.error("[AI Course] Gemini returned empty response");
      return [];
    }

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\[[\s\S]*\]/);

      if (!jsonMatch) {
        console.error("[AI Course] Invalid Gemini JSON");
        return [];
      }

      parsed = JSON.parse(jsonMatch[0]);
    }

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.error("[AI Course] Gemini processing failed");
    return [];
  }
}

// ===============================
// MAIN FUNCTION
// ===============================

export const addInterviewQuestionsAutomatically = async () => {
  try {
    console.log("[AI Course] Starting automated interview questions job...");

    const courses = await Course.find();

    if (!courses.length) {
      console.log("[AI Course] No courses found");
      return {
        success: true,
        added: 0,
        message: "No courses found",
      };
    }

    let totalAdded = 0;
    const results = [];

    for (const course of courses) {
      console.log(`[AI Course] Processing course: ${course.courseName}`);

      for (let chapterIndex = 0; chapterIndex < course.chapters.length; chapterIndex++) {
        const chapter = course.chapters[chapterIndex];

        for (let topicIndex = 0; topicIndex < chapter.topics.length; topicIndex++) {
          const topic = chapter.topics[topicIndex];

          console.log(
            `[AI Course] Generating questions for topic: ${topic.title}`
          );

          const questions = await generateInterviewQuestionsWithGemini(topic.title);

          if (questions.length > 0) {
            try {
              await AddInterviewQuestionsToTopic(
                course._id.toString(),
                chapterIndex,
                topicIndex,
                questions
              );

              totalAdded += questions.length;

              results.push({
                course: course.courseName,
                chapter: chapter.title,
                topic: topic.title,
                questionsAdded: questions.length,
              });

              console.log(
                `[AI Course] Added ${questions.length} questions to ${topic.title}`
              );
            } catch (error) {
              console.error(
                `[AI Course] Failed to save questions for ${topic.title}:`,
                error.message
              );
            }
          }
        }
      }
    }

    console.log(
      `[AI Course] Job completed. Total questions added: ${totalAdded}`
    );

    return {
      success: true,
      added: totalAdded,
      results,
      message: `Added ${totalAdded} interview questions`,
    };
  } catch {
    console.error("[AI Course] Automated job failed");
    return {
      success: false,
      added: 0,
      message: "Automated course job failed",
    };
  }
};
