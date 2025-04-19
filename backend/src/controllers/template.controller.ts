import { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import { cache } from "../lib/cache.ts";

// getAllTemplates with caching
export const getAllTemplates = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as string) || "desc";
    const titleFilter = req.query.title as string | undefined;
    const topicId = req.query.topicId ? parseInt(req.query.topicId as string) : undefined;
    const isPublic = req.query.isPublic === "true" ? true : req.query.isPublic === "false" ? false : undefined;
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    const isPublished = req.query.isPublished === "true" ? true : req.query.isPublished === "false" ? false : undefined;
    const tagName = req.query.tag as string | undefined;

    const where = {
      ...(titleFilter && { title: { contains: titleFilter, mode: "insensitive" as const } }),
      ...(topicId && { topicId }),
      ...(isPublic !== undefined && { isPublic }),
      ...(userId && { userId }),
      ...(isPublished !== undefined && { isPublished }),
      ...(tagName && {
        tags: {
          some: {
            tag: {
              name: { contains: tagName, mode: "insensitive" as const },
            },
          },
        },
      }),
    };

    const cacheKey = `templates:${page}:${limit}:${sortBy}:${sortOrder}:${JSON.stringify(where)}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const templates = await prisma.template.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, clerkId: true, name: true, email: true } },
        topic: true,
        tags: { include: { tag: true } },
        _count: { select: { questions: true, comments: true, likes: true } },
        likes: {
          include: {
            user: {
              select: {
                clerkId: true,
              },
            },
          },
        },
      },
    });

    const formattedTemplates = templates.map((template) => {
      const { likes, ...templateData } = template;

      return {
        ...templateData,
        tags: template.tags.map((t) => t.tag),
        questionCount: template._count.questions,
        commentCount: template._count.comments,
        likesCount: template._count.likes,
        peopleLiked: template.likes.map((like) => like.user.clerkId),
      };
    });

    const totalCount = await prisma.template.count({ where });

    const responseData = {
      templates: formattedTemplates,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page * limit < totalCount,
      totalCount,
    };

    cache.set(cacheKey, responseData); // Store in cache
    res.json(responseData);
  } catch (err) {
    console.error("Error fetching templates:", err);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
};

export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const templateId = parseInt(req.params.id);

    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: {
        user: { select: { id: true, name: true, email: true, clerkId: true } },
        topic: true,
        tags: { include: { tag: true } },
        accesses: {
          include: {
            user: { select: { id: true, name: true, email: true, clerkId: true } },
          },
        },
        _count: {
          select: { likes: true, comments: true },
        },
        likes: {
          include: {
            user: {
              select: {
                clerkId: true,
              },
            },
          },
        },
        questions: {
          select: {
            id: true,
            title: true,
            description: true,
            questionType: true,
            position: true,
            showInTable: true,
            options: true,
            correctAnswers: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    const { likes, ...templateData } = template;
    const formattedTemplate = {
      ...templateData,
      tags: template.tags.map((t) => t.tag),
      accessUsers: template.accesses.map((a) => a.user),
      peopleLiked: template.likes.map((like) => like.user.clerkId),
    };

    res.json(formattedTemplate);
  } catch (err) {
    console.error("Error fetching template:", err);
    res.status(500).json({ error: "Failed to fetch template" });
  }
};

export const createTemplate = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  try {
    const { title, description, topicId, isPublic, isPublished, imageUrl, tags, accessUsers, questions } = req.body;
    const userId = req.user.id;
    if (!userId || !req.user.isAdmin) {
      return res.status(403).json({ error: "Not Authorized" });
    }

    const createdTemplate = await prisma.$transaction(async (prisma) => {
      const template = await prisma.template.create({
        data: {
          title,
          description,
          userId: parseInt(userId, 10),
          topicId: parseInt(topicId),
          isPublic: isPublic ?? true,
          isPublished: isPublished ?? false,
          imageUrl: imageUrl || null,
        },
      });

      if (tags?.length) {
        await Promise.all(
          tags.map(async (tagName: string) => {
            const tag = await prisma.tag.upsert({
              where: { name: tagName },
              update: { usageCount: { increment: 1 } },
              create: { name: tagName, usageCount: 1 },
            });
            return prisma.templateTag.create({
              data: { templateId: template.id, tagId: tag.id },
            });
          })
        );
      }

      if (!isPublic && accessUsers?.length) {
        await Promise.all(
          accessUsers.map((uid: number) =>
            prisma.templateAccess.create({
              data: { templateId: template.id, userId: uid },
            })
          )
        );
      }

      if (questions?.length) {
        await Promise.all(
          questions.map((q: any, index: number) =>
            prisma.question.create({
              data: {
                templateId: template.id,
                title: q.title,
                description: q.description || "",
                questionType: q.questionType,
                position: q.position ?? index,
                showInTable: q.showInTable ?? false,
                options: q.options || null,
                correctAnswers: q.correctAnswers || null,
              },
            })
          )
        );
      }

      return template;
    });

    const fullTemplate = await prisma.template.findUnique({
      where: { id: createdTemplate.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        topic: true,
        questions: true,
        tags: { include: { tag: true } },
        accesses: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    const formattedTemplate = {
      ...fullTemplate,
      tags: fullTemplate?.tags.map((t) => t.tag),
      accessUsers: fullTemplate?.accesses.map((a) => a.user),
    };

    res.status(201).json(formattedTemplate);
    cache.flushAll(); // Clear cache after creating a new template
  } catch (err) {
    console.error("Error creating template:", err);
    res.status(500).json({ error: "Failed to create template" });
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  try {
    const templateId = parseInt(req.params.id);
    const userId = req.user.id;
    const { title, description, topicId, isPublic, isPublished, imageUrl, tags = [], accessUsers = [], questions = [] } = req.body;

    // Verify template exists and user has permission
    const existingTemplate = await prisma.template.findUnique({
      where: { id: templateId },
      include: {
        tags: { include: { tag: true } },
        accesses: true,
        questions: true,
      },
    });

    if (!existingTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }

    if (existingTemplate.userId !== parseInt(userId) && !req.user.isAdmin) {
      return res.status(403).json({ error: "Not authorized to update this template" });
    }

    const updatedTemplate = await prisma.$transaction(async (prisma) => {
      // Update template basic info
      const template = await prisma.template.update({
        where: { id: templateId },
        data: {
          title,
          description,
          topicId: parseInt(topicId),
          isPublic,
          isPublished,
          imageUrl: imageUrl || null,
          updatedAt: new Date(),
        },
      });

      // Handle tags update
      const existingTagNames = existingTemplate.tags.map((t) => t.tag.name);
      const tagsToRemove = existingTemplate.tags.filter((t) => !tags.includes(t.tag.name)).map((t) => t.tag.id);
      const tagsToAdd = tags.filter((t: string) => !existingTagNames.includes(t));

      // Remove unused tags
      if (tagsToRemove.length > 0) {
        await prisma.templateTag.deleteMany({
          where: {
            templateId,
            tagId: { in: tagsToRemove },
          },
        });

        // Decrement usage count for removed tags
        await prisma.tag.updateMany({
          where: { id: { in: tagsToRemove } },
          data: { usageCount: { decrement: 1 } },
        });
      }

      // Add new tags
      for (const tagName of tagsToAdd) {
        const tag = await prisma.tag.upsert({
          where: { name: tagName },
          update: { usageCount: { increment: 1 } },
          create: { name: tagName, usageCount: 1 },
        });
        await prisma.templateTag.create({
          data: { templateId, tagId: tag.id },
        });
      }

      // Handle access control
      if (!isPublic) {
        const existingAccessUserIds = existingTemplate.accesses.map((a) => a.userId);
        const usersToRemove = existingTemplate.accesses.filter((a) => !accessUsers.includes(a.userId)).map((a) => a.userId);
        const usersToAdd = accessUsers.filter((id: number) => !existingAccessUserIds.includes(id));

        if (usersToRemove.length > 0) {
          await prisma.templateAccess.deleteMany({
            where: {
              templateId,
              userId: { in: usersToRemove },
            },
          });
        }

        if (usersToAdd.length > 0) {
          await prisma.templateAccess.createMany({
            data: usersToAdd.map((userId: number) => ({
              templateId,
              userId,
            })),
            skipDuplicates: true,
          });
        }
      } else {
        // If template is now public, remove all access records
        await prisma.templateAccess.deleteMany({ where: { templateId } });
      }

      // Handle questions update
      const existingQuestionIds = existingTemplate.questions.map((q) => q.id);
      const incomingQuestionIds = questions.filter((q: any) => q.id).map((q: any) => q.id);

      // Questions to delete
      const questionsToDelete = existingQuestionIds.filter((id) => !incomingQuestionIds.includes(id));

      if (questionsToDelete.length > 0) {
        await prisma.question.deleteMany({
          where: {
            id: { in: questionsToDelete },
          },
        });
      }

      // Update or create questions
      for (const question of questions) {
        if (question.id) {
          // Update existing question
          await prisma.question.update({
            where: { id: question.id },
            data: {
              title: question.title,
              description: question.description || "",
              questionType: question.questionType,
              position: question.position,
              showInTable: question.showInTable ?? false,
              options: question.options || null,
              correctAnswers: question.correctAnswers || null,
              updatedAt: new Date(),
            },
          });
        } else {
          // Create new question
          await prisma.question.create({
            data: {
              templateId,
              title: question.title,
              description: question.description || "",
              questionType: question.questionType,
              position: question.position,
              showInTable: question.showInTable ?? false,
              options: question.options || null,
              correctAnswers: question.correctAnswers || null,
            },
          });
        }
      }

      return template;
    });

    // Fetch the complete updated template with relations
    const fullTemplate = await prisma.template.findUnique({
      where: { id: templateId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        topic: true,
        questions: { orderBy: { position: "asc" } },
        tags: { include: { tag: true } },
        accesses: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    // Format the response
    const response = {
      ...fullTemplate,
      tags: fullTemplate?.tags.map((t) => t.tag),
      accessUsers: fullTemplate?.accesses.map((a) => a.user),
    };

    res.json(response);
    cache.flushAll(); // Clear cache after updating a template
  } catch (err) {
    console.error("Error updating template:", err);
    res.status(500).json({ error: "Failed to update template" });
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const templateId = parseInt(req.params.id);
    const userId = req.user?.id;

    const existingTemplate = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!existingTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }

    const isOwner = existingTemplate.userId === parseInt(userId as string, 10);
    const isAdmin = req.user?.isAdmin;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Not authorized to delete this template" });
    }

    await prisma.template.delete({
      where: { id: templateId },
    });

    res.json({ message: "Template deleted successfully" });
    cache.flushAll(); // Clear cache after deleting a template
  } catch (err) {
    console.error("Error deleting template:", err);
    res.status(500).json({ error: "Failed to delete template" });
  }
};

export const searchTemplates = async (req: Request, res: Response) => {
  const searchText = req.query.q as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  if (!searchText) {
    return res.status(400).json({ error: "Missing search text" });
  }

  try {
    // Step 1: Get matched template IDs via full-text search
    const matchedTemplates: { id: number }[] = await prisma.$queryRaw`
      SELECT DISTINCT t.id
      FROM "Template" t
      LEFT JOIN "Question" q ON q."templateId" = t.id
      LEFT JOIN "_TemplateToTag" tt ON tt."A" = t.id
      LEFT JOIN "Tag" tag ON tag.id = tt."B"
      LEFT JOIN "Comment" c ON c."templateId" = t.id
      WHERE
        to_tsvector('english', coalesce(t.title, '') || ' ' || coalesce(t.description, ''))
        || to_tsvector('english', coalesce(q.description, ''))
        || to_tsvector('english', coalesce(tag.name, ''))
        || to_tsvector('english', coalesce(c.content, ''))
        @@ plainto_tsquery('english', ${searchText})
      LIMIT ${limit} OFFSET ${offset};
    `;

    const templateIds = matchedTemplates.map((t) => t.id);

    if (templateIds.length === 0) {
      return res.json({ templates: [], totalPages: 0, hasNextPage: false, totalCount: 0 });
    }

    // Step 2: Get enriched data like getAllTemplates
    const templates = await prisma.template.findMany({
      where: { id: { in: templateIds } },
      include: {
        user: { select: { id: true, clerkId: true, name: true, email: true } },
        topic: true,
        tags: { include: { tag: true } },
        _count: { select: { questions: true, comments: true, likes: true } },
        likes: {
          include: {
            user: {
              select: {
                clerkId: true,
              },
            },
          },
        },
      },
    });

    // Step 3: Format like getAllTemplates
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

    // Optional: Total count for pagination
    const totalCountResult: { count: number }[] = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT t.id) AS count
      FROM "Template" t
      LEFT JOIN "Question" q ON q."templateId" = t.id
      LEFT JOIN "_TemplateToTag" tt ON tt."A" = t.id
      LEFT JOIN "Tag" tag ON tag.id = tt."B"
      LEFT JOIN "Comment" c ON c."templateId" = t.id
      WHERE
        to_tsvector('english', coalesce(t.title, '') || ' ' || coalesce(t.description, ''))
        || to_tsvector('english', coalesce(q.description, ''))
        || to_tsvector('english', coalesce(tag.name, ''))
        || to_tsvector('english', coalesce(c.content, ''))
        @@ plainto_tsquery('english', ${searchText});
    `;

    const totalCount = totalCountResult[0]?.count || 0;

    res.json({
      templates: formattedTemplates,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page * limit < totalCount,
      totalCount,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
};

/*
export const getAllTemplates = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as string) || "desc";
    const titleFilter = req.query.title as string | undefined;
    const topicId = req.query.topicId ? parseInt(req.query.topicId as string) : undefined;
    const isPublic = req.query.isPublic === "true" ? true : req.query.isPublic === "false" ? false : undefined;
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    const isPublished = req.query.isPublished === "true" ? true : req.query.isPublished === "false" ? false : undefined;
    const tagName = req.query.tag as string | undefined;

    const where = {
      ...(titleFilter && { title: { contains: titleFilter, mode: "insensitive" as const } }),
      ...(topicId && { topicId }),
      ...(isPublic !== undefined && { isPublic }),
      ...(userId && { userId }),
      ...(isPublished !== undefined && { isPublished }),
      ...(tagName && {
        tags: {
          some: {
            tag: {
              name: { contains: tagName, mode: "insensitive" as const },
            },
          },
        },
      }),
    };

    const templates = await prisma.template.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        isPublic: true,
        isPublished: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, clerkId: true } },

        topic: { select: { id: true, name: true } },
        tags: { select: { tag: { select: { name: true } } } },
        _count: { select: { questions: true, comments: true, likes: true } },
        likes: { select: { user: { select: { clerkId: true } } } },
      },
      // include: {
      //   user: { select: { id: true, clerkId: true, name: true, email: true } },
      //   topic: true,
      //   tags: { include: { tag: true } },
      //   _count: { select: { questions: true, comments: true, likes: true } },
      //   likes: {
      //     include: {
      //       user: {
      //         select: {
      //           clerkId: true,
      //         },
      //       },
      //     },
      //   },
      // },
    });

    const formattedTemplates = templates.map((template) => {
      // Destructure to remove the likes array we don't want in the response
      const { likes, ...templateData } = template;

      return {
        ...templateData,
        tags: template.tags.map((t) => t.tag),
        questionCount: template._count.questions,
        commentCount: template._count.comments,
        likesCount: template._count.likes,
        peopleLiked: template.likes.map((like) => like.user.clerkId),
      };
    });

    const totalCount = await prisma.template.count({ where });

    res.json({
      templates: formattedTemplates,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page * limit < totalCount,
      totalCount,
    });
  } catch (err) {
    console.error("Error fetching templates:", err);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
};

*/
