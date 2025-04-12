/*
  Warnings:

  - You are about to drop the column `link` on the `Submission` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "link",
ADD COLUMN     "content" TEXT;
