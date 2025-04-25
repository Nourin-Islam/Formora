import { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import { refreshEvents } from "../lib/refresh.ts";
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
