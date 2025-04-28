import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const searchTemplates = async (req: Request, res: Response) => {
  const searchText = (req.query.q || req.query.query) as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  if (!searchText) {
    return res.status(400).json({ error: "Missing search text" });
  }

  try {
    // Step 1: Search in materialized view using `to_tsvector`
    const matchedTemplates: { id: number }[] = await prisma.$queryRawUnsafe(
      `
      SELECT id FROM template_search_joined_view
      WHERE
        to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' ||
          coalesce((
            SELECT string_agg(q.description, ' ') FROM "Question" q WHERE q."templateId" = template_search_joined_view.id
          ), '') || ' ' ||
          coalesce((
            SELECT string_agg(tag.name, ' ') FROM "TemplateTag" tt JOIN "Tag" tag ON tag.id = tt."tagId"
            WHERE tt."templateId" = template_search_joined_view.id
          ), '') || ' ' ||
          coalesce((
            SELECT string_agg(c.content, ' ') FROM "Comment" c WHERE c."templateId" = template_search_joined_view.id
          ), '')
        ) @@ plainto_tsquery('english', $1)
      LIMIT $2 OFFSET $3;
    `,
      searchText,
      limit,
      offset
    );

    const templateIds = matchedTemplates.map((t) => t.id);

    if (templateIds.length === 0) {
      return res.json({ templates: [], totalPages: 0, hasNextPage: false, totalCount: 0 });
    }

    // Step 2: Get enriched templates by ID
    const templates = await prisma.template.findMany({
      where: { id: { in: templateIds } },
      include: {
        user: { select: { id: true, clerkId: true, name: true, email: true } },
        topic: true,
        tags: { include: { tag: true } },
        _count: { select: { questions: true, comments: true, likes: true } },
        likes: {
          include: {
            user: { select: { clerkId: true } },
          },
        },
      },
    });

    // Step 3: Format result
    const formattedTemplates = templates.map((template) => {
      const { likes, ...templateData } = template;

      return {
        ...templateData,
        tags: template.tags.map((t) => t.tag),
        questionCount: template._count.questions,
        commentCount: template._count.comments,
        likesCount: template._count.likes,
        peopleLiked: likes.map((like) => like.user.clerkId),
      };
    });

    // Step 4: Count total results
    const totalCountResult: { count: bigint }[] = await prisma.$queryRawUnsafe(
      `
      SELECT COUNT(*)::bigint as count FROM template_search_joined_view
      WHERE
        to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' ||
          coalesce((
            SELECT string_agg(q.description, ' ') FROM "Question" q WHERE q."templateId" = template_search_joined_view.id
          ), '') || ' ' ||
          coalesce((
            SELECT string_agg(tag.name, ' ') FROM "TemplateTag" tt JOIN "Tag" tag ON tag.id = tt."tagId"
            WHERE tt."templateId" = template_search_joined_view.id
          ), '') || ' ' ||
          coalesce((
            SELECT string_agg(c.content, ' ') FROM "Comment" c WHERE c."templateId" = template_search_joined_view.id
          ), '')
        ) @@ plainto_tsquery('english', $1)
    `,
      searchText
    );

    const totalCount = Number(totalCountResult[0]?.count || 0);

    res.json({
      templates: formattedTemplates,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page * limit < totalCount,
      totalCount,
    });
  } catch (error) {
    console.error("Search error (view):", error);
    res.status(500).json({ error: "Search failed" });
  }
};

// export const searchTemplates = async (req: Request, res: Response) => {
//   try {
//     const { query } = req.query;

//     if (!query || typeof query !== "string") {
//       return res.status(400).json({ error: "Search query required" });
//     }

//     const templates = await prisma.template.findMany({
//       where: {
//         OR: [{ title: { search: query } }, { description: { search: query } }, { questions: { some: { title: { search: query } } } }, { questions: { some: { description: { search: query } } } }, { tags: { some: { tag: { name: { search: query } } } } }],
//         isPublic: true,
//       },
//       include: {
//         user: { select: { name: true } },
//         topic: true,
//         tags: { include: { tag: true } },
//         _count: { select: { forms: true } },
//       },
//     });

//     res.json(templates);
//   } catch (error) {
//     console.error("Search error:", error);
//     res.status(500).json({ error: "Search failed" });
//   }
// };
