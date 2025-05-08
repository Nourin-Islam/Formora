import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import getSalesforceAccessData from "../lib/getSalesforceAccessData";

export const salesforceSyncHandler = async (req: Request, res: Response) => {
  const { access_token, instance_url } = await getSalesforceAccessData();
  const { name, email, companyName, jobTitle } = req.body;

  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const userId = req.user.id;
  const salesforceAccountId = req.user.salesforceAccountId;

  if (salesforceAccountId) {
    res.status(400).json({ message: "Already synced with Salesforce" });
    return;
  }

  if (!name || !email || !companyName || !jobTitle) {
    res.status(400).json({ message: "Missing required fields" });
    return;
  }

  try {
    // Create Account in Salesforce
    const accountRes = await fetch(`${instance_url}/services/data/v58.0/sobjects/Account/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ Name: companyName }),
    });

    if (!accountRes.ok) {
      const errorData = await accountRes.json();
      throw new Error(`Salesforce Account creation failed: ${JSON.stringify(errorData)}`);
    }

    const accountData = await accountRes.json();
    const accountId = accountData.id;

    // Create Contact linked to Account
    const contactRes = await fetch(`${instance_url}/services/data/v58.0/sobjects/Contact/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        FirstName: name.split(" ")[0],
        LastName: name.split(" ").slice(1).join(" ") || "User",
        Email: email,
        Title: jobTitle,
        AccountId: accountId,
      }),
    });

    if (!contactRes.ok) {
      const errorData = await contactRes.json();
      throw new Error(`Salesforce Contact creation failed: ${JSON.stringify(errorData)}`);
    }

    // Save Account ID to database
    await prisma.user.update({
      where: { id: Number(userId) },
      data: { salesforceAccountId: accountId },
    });

    res.status(200).json({ message: "Synced with Salesforce" });
  } catch (error) {
    console.error("Salesforce sync error:", error);
    res.status(500).json({ error: "Salesforce sync failed" });
  }
};
