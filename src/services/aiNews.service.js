import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AddNews } from "../dbc/news.dbc.js";
import { uploadToCloudinary, deleteFile } from "../utils/fileUpload.js";
import fs from "fs/promises";
import path from "path";
import os from "os";
import News from "../models/news.models.js";

// ===============================
// GEMINI CONFIG
// ===============================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();

if (!GEMINI_API_KEY) {
  console.error("[AI News] GEMINI_API_KEY is missing");
}

const genAI = GEMINI_API_KEY
  ? new GoogleGenerativeAI(GEMINI_API_KEY)
  : null;


// ===============================
// RSS FEEDS
// ===============================

const RSS_FEEDS = [
  "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en",
  "https://feeds.bbci.co.uk/news/world/rss.xml",
  "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
];


// ===============================
// PARSE RSS
// ===============================

function parseRSSItems(xml) {
  const items = [];

  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;

  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];

    const getTag = (tag) => {
      const regex = new RegExp(
        `<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,
        "i"
      );

      const result = item.match(regex);

      if (!result) return "";

      return result[1]
        .replace(/<!\[CDATA\[|\]\]>/g, "")
        .replace(/<[^>]+>/g, "")
        .trim();
    };

    const title = getTag("title");
    const link = getTag("link");
    const description = getTag("description");
    const pubDate = getTag("pubDate");

    let image = "";

    const mediaContent = item.match(
      /<media:content[^>]*url=["']([^"']+)["']/i
    );

    const mediaThumbnail = item.match(
      /<media:thumbnail[^>]*url=["']([^"']+)["']/i
    );

    const enclosure = item.match(
      /<enclosure[^>]*url=["']([^"']+)["']/i
    );

    if (mediaContent) {
      image = mediaContent[1];
    } else if (mediaThumbnail) {
      image = mediaThumbnail[1];
    } else if (enclosure) {
      image = enclosure[1];
    }

    let source = "";

    try {
      if (link) {
        source = new URL(link).hostname.replace(
          /^www\./,
          ""
        );
      }
    } catch { }

    if (title && link) {
      items.push({
        title,
        link,
        description,
        pubDate,
        image,
        source,
      });
    }
  }

  return items;
}


// ===============================
// FETCH RSS NEWS
// ===============================

async function searchNewsFromRSS() {
  const results = [];

  for (const feedUrl of RSS_FEEDS) {
    try {
      const response = await fetch(feedUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 AI-News-Bot",
        },
      });

      if (!response.ok) {
        console.log(
          `[AI News] RSS failed: ${response.status}`
        );
        continue;
      }

      const xml = await response.text();

      const items = parseRSSItems(xml);

      results.push(...items);
    } catch (error) {
      console.error(
        "[AI News] RSS error:",
        error.message
      );
    }
  }

  return results.slice(0, 20);
}


// ===============================
// GEMINI STRUCTURE NEWS
// ===============================

async function structureNewsWithGemini(rawResults) {
  if (!genAI) {
    console.error(
      "[AI News] Gemini client not initialized"
    );

    return [];
  }

  if (!rawResults.length) {
    return [];
  }

  const prompt = `
You are a professional news editor.

From the following RSS news items, select up to 3 latest useful news.

Return ONLY valid JSON array.

Each item must have:

{
  "title": "string",
  "shortDescription": "string",
  "content": "string",
  "category": "string",
  "tags": ["string"],
  "sourceName": "string",
  "sourceUrl": "string",
  "imageUrl": "string"
}

Rules:

- Do not create fake information.
- Keep the original meaning.
- content should contain 2-3 paragraphs.
- category must be one of:
  technology, sports, politics, business,
  entertainment, world, science, health,
  education, other
- tags should contain 3-5 values.
- Use the original article URL.
- Use the available RSS image URL.
- If image is unavailable, imageUrl should be empty.
- Do not repeat the same news.
- Return ONLY JSON.

RSS NEWS:

${JSON.stringify(rawResults)}
`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    let result = null;

    // ===============================
    // GEMINI RETRY
    // ===============================

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(
          `[AI News] Gemini attempt ${attempt}/3`
        );

        result = await model.generateContent(prompt);

        break;
      } catch (error) {
        console.error(
          `[AI News] Gemini attempt ${attempt} failed:`,
          error.message
        );

        if (attempt === 3) {
          throw error;
        }

        const delay = attempt * 5000;

        console.log(
          `[AI News] Retrying in ${delay / 1000}s...`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, delay)
        );
      }
    }

    if (!result) {
      console.error(
        "[AI News] Gemini did not return a result"
      );

      return [];
    }

    const text = result.response.text().trim();

    console.log(
      "[AI News] Gemini response received"
    );

    if (!text) {
      console.error(
        "[AI News] Gemini returned empty response"
      );

      return [];
    }

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(
        /\[[\s\S]*\]/
      );

      if (!jsonMatch) {
        console.error(
          "[AI News] Invalid Gemini JSON"
        );

        return [];
      }

      parsed = JSON.parse(jsonMatch[0]);
    }

    console.log(
      `[AI News] Gemini returned ${Array.isArray(parsed)
        ? parsed.length
        : 0
      } news`
    );

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch (error) {
    console.error(
      "[AI News] Gemini error:",
      error.message
    );

    return [];
  }
}

// ===============================
// DOWNLOAD IMAGE
// ===============================

async function downloadImage(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Image download failed: ${response.status}`
    );
  }

  const buffer = Buffer.from(
    await response.arrayBuffer()
  );

  const filePath = path.join(
    os.tmpdir(),
    `news-${Date.now()}.jpg`
  );

  await fs.writeFile(filePath, buffer);

  return filePath;
}


