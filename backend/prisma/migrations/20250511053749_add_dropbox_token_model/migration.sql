-- CreateTable
CREATE TABLE "DropboxToken" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DropboxToken_pkey" PRIMARY KEY ("id")
);
