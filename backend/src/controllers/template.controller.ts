import { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";

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
  } catch (err) {
    console.error("Error creating template:", err);
    res.status(500).json({ error: "Failed to create template" });
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const templateId = parseInt(req.params.id);
    const userId = req.user?.id;

    const existingTemplate = await prisma.template.findUnique({
      where: { id: templateId },
      include: { tags: true, accesses: true },
    });

    if (!existingTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }

    if (existingTemplate.userId !== parseInt(userId as string, 10) && !req.user?.isAdmin) {
      return res.status(403).json({ error: "Not authorized to update this template" });
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

        await Promise.all(
          tags.map(async (tagName: string) => {
            const tag = await prisma.tag.upsert({
              where: { name: tagName },
              update: { usageCount: { increment: 1 } },
              create: { name: tagName, usageCount: 1 },
            });
            return prisma.templateTag.create({ data: { templateId, tagId: tag.id } });
          })
        );
      }

      if (isPublic === false && accessUsers) {
        await prisma.templateAccess.deleteMany({ where: { templateId } });

        await Promise.all(accessUsers.map((uid: number) => prisma.templateAccess.create({ data: { templateId, userId: uid } })));
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
  } catch (err) {
    console.error("Error deleting template:", err);
    res.status(500).json({ error: "Failed to delete template" });
  }
};
