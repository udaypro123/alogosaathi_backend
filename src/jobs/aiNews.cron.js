import cron from "node-cron";
import { fetchAndStoreNewsAutomatically } from "../services/aiNews.service.js";

export const startAINewsCron = () => {
  if (process.env.AI_NEWS_ENABLED !== "true") {
    console.log("[AI News Cron] Disabled via AI_NEWS_ENABLED env.");
    return;
  }

  cron.schedule("*/15 * * * *", async () => {
    console.log("[AI News Cron] Running 5-minute news fetch job...");
    try {
      const result = await fetchAndStoreNewsAutomatically();
      console.log("[AI News Cron] Job finished:", result);
    } catch (error) {
      console.error("[AI News Cron] Job failed:", error.message);
    }
  });

  console.log("[AI News Cron] Scheduled every 30 minutes.");
};
