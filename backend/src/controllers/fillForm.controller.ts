import { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import { refreshEvents } from "../lib/refresh.ts";

// Get template for filling with user's existing form if it exists
export const getTemplateForFilling = async (req: Request, res: Response) => {
  try {
    const templateId = parseInt(req.params.id);
    const userId = req.user?.id;

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

    if (!template) {
      res.status(404).json({ error: "Template not found" });
      return;
    }

    // Check access permissions
    if (!template.isPublic) {
      if (!userId) {
        res.status(403).json({ error: "Authentication required" });
        return;
      }

      const hasAccess = await prisma.templateAccess.findFirst({
        where: {
          templateId,
          userId: parseInt(userId),
        },
      });

      if (!hasAccess && template.userId !== parseInt(userId)) {
        res.status(403).json({ error: "You don't have access to this template" });
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
    res.status(500).json({ error: "Failed to fetch template" });
  }
};

// Get a filled form
export const getFilledForm = async (req: Request, res: Response) => {
  try {
    const formId = parseInt(req.params.id);
    const userId = req.user?.id;

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
      res.status(404).json({ error: "Form not found" });
      return;
    }

    // Check permissions
    const isAdmin = req.user?.isAdmin;
    const isFormOwner = form.userId === parseInt(userId as string);
    const isTemplateOwner = form.template.userId === parseInt(userId as string);

    if (!isAdmin && !isFormOwner && !isTemplateOwner) {
      res.status(403).json({ error: "Not authorized to view this form" });
      return;
    }

    // Format response
    const formattedForm = {
      id: form.id,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
      template: {
        id: form.template.id,
        title: form.template.title,
        description: form.template.description,
        user: form.template.user,
        topic: form.template.topic,
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
    res.status(500).json({ error: "Failed to fetch form" });
  }
};

export const submitForm = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const { templateId, answers }: { templateId: string; answers: { questionId: number; value: any }[] } = req.body;
    console.log("Received answers:", answers);
    const userId = req.user.id;

    // Verify template exists and user has access
    const template = await prisma.template.findUnique({
      where: { id: parseInt(templateId) },
    });

    if (!template) {
      res.status(404).json({ error: "Template not found" });
      return;
    }

    // Check if user has already submitted this form
    const existingForm = await prisma.form.findFirst({
      where: {
        templateId: parseInt(templateId),
        userId: parseInt(userId),
      },
    });

    if (!template.isPublic) {
      const hasAccess = await prisma.templateAccess.findFirst({
        where: {
          templateId: template.id,
          userId: parseInt(userId),
        },
      });

      if (!hasAccess && template.userId !== parseInt(userId)) {
        res.status(403).json({ error: "You don't have access to this template" });
        return;
      }
    }

    // Validate answers structure
    const questions = await prisma.question.findMany({
      where: { templateId: parseInt(templateId) },
      select: { id: true, questionType: true, options: true },
    });

    const questionIds = questions.map((q) => q.id);
    const answerQuestionIds = answers.map((a: { questionId: number }) => (typeof a.questionId === "string" ? parseInt(a.questionId) : a.questionId));

    // Check if all required questions are answered
    const missingQuestions = questionIds.filter((id) => !answerQuestionIds.includes(id));
    if (missingQuestions.length > 0) {
      res.status(400).json({
        error: "Missing answers for some questions",
        missingQuestions,
      });
      return;
    }

    console.log("All questions answered:", answerQuestionIds);

    // Validate answer types
    const invalidAnswers = [];
    for (const { questionId, value } of answers) {
      const parsedQuestionId = typeof questionId === "string" ? parseInt(questionId) : questionId;
      const question = questions.find((q) => q.id === parsedQuestionId);
      if (!question) continue;

      let isValid = true;
      console.log(`Validating question ${parsedQuestionId} (${question.questionType}):`, value);

      switch (question.questionType) {
        case "INTEGER":
          isValid = !isNaN(Number(value)) && Number.isInteger(Number(value)) && Number(value) >= 0;
          break;
        case "CHECKBOX":
          // Check if this is a multi-option checkbox
          if (question.options && Array.isArray(question.options) && question.options.length > 0) {
            // For multi-option checkboxes, allow array or comma-separated string values
            if (Array.isArray(value)) {
              isValid = true; // Arrays from frontend are valid
            } else if (typeof value === "string") {
              // Check if it's a comma-separated list of valid options
              const selectedOptions = value.split(",").map((opt) => opt.trim());
              isValid = selectedOptions.length > 0;
            } else {
              isValid = false;
            }
          } else {
            // For single checkboxes (boolean values)
            isValid = value === true || value === false || value === "true" || value === "false" || value === "1" || value === "0";
          }
          break;
        case "STRING":
        case "TEXT":
          isValid = typeof value === "string" && value.trim().length > 0;
          break;
      }

      if (!isValid) {
        console.log(`Invalid answer for question ${parsedQuestionId}:`, value);
        invalidAnswers.push(parsedQuestionId);
      }
    }

    if (invalidAnswers.length > 0) {
      res.status(400).json({
        error: "Invalid answer types for some questions",
        invalidAnswers,
      });
      return;
    }

    let form;

    if (existingForm) {
      // Update existing form
      form = await prisma.$transaction(async (prisma) => {
        // First, delete existing answers
        await prisma.answer.deleteMany({
          where: { formId: existingForm.id },
        });

        // Then update the form to trigger the updatedAt field
        const updatedForm = await prisma.form.update({
          where: { id: existingForm.id },
          data: { updatedAt: new Date() }, // Empty update triggers updatedAt
        });

        console.log("Form updated:", {
          id: updatedForm.id,
          createdAt: updatedForm.createdAt,
          updatedAt: updatedForm.updatedAt,
        });

        // Create new answers
        await Promise.all(
          answers.map(({ questionId, value }) => {
            const parsedQuestionId = typeof questionId === "string" ? parseInt(questionId) : questionId;
            const question = questions.find((q) => q.id === parsedQuestionId);
            let finalValue;

            // Process value based on question type
            if (question?.questionType === "CHECKBOX" && Array.isArray(question.options) && question.options.length > 0) {
              finalValue = Array.isArray(value) ? value.join(",") : String(value);
            } else {
              finalValue = String(value);
            }

            return prisma.answer.create({
              data: {
                formId: existingForm.id,
                questionId: parsedQuestionId,
                value: finalValue,
              },
            });
          })
        );

        return updatedForm;
      });

      res.status(200).json({
        message: "Form updated successfully",
        formId: form.id,
      });
      refreshEvents.emit("refreshView");
    } else {
      // Create new form
      form = await prisma.$transaction(async (prisma) => {
        const newForm = await prisma.form.create({
          data: {
            templateId: parseInt(templateId),
            userId: parseInt(userId),
          },
        });

        await Promise.all(
          answers.map(({ questionId, value }) => {
            const parsedQuestionId = typeof questionId === "string" ? parseInt(questionId) : questionId;
            const question = questions.find((q) => q.id === parsedQuestionId);
            let finalValue;

            if (question?.questionType === "CHECKBOX" && Array.isArray(question.options) && question.options.length > 0) {
              finalValue = Array.isArray(value) ? value.join(",") : String(value);
            } else {
              finalValue = String(value);
            }

            return prisma.answer.create({
              data: {
                formId: newForm.id,
                questionId: parsedQuestionId,
                value: finalValue,
              },
            });
          })
        );

        return newForm;
      });

      res.status(201).json({
        message: "Form submitted successfully",
        formId: form.id,
      });
      refreshEvents.emit("refreshView");
    }
  } catch (err) {
    console.error("Error submitting form:", err);
    res.status(500).json({ error: "Failed to submit form" });
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
      res.status(404).json({ error: "Form not found" });
      return;
    }

    // Check permissions
    const isAdmin = req.user?.isAdmin;
    const isFormOwner = form.userId === parseInt(userId as string);
    const isTemplateOwner = form.template.userId === parseInt(userId as string);

    if (!isAdmin && !isFormOwner && !isTemplateOwner) {
      res.status(403).json({ error: "Not authorized to delete this form" });
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
    res.status(500).json({ error: "Failed to delete filled form" });
  }
};

// Get all filled forms by template ID
export const getAllFormByTemplate = async (req: Request, res: Response) => {
  try {
    const templateId = parseInt(req.params.id);
    const userId = req.user?.id;

    // Check if the template exists
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    // Check permissions
    const isAdmin = req.user?.isAdmin;
    const isTemplateOwner = template.userId === parseInt(userId as string);

    if (!isAdmin && !isTemplateOwner) {
      return res.status(403).json({ error: "Not authorized to view forms for this template" });
    }

    // Fetch all forms for this template with required data
    const forms = await prisma.form.findMany({
      where: { templateId },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            name: true,
          },
        },
        answers: {
          select: {
            question: {
              select: {
                id: true,
                questionType: true,
                correctAnswers: true,
              },
            },
            value: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Process each form to calculate correctness percentages
    const processedForms = forms.map((form) => {
      // Filter answers that are for integer or checkbox questions
      const scorableAnswers = form.answers.filter((answer) => answer.question.questionType === "INTEGER" || answer.question.questionType === "CHECKBOX");

      let correctCount = 0;

      scorableAnswers.forEach((answer) => {
        const { questionType, correctAnswers } = answer.question;

        if (questionType === "INTEGER") {
          // For integer questions, compare exact value
          const correctValue = Array.isArray(correctAnswers) ? correctAnswers[0] : correctAnswers;

          if (answer.value === correctValue?.toString()) {
            correctCount++;
          }
        } else if (questionType === "CHECKBOX") {
          // For checkbox questions, compare arrays
          try {
            const userAnswers = Array.isArray(answer.value) ? answer.value : JSON.parse(answer.value || "[]");

            const correctAnswersParsed = correctAnswers ? (Array.isArray(correctAnswers) ? correctAnswers : JSON.parse(String(correctAnswers))) : [];

            if (arraysEqual(userAnswers, correctAnswersParsed)) {
              correctCount++;
            }
          } catch (e) {
            // Silently handle parse errors
          }
        }
      });

      // Calculate percentage (avoid division by zero)
      const scorePercentage = scorableAnswers.length > 0 ? Math.round((correctCount / scorableAnswers.length) * 100) : null;

      return {
        formId: form.id,
        userName: form.user.name,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        scorePercentage: scorePercentage,
      };
    });

    return res.json(processedForms);
  } catch (err) {
    console.error("Error fetching filled forms:", err);
    return res.status(500).json({ error: "Failed to fetch filled forms" });
  }
};

// Helper function to compare arrays regardless of order
function arraysEqual(a: any[], b: any[]): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  const aSorted = [...a].sort().toString();
  const bSorted = [...b].sort().toString();
  return aSorted === bSorted;
}
