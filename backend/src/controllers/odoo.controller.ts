// odoo.controller.ts
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

interface Submission {
  form_id: number;
  templateId: number;
  user_id: number;
  user_name: string;
  submission_date: Date;
  question_id: number;
  question_title: string;
  question_type: string;
  show_in_table: boolean;
  answer: string | null;
}

export const getAllSubmissionsForOdoo = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const { templateId: templateIdParam, apiToken } = req.query;

    if (!templateIdParam || !apiToken) {
      return res.status(400).json({
        message: "Both templateId and apiToken are required as query parameters",
      });
    }

    const templateId = parseInt(templateIdParam as string);
    if (isNaN(templateId)) {
      return res.status(400).json({
        message: "Invalid template ID. Must be a number.",
      });
    }

    // Check API token validity
    const user = await prisma.user.findUnique({
      where: { apiToken: apiToken as string },
      select: { id: true },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid API token",
      });
    }

    // Check template existence and ownership
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      select: { userId: true },
    });

    if (!template) {
      return res.status(404).json({
        message: "Template not found",
      });
    }

    if (template.userId !== user.id) {
      return res.status(403).json({
        message: "Not authorized to view submissions for this template",
      });
    }

    // Get submissions using parameterized query for security
    const submissions: Submission[] = await prisma.$queryRaw`
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
    `;

    return res.json(submissions);
  } catch (err) {
    console.error("Error fetching submissions:", err);
    return res.status(500).json({
      message: "An unexpected error occurred while fetching submissions",
    });
  }
};

export const getApiToken = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    res.json({ apiToken: req.user.apiToken });
    return;
  } catch (err) {
    console.error("Error fetching API token:", err);
    res.status(500).json({
      message: "An unexpected error occurred while fetching the API token",
    });
    return;
  }
};
