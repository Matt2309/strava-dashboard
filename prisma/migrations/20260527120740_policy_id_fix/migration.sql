/*
  Warnings:

  - You are about to drop the column `acceptedPolicyId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_acceptedPolicyId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "acceptedPolicyId";
