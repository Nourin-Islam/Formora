import { prisma } from "../lib/prisma";

export async function getValidAccessToken(): Promise<string> {
  const tokenRecord = await prisma.dropboxToken.findFirst();

  if (!tokenRecord) {
    throw new Error("No Dropbox token found in database");
  }

  const now = Date.now();
  const expiresAt = new Date(tokenRecord.expiresAt).getTime();

  if (now < expiresAt - 60_000) {
    return tokenRecord.accessToken;
  }

  // Refresh token
  const res = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${process.env.DROPBOX_APP_KEY}:${process.env.DROPBOX_APP_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokenRecord.refreshToken,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Error refreshing token:", errorText);
    throw new Error("Failed to refresh Dropbox token");
  }

  const json = await res.json();

  const newAccessToken = json.access_token;
  const expiresIn = json.expires_in;

  await prisma.dropboxToken.update({
    where: { id: tokenRecord.id },
    data: {
      accessToken: newAccessToken,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    },
  });

  return newAccessToken;
}
