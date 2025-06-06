import { Request, Response } from "express";
import { prisma } from "../lib/prisma"; // Adjust path as needed
import { refreshEvents } from "../lib/refresh";
import { sendFormSubmissionEmail } from "../lib/sendMail"; // Adjust path as needed

// Helper function to validate email format
function validateEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
}

export const submitForm = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const {
      templateId,
      answers,
      sendEmailCopy = false,
      userEmail = null,
    }: {
      templateId: string;
      answers: { questionId: number; value: any }[];
      sendEmailCopy?: boolean;
      userEmail?: string | null;
    } = req.body;

    // console.log("Received answers:", answers);
    // console.log("Send email copy:", sendEmailCopy);

    const userId = req.user.id;

    // Validate email parameters
    if (sendEmailCopy && (!userEmail || !validateEmail(userEmail))) {
      res.status(400).json({ message: "Valid email address is required when requesting email copy" });
      return;
    }

    // Verify template exists and user has access
    const template = await prisma.template.findUnique({
      where: { id: parseInt(templateId) },
    });

    if (!template) {
      res.status(404).json({ message: "Template not found" });
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
        res.status(403).json({ message: "You don't have access to this template" });
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
        message: "Missing answers for some questions",
        missingQuestions,
      });
      return;
    }

    // console.log("All questions answered:", answerQuestionIds);

    // Validate answer types
    const invalidAnswers = [];
    for (const { questionId, value } of answers) {
      const parsedQuestionId = typeof questionId === "string" ? parseInt(questionId) : questionId;
      const question = questions.find((q) => q.id === parsedQuestionId);
      if (!question) continue;

      let isValid = true;
      // console.log(`Validating question ${parsedQuestionId} (${question.questionType}):`, value);

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
        // console.log(`Invalid answer for question ${parsedQuestionId}:`, value);
        invalidAnswers.push(parsedQuestionId);
      }
    }

    if (invalidAnswers.length > 0) {
      res.status(400).json({
        message: "Invalid answer types for some questions",
        invalidAnswers,
      });
      return;
    }

    let form;

    if (existingForm) {
      res.status(400).json({ message: "You have already submitted this form. To update, use the appropriate endpoint." });
      return;
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

      // Send email if requested (for new form)
      if (sendEmailCopy && userEmail) {
        try {
          await sendFormSubmissionEmail(form.id, userEmail);
        } catch (emailError) {
          console.error("Failed to send email confirmation:", emailError);
          // Don't fail the whole request if email sending fails
        }
      }

      res.status(201).json({
        message: "Form submitted successfully",
        formId: form.id,
        emailSent: sendEmailCopy && userEmail ? true : false,
      });
      refreshEvents.emit("refreshView");
    }
  } catch (err) {
    console.error("Error submitting form:", err);
    res.status(500).json({ message: "Failed to submit form" });
  }
};

export const updateFilledForm = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const formId = parseInt(req.params.id);
  const userId = req.user.id;
  const isAdmin = req.user?.isAdmin;
  console.log("isAdmin", isAdmin);

  try {
    const {
      answers,
      sendEmailCopy = false,
      userEmail = null,
    }: {
      answers: { questionId: number; value: any }[];
      sendEmailCopy?: boolean;
      userEmail?: string | null;
    } = req.body;

    // Validate email parameters
    if (sendEmailCopy && (!userEmail || !validateEmail(userEmail))) {
      res.status(400).json({ message: "Valid email address is required when requesting email copy" });
      return;
    }

    // Fetch form and verify ownership
    const existingForm = await prisma.form.findUnique({
      where: { id: formId },
      include: { template: true },
    });

    if (!existingForm) {
      res.status(404).json({ message: "Form not found" });
      return;
    }

    if (existingForm.userId !== parseInt(userId) && !isAdmin) {
      res.status(403).json({ message: "You don't have permission to update this form" });
      return;
    }

    const templateId = existingForm.templateId;

    const questions = await prisma.question.findMany({
      where: { templateId },
      select: { id: true, questionType: true, options: true },
    });

    const questionIds = questions.map((q) => q.id);
    const answerQuestionIds = answers.map((a) => (typeof a.questionId === "string" ? parseInt(a.questionId) : a.questionId));

    const missingQuestions = questionIds.filter((id) => !answerQuestionIds.includes(id));
    if (missingQuestions.length > 0) {
      res.status(400).json({
        message: "Missing answers for some questions",
        missingQuestions,
      });
      return;
    }

    const invalidAnswers = [];
    for (const { questionId, value } of answers) {
      const parsedQuestionId = typeof questionId === "string" ? parseInt(questionId) : questionId;
      const question = questions.find((q) => q.id === parsedQuestionId);
      if (!question) continue;

      let isValid = true;

      switch (question.questionType) {
        case "INTEGER":
          isValid = !isNaN(Number(value)) && Number.isInteger(Number(value)) && Number(value) >= 0;
          break;
        case "CHECKBOX":
          if (question.options && Array.isArray(question.options) && question.options.length > 0) {
            if (Array.isArray(value)) {
              isValid = true;
            } else if (typeof value === "string") {
              const selectedOptions = value.split(",").map((opt) => opt.trim());
              isValid = selectedOptions.length > 0;
            } else {
              isValid = false;
            }
          } else {
            isValid = value === true || value === false || value === "true" || value === "false" || value === "1" || value === "0";
          }
          break;
        case "STRING":
        case "TEXT":
          isValid = typeof value === "string" && value.trim().length > 0;
          break;
      }

      if (!isValid) {
        invalidAnswers.push(parsedQuestionId);
      }
    }

    if (invalidAnswers.length > 0) {
      res.status(400).json({
        message: "Invalid answer types for some questions",
        invalidAnswers,
      });
      return;
    }

    const updatedForm = await prisma.$transaction(async (prisma) => {
      await prisma.answer.deleteMany({ where: { formId } });

      const updatedForm = await prisma.form.update({
        where: { id: formId },
        data: { updatedAt: new Date() },
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
              formId,
              questionId: parsedQuestionId,
              value: finalValue,
            },
          });
        })
      );

      return updatedForm;
    });

    if (sendEmailCopy && userEmail) {
      try {
        await sendFormSubmissionEmail(formId, userEmail);
      } catch (emailError) {
        console.error("Failed to send email confirmation:", emailError);
      }
    }

    res.status(200).json({
      message: "Form updated successfully",
      formId,
      emailSent: sendEmailCopy && userEmail ? true : false,
    });

    refreshEvents.emit("refreshView");
  } catch (err) {
    console.error("Error updating form:", err);
    res.status(500).json({ message: "Failed to update form" });
  }
};
