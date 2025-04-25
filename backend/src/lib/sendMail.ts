// @ts-ignore
import nodemailer from "nodemailer";
import { prisma } from "../lib/prisma.ts";

interface EmailFormData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Sends an email using the configured nodemailer transporter
 */
export async function sendEmail({ to, subject, text, html }: EmailFormData) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    service: "Gmail",
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject,
    text,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("Email sent:", info.response);
  return info;
}

/**
 * Generates HTML for a form submission email
 */
export async function generateFormSubmissionEmail(formId: number): Promise<string> {
  // Get all the data needed for the email
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: {
      template: {
        select: {
          title: true,
          description: true,
        },
      },
      answers: {
        include: {
          question: true,
        },
      },
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!form || !form.template) {
    throw new Error("Form or template not found");
  }

  // Format the submission date
  const submissionDate = new Date(form.updatedAt).toLocaleString();

  // Start building the HTML email
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .title { font-size: 22px; font-weight: bold; color: #0066cc; margin-bottom: 5px; }
        .subtitle { font-size: 16px; margin-bottom: 15px; color: #666; }
        .section { margin-bottom: 20px; }
        .question { font-weight: bold; margin-bottom: 5px; }
        .answer { margin-bottom: 15px; padding-left: 15px; }
        .footer { font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="title">${form.template.title}</div>
          <div class="subtitle">Form submission copy</div>
        </div>
        
        <p>Dear ${form.user.name},</p>
        
        <p>Thank you for your form submission. Below is a copy of your responses:</p>
        
        <div class="section">
          <p><strong>Submission Date:</strong> ${submissionDate}</p>
        </div>

        <div class="section">
          <p><strong>Form Description:</strong></p>
          <p>${form.template.description}</p>
        </div>
        
        <div class="section">
          <p><strong>Your Responses:</strong></p>
  `;

  // Add each question and answer
  for (const answer of form.answers) {
    if (!answer.question) continue;

    let displayValue = answer.value;

    // Format the answer based on question type
    if (answer.question.questionType === "CHECKBOX") {
      // Handle multi-option checkboxes
      if (answer.question.options && typeof answer.question.options === "object") {
        const options = answer.question.options as any[];
        if (options.length > 0) {
          // If it's a comma-separated list of selected options
          const selectedValues = answer.value.split(",");
          displayValue = selectedValues.join(", ");
        } else {
          // If it's a single checkbox (boolean)
          displayValue = answer.value === "true" ? "Yes" : "No";
        }
      }
    }

    html += `
          <div>
            <p class="question">${answer.question.title}</p>
            <p class="answer">${displayValue}</p>
          </div>
    `;
  }

  // Close the HTML
  html += `
        </div>
        
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}

/**
 * Sends a form submission confirmation email to the user
 */
export async function sendFormSubmissionEmail(formId: number, userEmail: string): Promise<void> {
  try {
    // Generate the HTML email content
    const html = await generateFormSubmissionEmail(formId);

    // Get form title for the email subject
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        template: {
          select: { title: true },
        },
      },
    });

    if (!form || !form.template) {
      throw new Error("Form or template not found");
    }

    // Send the email
    await sendEmail({
      to: userEmail,
      subject: `Your form submission: ${form.template.title}`,
      html,
    });
  } catch (error) {
    console.error("Failed to send form submission email:", error);
    throw error;
  }
}
