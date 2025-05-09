import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { refreshEvents } from "../lib/refresh";

// Get template for filling with user's existing form if it exists
export const getTemplateForFilling = async (req: Request, res: Response) => {
  try {
    const templateId = parseInt(req.params.id);
    const userId = req.user?.id;
    const isAdmin = req.user?.isAdmin;

    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: {
        user: { select: { id: true, name: true } },
        topic: true,
        questions: {
          orderBy: { position: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            questionType: true,
            position: true,
            options: true,
          },
        },
      },
    });
    // console.log("Template for filling:", template);

    if (!template) {
      res.status(404).json({ message: "Template not found" });
      console.log("Template not found:", templateId);
      return;
    }

    // Check access permissions
    if (!template.isPublic) {
      if (!userId) {
        res.status(403).json({ message: "Authentication required" });
        return;
      }

      const hasAccess = await prisma.templateAccess.findFirst({
        where: {
          templateId,
          userId: parseInt(userId),
        },
      });

      if (!hasAccess && template.userId !== parseInt(userId) && !isAdmin) {
        res.status(403).json({ message: "You don't have access to this template" });
        return;
      }
    }

    // Check if user already has a form for this template
    let existingForm = null;
    if (userId) {
      existingForm = await prisma.form.findFirst({
        where: {
          templateId,
          userId: parseInt(userId),
        },
        include: {
          answers: {
            include: {
              question: {
                select: {
                  id: true,
                  questionType: true,
                  options: true,
                },
              },
            },
          },
        },
      });
    }

    res.json({
      template,
      existingForm,
    });
  } catch (err) {
    console.error("Error fetching template:", err);
    res.status(500).json({ message: "Failed to fetch template" });
  }
};

// Get a filled form
export const getFilledForm = async (req: Request, res: Response) => {
  try {
    const formId = parseInt(req.params.id);
    const userId = req.user?.id;
    console.log("Fetching filled form with ID:", formId, "for user ID:", userId);

    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        template: {
          include: {
            user: { select: { id: true, name: true } },
            topic: true,
          },
        },
        user: { select: { id: true, name: true, email: true } },
        answers: {
          include: {
            question: {
              select: {
                id: true,
                title: true,
                description: true,
                questionType: true,
                position: true,
              },
            },
          },
          orderBy: { question: { position: "asc" } },
        },
      },
    });

    if (!form) {
      res.status(404).json({ message: "Form not found" });
      return;
    }

    // Check permissions
    const isAdmin = req.user?.isAdmin;
    const isFormOwner = form.userId === parseInt(userId as string);
    const isTemplateOwner = form?.template?.userId === parseInt(userId as string);

    if (!isAdmin && !isFormOwner && !isTemplateOwner) {
      res.status(403).json({ message: "Not authorized to view this form" });
      return;
    }

    // Format response
    const formattedForm = {
      id: form.id,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
      template: {
        id: form?.template?.id,
        title: form.template?.title,
        description: form.template?.description,
        user: form.template?.user,
        topic: form.template?.topic,
      },
      user: form.user,
      answers: form.answers.map((a) => ({
        id: a.id,
        question: a.question,
        value: a.value,
        createdAt: a.createdAt,
      })),
    };

    res.json(formattedForm);
  } catch (err) {
    console.error("Error fetching form:", err);
    res.status(500).json({ message: "Failed to fetch form" });
  }
};

// Delete a filled form
export const deleteFilledForm = async (req: Request, res: Response) => {
  try {
    const formId = parseInt(req.params.id);
    const userId = req.user?.id;

    // Check if the form exists and belongs to the user
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: { template: true },
    });

    if (!form) {
      res.status(404).json({ message: "Form not found" });
      return;
    }

    // Check permissions
    const isAdmin = req.user?.isAdmin;
    const isFormOwner = form.userId === parseInt(userId as string);
    const isTemplateOwner = form.template?.userId === parseInt(userId as string);

    if (!isAdmin && !isFormOwner && !isTemplateOwner) {
      res.status(403).json({ message: "Not authorized to delete this form" });
      return;
    }

    // Delete the form and its answers
    await prisma.$transaction(async (prisma) => {
      await prisma.answer.deleteMany({
        where: { formId },
      });

      await prisma.form.delete({
        where: { id: formId },
      });
    });
    refreshEvents.emit("refreshView");

    res.status(200).json({ message: "Form deleted successfully" });
  } catch (err) {
    console.error("Error deleting filled form:", err);
    res.status(500).json({ message: "Failed to delete filled form" });
  }
};

export const getAllSubmissionsByTemplate = async (req: Request, res: Response) => {
  try {
    const templateId = parseInt(req.params.id);
    const userId = req.user?.id;

    // Check if the template exists
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    const isAdmin = req.user?.isAdmin;
    const isTemplateOwner = template.userId === parseInt(userId as string);

    if (!isAdmin && !isTemplateOwner) {
      return res.status(403).json({ message: "Not authorized to view submissions for this template" });
    }

    // Explicitly select fields excluding the 4 specified ones
    const submissions = await prisma.$queryRawUnsafe(`
      SELECT 
        form_id,
        template_id AS "templateId",
        user_id,
        user_name,
        submission_date,
        question_id,
        question_title,
        question_type,
        show_in_table,
        answer
      FROM form_submissions_view
      WHERE template_id = ${templateId}
    `);

    res.json(submissions);
    return;
  } catch (err) {
    console.error("Error fetching submissions:", err);
    res.status(500).json({ message: "Failed to fetch submissions" });
    return;
  }
};

export const getAllMyResponses = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const responses = await prisma.$queryRaw`
      SELECT DISTINCT ON (form_id)
        form_id,
        template_title,
        template_creator_name,
        template_question_count,
        template_submission_count,
        submission_date
      FROM form_submissions_view
      WHERE user_id = ${parseInt(userId)}
      ORDER BY form_id, submission_date DESC
    `;

    res.json(
      (responses as any[]).map((r: any) => ({
        ...r,
        template_question_count: Number(r.template_question_count),
        template_submission_count: Number(r.template_submission_count),
      }))
    );
  } catch (error) {
    console.error("Error fetching user responses:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getTemplateForEditing = async (req: Request, res: Response) => {
  try {
    const formId = parseInt(req.params.id);
    const userId = req.user?.id;
    const isAdmin = req.user?.isAdmin;

    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        template: {
          include: {
            user: { select: { id: true, name: true } },
            topic: true,
            questions: {
              orderBy: { position: "asc" },
              select: {
                id: true,
                title: true,
                description: true,
                questionType: true,
                position: true,
                options: true,
              },
            },
          },
        },
        answers: {
          include: {
            question: {
              select: {
                id: true,
                questionType: true,
                options: true,
              },
            },
          },
        },
      },
    });

    if (!form || !form.template) {
      res.status(404).json({ message: "Form or template not found" });
      return;
    }

    // Optional: enforce edit access control (if necessary)
    if (form.userId !== parseInt(userId as string) && !isAdmin) {
      res.status(403).json({ message: "You are not authorized to edit this submission" });
      return;
    }

    res.json({
      template: form.template,
      existingForm: {
        id: form.id,
        userId: form.userId,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        answers: form.answers,
      },
    });
  } catch (err) {
    console.error("Error fetching form for editing:", err);
    res.status(500).json({ message: "Failed to fetch form for editing" });
  }
};
