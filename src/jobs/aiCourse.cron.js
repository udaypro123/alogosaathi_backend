import cron from "node-cron";
import { addInterviewQuestionsAutomatically } from "../services/aiCourse.service.js";

export const startAICourseCron = () => {
  if (process.env.AI_COURSE_ENABLED !== "true") {
    console.log("[AI Course Cron] Disabled via AI_COURSE_ENABLED env.");
    return;
  }

  cron.schedule("0 0 * * *", async () => {
    console.log("[AI Course Cron] Running daily interview questions job...");
    try {
      const result = await addInterviewQuestionsAutomatically();
      console.log("[AI Course Cron] Job finished:", result);
    } catch (error) {
      console.error("[AI Course Cron] Job failed:", error.message);
    }
  });

  console.log("[AI Course Cron] Scheduled every 24 hours.");
};
