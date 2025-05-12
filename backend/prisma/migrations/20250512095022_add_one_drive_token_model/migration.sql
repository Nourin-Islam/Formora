-- CreateTable
CREATE TABLE "OneDriveToken" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "OneDriveToken_pkey" PRIMARY KEY ("id")
);
