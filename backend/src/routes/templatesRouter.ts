import express, { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import { authenticateUser } from "../middleware/authenticateUser.ts";

const router = express.Router();

// GET all templates with filtering and pagination
router.get("/", async (req: Request, res: Response) => {
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
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        topic: true,
        tags: {
          include: { tag: true },
        },
        _count: {
          select: {
            questions: true,
            comments: true,
            likes: true,
          },
        },
      },
    });

    const formattedTemplates = templates.map((template) => ({
      ...template,
      tags: template.tags.map((t) => t.tag),
      questionCount: template._count.questions,
      commentCount: template._count.comments,
      likesCount: template._count.likes,
    }));

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
});

// GET a template by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const templateId = parseInt(req.params.id);

    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        topic: true,
        tags: { include: { tag: true } },
        accesses: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });

    if (!template) {
      res.status(404).json({ error: "Template not found" });
      return;
    }

    const formattedTemplate = {
      ...template,
      tags: template.tags.map((t) => t.tag),
      accessUsers: template.accesses.map((a) => a.user),
    };

    res.json(formattedTemplate);
  } catch (err) {
    console.error("Error fetching template:", err);
    res.status(500).json({ error: "Failed to fetch template" });
  }
});

// CREATE a new template
router.post("/", authenticateUser, async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const { title, description, topicId, isPublic, isPublished, imageUrl, tags, accessUsers, questions } = req.body;
    const userId = req.user.id;

    const createdTemplate = await prisma.$transaction(async (prisma) => {
      const template = await prisma.template.create({
        data: {
          title,
          description,
          userId: parseInt(userId, 10),
          topicId: parseInt(topicId),
          isPublic: isPublic !== undefined ? isPublic : true,
          isPublished: isPublished !== undefined ? isPublished : false,
          imageUrl: imageUrl || null,
        },
      });

      if (tags?.length) {
        const tagPromises = tags.map(async (tagName: string) => {
          const tag = await prisma.tag.upsert({
            where: { name: tagName },
            update: { usageCount: { increment: 1 } },
            create: { name: tagName, usageCount: 1 },
          });

          return prisma.templateTag.create({
            data: { templateId: template.id, tagId: tag.id },
          });
        });
        await Promise.all(tagPromises);
      }

      if (!isPublic && accessUsers?.length) {
        const accessPromises = accessUsers.map((uid: number) =>
          prisma.templateAccess.create({
            data: {
              templateId: template.id,
              userId: uid,
            },
          })
        );
        await Promise.all(accessPromises);
      }

      if (questions?.length) {
        const questionPromises = questions.map((q: any, index: number) =>
          prisma.question.create({
            data: {
              templateId: template.id,
              title: q.title,
              description: q.description || "",
              questionType: q.questionType,
              position: q.position !== undefined ? q.position : index,
              showInTable: q.showInTable ?? false,
              options: q.options || null,
              correctAnswers: q.correctAnswers || null,
            },
          })
        );
        await Promise.all(questionPromises);
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
  } catch (err) {
    console.error("Error creating template:", err);
    res.status(500).json({ error: "Failed to create template" });
  }
});

// UPDATE a template
router.put("/:id", authenticateUser, async (req: Request, res: Response) => {
  try {
    const templateId = parseInt(req.params.id);
    const userId = req.user?.id;

    const existingTemplate = await prisma.template.findUnique({
      where: { id: templateId },
      include: {
        tags: true,
        accesses: true,
      },
    });

    if (!existingTemplate) {
      res.status(404).json({ error: "Template not found" });
      return;
    }

    if (existingTemplate.userId !== parseInt(userId as string, 10) && !req.user?.isAdmin) {
      res.status(403).json({ error: "Not authorized to update this template" });
      return;
    }

    const { title, description, topicId, isPublic, isPublished, imageUrl, tags, accessUsers } = req.body;

    const updatedTemplate = await prisma.$transaction(async (prisma) => {
      const template = await prisma.template.update({
        where: { id: templateId },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(topicId !== undefined && { topicId: parseInt(topicId) }),
          ...(isPublic !== undefined && { isPublic }),
          ...(isPublished !== undefined && { isPublished }),
          ...(imageUrl !== undefined && { imageUrl }),
          updatedAt: new Date(),
        },
      });

      if (tags) {
        await prisma.templateTag.deleteMany({ where: { templateId } });

        for (const tagRel of existingTemplate.tags) {
          await prisma.tag.update({
            where: { id: tagRel.tagId },
            data: { usageCount: { decrement: 1 } },
          });
        }

        if (tags.length > 0) {
          const tagPromises = tags.map(async (tagName: string) => {
            const tag = await prisma.tag.upsert({
              where: { name: tagName },
              update: { usageCount: { increment: 1 } },
              create: { name: tagName, usageCount: 1 },
            });

            return prisma.templateTag.create({
              data: { templateId, tagId: tag.id },
            });
          });
          await Promise.all(tagPromises);
        }
      }

      if (isPublic === false && accessUsers) {
        await prisma.templateAccess.deleteMany({ where: { templateId } });

        if (accessUsers.length > 0) {
          const accessPromises = accessUsers.map((uid: number) =>
            prisma.templateAccess.create({
              data: { templateId, userId: uid },
            })
          );
          await Promise.all(accessPromises);
        }
      } else if (isPublic === true) {
        await prisma.templateAccess.deleteMany({ where: { templateId } });
      }

      return prisma.template.findUnique({
        where: { id: templateId },
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
    });

    const formattedTemplate = {
      ...updatedTemplate,
      tags: updatedTemplate?.tags.map((t) => t.tag),
      accessUsers: updatedTemplate?.accesses.map((a) => a.user),
    };

    res.json(formattedTemplate);
  } catch (err) {
    console.error("Error updating template:", err);
    res.status(500).json({ error: "Failed to update template" });
  }
});

export default router;
