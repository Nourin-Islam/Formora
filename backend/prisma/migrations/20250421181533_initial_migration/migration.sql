-- DropForeignKey
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_questionId_fkey";

-- DropForeignKey
ALTER TABLE "Form" DROP CONSTRAINT "Form_templateId_fkey";

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_templateId_fkey";

-- AlterTable
ALTER TABLE "Answer" ALTER COLUMN "questionId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Form" ALTER COLUMN "templateId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Question" ALTER COLUMN "templateId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "form_submissions_view" (
    "form_id" INTEGER NOT NULL,
    "templateId" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_name" TEXT NOT NULL,
    "submission_date" TIMESTAMP(3) NOT NULL,
    "question_id" INTEGER NOT NULL,
    "question_title" TEXT NOT NULL,
    "answer" TEXT NOT NULL
);

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;