// ===============================
// CLOUDINARY UPLOAD
// ===============================

async function uploadNewsImage(imageUrl) {
  if (!imageUrl) {
    return null;
  }

  let filePath = null;

  try {
    filePath = await downloadImage(imageUrl);

    const result = await uploadToCloudinary(
      filePath,
      "news-images"
    );

    return (
      result?.secure_url ||
      result?.url ||
      null
    );
  } catch (error) {
    console.error(
      "[AI News] Image upload error:",
      error.message
    );

    return null;
  } finally {
    if (filePath) {
      try {
        await deleteFile(filePath);
      } catch { }
    }
  }
}


// ===============================
// DUPLICATE CHECK
// ===============================

async function isDuplicate(title) {
  const existing = await News.findOne({
    title: {
      $regex: `^${title.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      )}$`,
      $options: "i",
    },
  });

  return !!existing;
}


// ===============================
// MAIN FUNCTION
// ===============================

export const fetchAndStoreNewsAutomatically =
  async () => {
    try {
      console.log(
        "[AI News] Starting automated news fetch..."
      );

      console.log(
        "[AI News] Gemini API key:",
        GEMINI_API_KEY
          ? `${GEMINI_API_KEY.slice(0, 8)}...`
          : "NOT FOUND"
      );

      // 1. RSS
      const rawResults =
        await searchNewsFromRSS();

      console.log(
        `[AI News] RSS results: ${rawResults.length}`
      );

      if (!rawResults.length) {
        return {
          success: true,
          added: 0,
          message: "No news found",
        };
      }

      // 2. Gemini
      const structuredNews =
        await structureNewsWithGemini(
          rawResults
        );

      if (!structuredNews.length) {
        console.log(
          "[AI News] No structured news from Gemini."
        );

        return {
          success: false,
          added: 0,
          message:
            "No structured news from Gemini",
        };
      }

      let addedCount = 0;

      // 3. Save news
      for (const item of structuredNews) {
        try {
          if (
            await isDuplicate(
              item.title
            )
          ) {
            console.log(
              `[AI News] Duplicate: ${item.title}`
            );

            continue;
          }

          // 4. Upload image
          const image =
            await uploadNewsImage(
              item.imageUrl
            );

          // 5. Prepare MongoDB data
          const newsData = {
            title: item.title,

            slug: item.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, ""),

            shortDescription:
              item.shortDescription,

            content: item.content,

            category: item.category,

            tags: Array.isArray(item.tags)
              ? item.tags
              : [],

            images: image ? [image] : [],

            author: {
              name:
                process.env
                  .AI_NEWS_AUTHOR_NAME ||
                "AI Auto Editor",

              profileImage:
                process.env
                  .AI_NEWS_AUTHOR_IMAGE ||
                "",
            },

            source: {
              name:
                item.sourceName || "",

              url:
                item.sourceUrl || "",
            },

            isPublished: true,

            publishedAt: new Date(),
          };

          await AddNews(newsData);

          addedCount++;

          console.log(
            `[AI News] Added: ${item.title}${image ? "" : " (no image)"}`
          );
        } catch (error) {
          console.error(
            "[AI News] Save error:",
            error.message
          );
        }
      }

      console.log(
        `[AI News] Job completed. Added: ${addedCount}`
      );

      return {
        success: true,
        added: addedCount,
        message: `Added ${addedCount} news items`,
      };
    } catch (error) {
      console.error(
        "[AI News] Main error:",
        error.message
      );

      return {
        success: false,
        added: 0,
        error: error.message,
      };
    }
  };