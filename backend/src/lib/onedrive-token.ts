import { prisma } from "./prisma";

const clientId = process.env.ONEDRIVE_CLIENT_ID!;
const clientSecret = process.env.ONEDRIVE_CLIENT_SECRET!;
const redirectUri = process.env.ONEDRIVE_REDIRECT_URI!;
const authCode = process.env.ONEDRIVE_AUTH_CODE!; // Used ONLY once

const tokenUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/token";

const SCOPE = "Files.ReadWrite offline_access";

export async function getValidAccessToken(): Promise<string> {
  const tokenRecord = await prisma.oneDriveToken.findUnique({ where: { id: 1 } });

  if (tokenRecord?.accessToken && tokenRecord.expiresAt && tokenRecord.expiresAt > new Date()) {
    return tokenRecord.accessToken;
  }

  if (!tokenRecord?.refreshToken) {
    return await exchangeCodeForToken(); // First-time code exchange
  }

  return await refreshAccessToken(tokenRecord.refreshToken);
}

async function exchangeCodeForToken(): Promise<string> {
  const params = new URLSearchParams({
    client_id: clientId,
    scope: SCOPE,
    code: authCode,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
    client_secret: clientSecret,
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!res.ok) throw new Error("Failed to exchange auth code");

  const data = await res.json();

  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  await prisma.oneDriveToken.upsert({
    where: { id: 1 },
    update: {
      accessToken: data.access_token.replace(/\s+/g, ""),
      refreshToken: data.refresh_token.replace(/\s+/g, ""),
      expiresAt,
    },
    create: {
      id: 1,
      accessToken: data.access_token.replace(/\s+/g, ""),
      refreshToken: data.refresh_token.replace(/\s+/g, ""),
      expiresAt,
    },
  });

  return data.access_token;
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
    scope: SCOPE,
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!res.ok) throw new Error("Failed to refresh token");

  const data = await res.json();
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  await prisma.oneDriveToken.update({
    where: { id: 1 },
    data: {
      accessToken: data.access_token.replace(/\s+/g, ""),
      refreshToken: data.refresh_token.replace(/\s+/g, ""),
      expiresAt,
    },
  });

  return data.access_token;
}
