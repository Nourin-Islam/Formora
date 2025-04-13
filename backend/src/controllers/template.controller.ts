// File: api/templates/index.ts

import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyJwtToken } from "../../middleware/auth";

const prisma = new PrismaClient();

// Middleware to protect routes
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const userId = await verifyJwtToken(token);

    // Set user ID in request for use in route handlers
    req.userId = userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

// GET all templates with filtering options
export const getTemplates = async (req: Request, res: Response) => {
  try {
    const { topicId, isPublic, userId, search, tags } = req.query;

    // Build filter conditions
    const where: any = {
      isPublished: true,
    };

    // Filter by topic
    if (topicId) {
      where.topicId = parseInt(topicId as string);
    }

    // Filter by visibility
    if (isPublic !== undefined) {
      where.isPublic = isPublic === "true";
    }

    // Filter by user
    if (userId) {
      where.userId = parseInt(userId as string);
    }

    // Full-text search on title and description
    if (search) {
      where.OR = [{ title: { contains: search as string, mode: "insensitive" } }, { description: { contains: search as string, mode: "insensitive" } }];
    }

    // Filter by tags if provided
    let tagFilter = {};
    if (tags) {
      const tagArray = (tags as string).split(",");
      tagFilter = {
        tags: {
          some: {
            tag: {
              name: {
                in: tagArray,
              },
            },
          },
        },
      };
      Object.assign(where, tagFilter);
    }

    // Fetch templates with topic, user, and tags
    const templates = await prisma.template.findMany({
      where,
      include: {
        topic: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform response to include formatted tags
    const formattedTemplates = templates.map((template) => ({
      ...template,
      tags: template.tags.map((t) => t.tag.name),
      likesCount: template._count.likes,
      commentsCount: template._count.comments,
      _count: undefined,
    }));

    return res.status(200).json(formattedTemplates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return res.status(500).json({ error: "Failed to fetch templates" });
  }
};

// GET template by ID
export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if template exists
    const template = await prisma.template.findUnique({
      where: { id: parseInt(id) },
      include: {
        topic: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        accesses: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    // Check if user has access to private template
    if (!template.isPublic) {
      // If user is not authenticated
      if (!req.userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // If user is not the owner and doesn't have specific access
      if (template.userId !== req.userId && !template.accesses.some((access) => access.userId === req.userId)) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    // Format response
    const formattedTemplate = {
      ...template,
      tags: template.tags.map((t) => t.tag.name),
      accessUsers: template.accesses.map((a) => a.user),
      likesCount: template._count.likes,
      commentsCount: template._count.comments,
      _count: undefined,
      accesses: undefined,
    };

    return res.status(200).json(formattedTemplate);
  } catch (error) {
    console.error("Error fetching template:", error);
    return res.status(500).json({ error: "Failed to fetch template" });
  }
};

// POST create new template
export const createTemplate = async (req: Request, res: Response) => {
  try {
    // Ensure user is authenticated
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { title, description, topicId, isPublic, isPublished, imageUrl, tags, accessUsers, questions } = req.body;

    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the template
      const template = await tx.template.create({
        data: {
          title,
          description,
          isPublic: isPublic ?? true,
          isPublished: isPublished ?? false,
          imageUrl,
          userId: req.userId,
          topicId: parseInt(topicId),
        },
      });

      // 2. Handle tags (create if needed and connect)
      if (tags && tags.length > 0) {
        for (const tagName of tags) {
          // Find or create tag
          let tag = await tx.tag.findUnique({
            where: { name: tagName },
          });

          if (!tag) {
            tag = await tx.tag.create({
              data: { name: tagName },
            });
          } else {
            // Increment usage count for existing tag
            await tx.tag.update({
              where: { id: tag.id },
              data: { usageCount: { increment: 1 } },
            });
          }

          // Connect tag to template
          await tx.templateTag.create({
            data: {
              templateId: template.id,
              tagId: tag.id,
            },
          });
        }
      }

      // 3. Handle access permissions for private templates
      if (!isPublic && accessUsers && accessUsers.length > 0) {
        for (const userId of accessUsers) {
          await tx.templateAccess.create({
            data: {
              templateId: template.id,
              userId: parseInt(userId),
            },
          });
        }
      }

      // 4. Create questions if provided
      if (questions && questions.length > 0) {
        for (let i = 0; i < questions.length; i++) {
          const question = questions[i];
          await tx.question.create({
            data: {
              templateId: template.id,
              title: question.title,
              description: question.description || "",
              questionType: question.questionType,
              position: question.position || i,
              showInTable: question.showInTable || false,
              options: question.options || null,
              correctAnswers: question.correctAnswers || null,
            },
          });
        }
      }

      // Return the complete template data
      return tx.template.findUnique({
        where: { id: template.id },
        include: {
          topic: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          questions: {
            orderBy: {
              position: "asc",
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          accesses: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });
    });

    // Format the response
    const formattedTemplate = {
      ...result,
      tags: result.tags.map((t) => t.tag.name),
      accessUsers: result.accesses.map((a) => a.user),
      accesses: undefined,
    };

    return res.status(201).json(formattedTemplate);
  } catch (error) {
    console.error("Error creating template:", error);
    return res.status(500).json({ error: "Failed to create template" });
  }
};

// PUT update template
export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const templateId = parseInt(id);

    // Ensure user is authenticated
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if template exists and user is the owner
    const existingTemplate = await prisma.template.findUnique({
      where: { id: templateId },
      select: { userId: true },
    });

    if (!existingTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }

    if (existingTemplate.userId !== req.userId) {
      return res.status(403).json({ error: "You do not have permission to update this template" });
    }

    const { title, description, topicId, isPublic, isPublished, imageUrl, tags, accessUsers } = req.body;

    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update the template
      const updatedTemplate = await tx.template.update({
        where: { id: templateId },
        data: {
          title,
          description,
          topicId: topicId ? parseInt(topicId) : undefined,
          isPublic: isPublic !== undefined ? isPublic : undefined,
          isPublished: isPublished !== undefined ? isPublished : undefined,
          imageUrl,
        },
      });

      // 2. Update tags if provided
      if (tags !== undefined) {
        // Remove existing tags
        await tx.templateTag.deleteMany({
          where: { templateId },
        });

        // Add new tags
        if (tags.length > 0) {
          for (const tagName of tags) {
            // Find or create tag
            let tag = await tx.tag.findUnique({
              where: { name: tagName },
            });

            if (!tag) {
              tag = await tx.tag.create({
                data: { name: tagName },
              });
            } else {
              // Increment usage count for existing tag
              await tx.tag.update({
                where: { id: tag.id },
                data: { usageCount: { increment: 1 } },
              });
            }

            // Connect tag to template
            await tx.templateTag.create({
              data: {
                templateId,
                tagId: tag.id,
              },
            });
          }
        }

        // Clean up unused tags
        const unusedTags = await tx.tag.findMany({
          where: {
            usageCount: 0,
          },
        });

        for (const tag of unusedTags) {
          await tx.tag.delete({
            where: { id: tag.id },
          });
        }
      }

      // 3. Update access permissions if template visibility or access users changed
      if (isPublic !== undefined || accessUsers !== undefined) {
        // Remove existing access permissions
        await tx.templateAccess.deleteMany({
          where: { templateId },
        });

        // Add new access permissions if template is private
        if (!isPublic && accessUsers && accessUsers.length > 0) {
          for (const userId of accessUsers) {
            await tx.templateAccess.create({
              data: {
                templateId,
                userId: parseInt(userId),
              },
            });
          }
        }
      }

      // Return the updated template
      return tx.template.findUnique({
        where: { id: templateId },
        include: {
          topic: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          questions: {
            orderBy: {
              position: "asc",
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          accesses: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });
    });

    // Format the response
    const formattedTemplate = {
      ...result,
      tags: result.tags.map((t) => t.tag.name),
      accessUsers: result.accesses.map((a) => a.user),
      likesCount: result._count.likes,
      commentsCount: result._count.comments,
      _count: undefined,
      accesses: undefined,
    };

    return res.status(200).json(formattedTemplate);
  } catch (error) {
    console.error("Error updating template:", error);
    return res.status(500).json({ error: "Failed to update template" });
  }
};

// DELETE template
export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const templateId = parseInt(id);

    // Ensure user is authenticated
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if template exists and user is the owner
    const existingTemplate = await prisma.template.findUnique({
      where: { id: templateId },
      select: {
        userId: true,
        user: {
          select: {
            isAdmin: true,
          },
        },
      },
    });

    if (!existingTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }

    // Check if user is the owner or an admin
    const isAdmin = existingTemplate.user?.isAdmin || false;
    if (existingTemplate.userId !== req.userId && !isAdmin) {
      return res.status(403).json({ error: "You do not have permission to delete this template" });
    }

    // Start a transaction to delete template and related entities
    await prisma.$transaction(async (tx) => {
      // 1. Delete all template tags
      await tx.templateTag.deleteMany({
        where: { templateId },
      });

      // 2. Delete all template access records
      await tx.templateAccess.deleteMany({
        where: { templateId },
      });

      // 3. Delete all answers related to questions in this template
      const questions = await tx.question.findMany({
        where: { templateId },
        select: { id: true },
      });

      const questionIds = questions.map((q) => q.id);

      if (questionIds.length > 0) {
        await tx.answer.deleteMany({
          where: {
            questionId: { in: questionIds },
          },
        });
      }

      // 4. Delete all questions
      await tx.question.deleteMany({
        where: { templateId },
      });

      // 5. Delete all forms based on this template
      const forms = await tx.form.findMany({
        where: { templateId },
        select: { id: true },
      });

      const formIds = forms.map((f) => f.id);

      if (formIds.length > 0) {
        await tx.answer.deleteMany({
          where: {
            formId: { in: formIds },
          },
        });

        await tx.form.deleteMany({
          where: { id: { in: formIds } },
        });
      }

      // 6. Delete all comments on this template
      await tx.comment.deleteMany({
        where: { templateId },
      });

      // 7. Delete all likes on this template
      await tx.like.deleteMany({
        where: { templateId },
      });

      // 8. Finally, delete the template itself
      await tx.template.delete({
        where: { id: templateId },
      });

      // 9. Clean up unused tags
      const unusedTags = await tx.tag.findMany({
        where: {
          usageCount: 0,
        },
      });

      for (const tag of unusedTags) {
        await tx.tag.delete({
          where: { id: tag.id },
        });
      }
    });

    return res.status(200).json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting template:", error);
    return res.status(500).json({ error: "Failed to delete template" });
  }
};
