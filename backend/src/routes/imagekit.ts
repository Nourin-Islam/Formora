import express from "express";
import ImageKit from "imagekit";

const router = express.Router();

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

// Route to generate auth params for frontend
router.get("/auth", (req, res) => {
  // const authParams = imagekit.getAuthenticationParameters();
  // res.json(authParams);
  try {
    const authParams = imagekit.getAuthenticationParameters();
    // console.log("Auth params:", authParams); // Log the auth params for debugging
    res.json(authParams);
  } catch (err) {
    console.error("Error generating auth params:", err);
    res.status(500).json({ error: "Failed to generate auth params" });
  }
});

export default router;
