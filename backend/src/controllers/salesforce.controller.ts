import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import axios from "axios";
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
    const accountRes = await axios.post(`${instance_url}/services/data/v58.0/sobjects/Account/`, { Name: companyName }, { headers: { Authorization: `Bearer ${access_token}` } });

    const accountId = accountRes.data.id;

    // Create Contact linked to Account
    await axios.post(
      `${instance_url}/services/data/v58.0/sobjects/Contact/`,
      {
        FirstName: name.split(" ")[0],
        LastName: name.split(" ").slice(1).join(" ") || "User",
        Email: email,
        Title: jobTitle,
        AccountId: accountId,
      },
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    // Save Account ID to database
    await prisma.user.update({
      where: { id: Number(userId) },
      data: { salesforceAccountId: accountId },
    });

    res.status(200).json({ message: "Synced with Salesforce" });
  } catch (error) {
    console.error("Salesforce sync error:", (error as any).response?.data || error);
    res.status(500).json({ error: "Salesforce sync failed" });
  }
};
