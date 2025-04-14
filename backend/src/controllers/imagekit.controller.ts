import { Request, Response } from "express";
import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

export const getImageKitAuth = (req: Request, res: Response): void => {
  try {
    const authParams = imagekit.getAuthenticationParameters();
    res.json(authParams);
  } catch (err) {
    console.error("Error generating auth params:", err);
    res.status(500).json({ error: "Failed to generate auth params" });
  }
};
