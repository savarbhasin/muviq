/*
  Warnings:

  - You are about to drop the column `remarks` on the `Submission` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "remarks",
ADD COLUMN     "feedback" TEXT;
