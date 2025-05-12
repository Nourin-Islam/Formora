import { Request, Response } from "express";
import { z } from "zod";
import { getValidAccessToken } from "../lib/onedrive-token";

import { prisma } from "../lib/prisma";

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

  templateId = extractIdFromPath(parsed.data.link, "check-form") || extractIdFromPath(parsed.data.link, "manage-template");

  if (!templateId) {
    formId = extractIdFromPath(parsed.data.link, "forms") || extractIdFromPath(parsed.data.link, "edit-form");
  }

  if (templateId) {
    templateTitle = await getTemplateTitle(templateId);
  } else if (formId) {
    templateTitle = await getTemplateTitleFromFormId(formId);
  }

  const ticket = {
    reportedBy: parsed.data.reportedBy,
    template: templateTitle || "Unknown",
    link: parsed.data.link,
    priority: parsed.data.priority,
    summary: parsed.data.summary,
  };
  console.log("Ticket data:", ticket);
  const fileName = `ticket-${Date.now()}.json`;
  const fileContent = JSON.stringify(ticket, null, 2);

  try {
    const accessToken = await getValidAccessToken(); // 🔁 Use fresh token
    const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/root:/${fileName}:/content`;

    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: fileContent,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OneDrive upload failed: ${response.status} ${errorText}`);
    }

    const fileData = await response.json();

    res.status(201).json({
      message: "Ticket uploaded successfully to OneDrive.",
      // fileName: fileData.name,
      // webUrl: fileData.webUrl,
      // ticketInfo: {
      //   templateTitle,
      //   templateId,
      //   formId,
      // },
    });
  } catch (error) {
    console.error("OneDrive upload error:", error);
    res.status(500).json({
      error: "Failed to upload ticket to OneDrive.",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};
