import { Request, Response } from "express";
import { z } from "zod";
import { Dropbox } from "dropbox";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ticketSchema = z.object({
  summary: z.string(),
  priority: z.enum(["High", "Average", "Low"]),
  reportedBy: z.string().email(),
  link: z.string().url(),
});

// Helper to extract ID from URL path segments
const extractIdFromPath = (url: string, pathSegment: string): number | null => {
  try {
    const urlObj = new URL(url);
    const segments = urlObj.pathname.split("/");
    const index = segments.indexOf(pathSegment);
    if (index !== -1 && index + 1 < segments.length) {
      const id = parseInt(segments[index + 1], 10);
      return isNaN(id) ? null : id;
    }
    return null;
  } catch {
    return null;
  }
};

// Get template title from templateId
const getTemplateTitle = async (templateId: number): Promise<string | null> => {
  try {
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      select: { title: true },
    });
    return template?.title || null;
  } catch (error) {
    console.error("Error fetching template:", error);
    return null;
  }
};

// Get template title from formId (via the form's template)
const getTemplateTitleFromFormId = async (formId: number): Promise<string | null> => {
  try {
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: { template: { select: { title: true } } },
    });
    return form?.template.title || null;
  } catch (error) {
    console.error("Error fetching form:", error);
    return null;
  }
};

export const submitTicket = async (req: Request, res: Response) => {
  const parsed = ticketSchema.safeParse(req.body);

  if (!parsed.success) {
    console.error("Validation error:", parsed.error);
    res.status(400).json({
      error: "Invalid ticket data",
      details: parsed.error.errors,
    });
    return;
  }

  let templateId: number | null = null;
  let formId: number | null = null;
  let templateTitle: string | null = null;

  // Check for templateId in various URL patterns
  templateId = extractIdFromPath(parsed.data.link, "check-form") || extractIdFromPath(parsed.data.link, "manage-template");

  // If no templateId found, check for formId
  if (!templateId) {
    formId = extractIdFromPath(parsed.data.link, "forms");
  }

  // Get template title if we have an ID
  if (templateId) {
    templateTitle = await getTemplateTitle(templateId);
  } else if (formId) {
    templateTitle = await getTemplateTitleFromFormId(formId);
  }

  const ticket = {
    reportedBy: parsed.data.reportedBy,
    template: templateTitle || "Unknown",
    templateId,
    formId,
    link: parsed.data.link,
    priority: parsed.data.priority,
    summary: parsed.data.summary,
  };

  const fileName = `ticket-${Date.now()}.json`;
  const dropboxPath = `/SupportTickets/${fileName}`;
  const fileContent = JSON.stringify(ticket, null, 2);
  const dbx = new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN! });

  try {
    await dbx.filesUpload({
      path: dropboxPath,
      contents: fileContent,
      mode: { ".tag": "add" },
    });

    res.status(201).json({
      message: "Ticket uploaded to Dropbox",
      file: fileName,
      ticketInfo: {
        templateTitle,
        templateId,
        formId,
      },
    });
    return;
  } catch (error) {
    console.error("Dropbox upload error:", error);
    res.status(500).json({
      error: "Failed to upload ticket to Dropbox",
      details: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};
