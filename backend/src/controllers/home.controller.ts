import { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import { cache } from "../lib/cache.ts";

// 1. Latest 4 templates
export const getLatestTemplates = async (_req: Request, res: Response) => {
  const cacheKey = "latest-templates";
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const results = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM template_search_view
      ORDER BY "createdAt" DESC
      LIMIT 4
    `);

    const response = results.map(formatTemplate);
    cache.set(cacheKey, response);
    res.json(response);
  } catch (err) {
    console.error("Failed to fetch latest templates", err);
    res.status(500).json({ error: "Error loading latest templates" });
  }
};

// 2. Most popular templates (by number of submissions)
export const getPopularTemplates = async (_req: Request, res: Response) => {
  const cacheKey = "popular-templates";
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const results = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM popular_templates_view
      LIMIT 4
    `);

    const response = results.map(formatTemplate);
    cache.set(cacheKey, response);
    res.json(response);
  } catch (err) {
    console.error("Failed to fetch popular templates", err);
    res.status(500).json({ error: "Error loading popular templates" });
  }
};

// 3. Tag cloud with template IDs
export const getTagCloud = async (_req: Request, res: Response) => {
  const cacheKey = "tag-cloud";
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const results = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        t.id AS "tagId",
        t.name AS "tagName",
        ARRAY_AGG(tt."templateId") AS "templateIds"
      FROM "Tag" t
      JOIN "TemplateTag" tt ON tt."tagId" = t.id
      GROUP BY t.id, t.name
    `);

    cache.set(cacheKey, results);
    res.json(results);
  } catch (err) {
    console.error("Failed to fetch tag cloud", err);
    res.status(500).json({ error: "Error loading tag cloud" });
  }
};

// 4. All topics with template counts
export const getTopTopics = async (_req: Request, res: Response) => {
  const cacheKey = "top-topics";
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const results = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        tp.id AS "topicId",
        tp.name AS "topicName",
        COUNT(t.id) AS "templateCount"
      FROM "Topic" tp
      LEFT JOIN "Template" t ON t."topicId" = tp.id
      GROUP BY tp.id, tp.name
      ORDER BY COUNT(t.id) DESC
    `);

    cache.set(cacheKey, results);
    res.json(results);
  } catch (err) {
    console.error("Failed to fetch top topics", err);
    res.status(500).json({ error: "Error loading top topics" });
  }
};

// 🧹 Helper to format template result (from both views)
const formatTemplate = (t: any) => ({
  id: Number(t.id),
  title: t.title,
  description: t.description,
  imageUrl: t.imageUrl,
  isPublic: t.isPublic,
  isPublished: t.isPublished,
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
  user: {
    ...t.user,
    id: Number(t.user.id),
  },
  topic: {
    ...t.topic,
    id: Number(t.topic.id),
  },
  tags: (t.tags || []).map((tag: any) => ({
    ...tag,
    id: Number(tag.id),
    usageCount: Number(tag.usageCount),
  })),
  questionCount: Number(t.questionsCount),
  commentCount: Number(t.commentsCount),
  likesCount: Number(t.likesCount),
  peopleLiked: t.peopleLiked || [],
});

// Cache invalidation strategy: every 5 minutes
setInterval(() => {
  cache.del("latest-templates");
  cache.del("popular-templates");
  cache.del("tag-cloud");
  cache.del("top-topics");
}, 5 * 60 * 1000); // 5 minutes
