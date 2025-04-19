/*
  Warnings:

  - A unique constraint covering the columns `[templateId,userId]` on the table `Form` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Form_templateId_userId_key" ON "Form"("templateId", "userId");

-- CreateIndex
CREATE INDEX "Template_title_idx" ON "Template"("title");

-- CreateIndex
CREATE INDEX "Template_description_idx" ON "Template"("description");

-- CreateIndex
CREATE INDEX "Template_userId_idx" ON "Template"("userId");

-- CreateIndex
CREATE INDEX "Template_topicId_idx" ON "Template"("topicId");

-- CreateIndex
CREATE INDEX "Template_isPublic_idx" ON "Template"("isPublic");

-- CreateIndex
CREATE INDEX "Template_isPublished_idx" ON "Template"("isPublished");
