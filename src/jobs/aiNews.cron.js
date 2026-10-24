import cron from "node-cron";
import { fetchAndStoreNewsAutomatically } from "../services/aiNews.service.js";

export const startAINewsCron = () => {
  if (process.env.AI_NEWS_ENABLED !== "true") {
    console.log("[AI News Cron] Disabled via AI_NEWS_ENABLED env.");
    return;
  }

  cron.schedule("0 */3 * * *", async () => {
    console.log("[AI News Cron] Running 3-hour news fetch job...");
    try {
      await fetchAndStoreNewsAutomatically();
      console.log("[AI News Cron] Job finished.");
    } catch {
      console.error("[AI News Cron] Job failed.");
    }
  });

  console.log("[AI News Cron] Scheduled every 3 hours.");
};
