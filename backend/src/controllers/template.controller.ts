import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { cache } from "../lib/cache";
import { refreshEvents } from "../lib/refresh";

export const getAllTemplates = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    let sortBy = (req.query.sortBy as string) || "createdAt";
    let sortOrder = (req.query.sortOrder as string) || "desc";
    const allowedSortFields = ["createdAt", "title", "updatedAt"];
    const allowedSortOrder = ["asc", "desc"];

    if (!allowedSortFields.includes(sortBy)) sortBy = "createdAt";
    if (!allowedSortOrder.includes(sortOrder)) sortOrder = "desc";

    const titleFilter = req.query.title as string | undefined;
    const topicId = req.query.topicId ? parseInt(req.query.topicId as string) : undefined;
    const isPublic = req.query.isPublic === "true" ? true : req.query.isPublic === "false" ? false : undefined;
    // const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    const isPublished = req.query.isPublished === "true" ? true : req.query.isPublished === "false" ? false : undefined;
    const tagName = req.query.tag as string | undefined;

    const filters: string[] = [];
    if (titleFilter) filters.push(`LOWER(t.title) LIKE LOWER('%${titleFilter}%')`);
    if (topicId) filters.push(`t."topic"->>'id' = '${topicId}'`);
    if (userId) filters.push(`t."user"->>'id' = '${userId}'`);
    if (isPublic !== undefined) filters.push(`t."isPublic" = ${isPublic}`);
    if (isPublished !== undefined) filters.push(`t."isPublished" = ${isPublished}`);
    if (tagName) filters.push(`EXISTS (SELECT 1 FROM jsonb_array_elements(t."tags") tag WHERE LOWER(tag->>'name') LIKE LOWER('%${tagName}%'))`);

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

    const filterParams = {
      titleFilter,
      topicId,
      userId: isAdmin ? undefined : userId,
      isPublic,
      isPublished,
      tagName,
    };
    const cacheKey = `joined-view:${page}:${limit}:${sortBy}:${sortOrder}:${userId}:${JSON.stringify(filterParams)}`;

    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(typeof cached === "string" ? JSON.parse(cached) : cached);
    }

    // if isAdmin, fetch all templates
    // if not, fetch only  templates created by the user

    let templates: any[] = [];
    if (isAdmin) {
      templates = await prisma.$queryRawUnsafe<any[]>(`
        SELECT * FROM template_search_view t
        ORDER BY t."${sortBy}" ${sortOrder}
        LIMIT ${limit} OFFSET ${offset}
      `);
    } else {
      templates = await prisma.$queryRawUnsafe<any[]>(`
        SELECT * FROM template_search_view t
        ${whereClause}
        AND t."user"->>'id' = '${userId}'
        ORDER BY t."${sortBy}" ${sortOrder}
        LIMIT ${limit} OFFSET ${offset}
      `);
    }

    const countResult = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*) FROM template_search_view t
      ${whereClause}
    `);

    const totalCount = Number(countResult[0].count || 0);

    const formattedTemplates = templates.map((t) => ({
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
    }));

    const responseData = {
      templates: formattedTemplates,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page * limit < totalCount,
      totalCount,
    };

    cache.set(cacheKey, JSON.stringify(responseData), 60 * 5); // Cache for 5 minutes
    // console.log("Templates fetched from view:", responseData);

    res.json(responseData);
  } catch (err) {
    console.error("Error fetching templates from view:", err);
    res.status(500).json({ message: "Failed to fetch templates from view" });
  }
};

export const getTemplateById = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin;

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

    // if not isAdmin and template.user.clerkId !== userId, then reutrn 403
    if (!isAdmin && template?.user.id !== Number(userId)) {
      return res.status(403).json({ message: "Not authorized to access this template" });
    }
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
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
    res.status(500).json({ message: "Failed to fetch template" });
  }
};

export const createTemplate = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  // console.log("Creating template by: ", req.user);

  try {
    const { title, description, topicId, isPublic, isPublished, imageUrl, tags, accessUsers, questions } = req.body;
    const userId = req.user.id;

    if (!userId && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not Authorized" });
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
    refreshEvents.emit("refreshView");
  } catch (err) {
    console.error("Error creating template:", err);
    res.status(500).json({ message: "Failed to create template" });
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
      return res.status(404).json({ message: "Template not found" });
    }

    const isOwner = existingTemplate.userId === parseInt(userId as string, 10);
    const isAdmin = req.user?.isAdmin;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this template" });
    }

    await prisma.template.delete({
      where: { id: templateId },
    });

    res.json({ message: "Template deleted successfully" });
    refreshEvents.emit("refreshView");
  } catch (err) {
    console.error("Error deleting template:", err);
    res.status(500).json({ message: "Failed to delete template" });
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  try {
    const templateId = parseInt(req.params.id);
    const userId = req.user.id;
    const { title, description, topicId, isPublic, isPublished, imageUrl, tags = [], accessUsers = [], questions = [] } = req.body;

    const existingTemplate = await prisma.template.findUnique({
      where: { id: templateId },
      include: {
        tags: { include: { tag: true } },
        accesses: true,
        questions: true,
      },
    });

    if (!existingTemplate) return res.status(404).json({ message: "Template not found" });

    if (existingTemplate.userId !== parseInt(userId) && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized to update this template" });
    }

    await prisma.$transaction(
      async (tx) => {
        // 1. Update template info
        await tx.template.update({
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

        // 2. Tags handling
        const existingTagNames = existingTemplate.tags.map((t) => t.tag.name);
        const tagsToRemove = existingTemplate.tags.filter((t) => !tags.includes(t.tag.name)).map((t) => t.tag.id);
        const tagsToAdd = tags.filter((name: string) => !existingTagNames.includes(name));

        if (tagsToRemove.length > 0) {
          await tx.templateTag.deleteMany({
            where: { templateId, tagId: { in: tagsToRemove } },
          });

          await tx.tag.updateMany({
            where: { id: { in: tagsToRemove } },
            data: { usageCount: { decrement: 1 } },
          });
        }

        if (tagsToAdd.length > 0) {
          const existing = await tx.tag.findMany({ where: { name: { in: tagsToAdd } } });
          const existingNames = existing.map((t) => t.name);
          const newTags = tagsToAdd.filter((name: any) => !existingNames.includes(name));

          if (newTags.length > 0) {
            await tx.tag.createMany({
              data: newTags.map((name: any) => ({ name, usageCount: 1 })),
              skipDuplicates: true,
            });
          }

          await tx.tag.updateMany({
            where: { name: { in: tagsToAdd } },
            data: { usageCount: { increment: 1 } },
          });

          const allTags = await tx.tag.findMany({
            where: { name: { in: tagsToAdd } },
            select: { id: true },
          });

          await tx.templateTag.createMany({
            data: allTags.map((tag) => ({ templateId, tagId: tag.id })),
            skipDuplicates: true,
          });
        }

        // 3. Access control
        const existingAccessUserIds = existingTemplate.accesses.map((a) => a.userId);
        const usersToRemove = existingTemplate.accesses.filter((a) => !accessUsers.includes(a.userId)).map((a) => a.userId);
        const usersToAdd = accessUsers.filter((id: number) => !existingAccessUserIds.includes(id));

        if (usersToRemove.length > 0) {
          await tx.templateAccess.deleteMany({
            where: { templateId, userId: { in: usersToRemove } },
          });
        }

        if (isPublic) {
          await tx.templateAccess.deleteMany({ where: { templateId } });
        } else if (usersToAdd.length > 0) {
          await tx.templateAccess.createMany({
            data: usersToAdd.map((id: number) => ({ templateId, userId: id })),
            skipDuplicates: true,
          });
        }

        // 4. Questions
        const existingQuestionIds = existingTemplate.questions.map((q) => q.id);
        const incomingQuestionIds = questions.filter((q: any) => q.id).map((q: any) => q.id);
        const questionsToDelete = existingQuestionIds.filter((id) => !incomingQuestionIds.includes(id));

        if (questionsToDelete.length > 0) {
          await tx.question.deleteMany({
            where: { id: { in: questionsToDelete } },
          });
        }

        const questionsToUpdate = questions.filter((q: any) => q.id);
        const questionsToCreate = questions.filter((q: any) => !q.id);

        await Promise.all(
          questionsToUpdate.map((q: any) =>
            tx.question.update({
              where: { id: q.id },
              data: {
                title: q.title,
                description: q.description || "",
                questionType: q.questionType,
                position: q.position,
                showInTable: q.showInTable ?? false,
                options: q.options || null,
                correctAnswers: q.correctAnswers || null,
                updatedAt: new Date(),
              },
            })
          )
        );

        if (questionsToCreate.length > 0) {
          await tx.question.createMany({
            data: questionsToCreate.map((q: any) => ({
              templateId,
              title: q.title,
              description: q.description || "",
              questionType: q.questionType,
              position: q.position,
              showInTable: q.showInTable ?? false,
              options: q.options || null,
              correctAnswers: q.correctAnswers || null,
            })),
          });
        }
      },
      {
        maxWait: 10000,
        timeout: 30000,
      }
    );

    // Final fetch
    const fullTemplate = await prisma.template.findUnique({
      where: { id: templateId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        topic: true,
        questions: { orderBy: { position: "asc" } },
        tags: { include: { tag: true } },
        accesses: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    const response = {
      ...fullTemplate,
      tags: fullTemplate?.tags.map((t) => t.tag),
      accessUsers: fullTemplate?.accesses.map((a) => a.user),
    };

    res.json(response);
    refreshEvents.emit("refreshView");
  } catch (err) {
    console.error("Error updating template:", err);
    res.status(500).json({ message: "Failed to update template" });
  }
};
