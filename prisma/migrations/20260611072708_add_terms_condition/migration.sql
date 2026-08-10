-- AlterTable
ALTER TABLE "User" ADD COLUMN     "termsConditionsId" TEXT,
ADD COLUMN     "termsConsentTimestamp" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "TermsConditions" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TermsConditions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TermsConditions_version_key" ON "TermsConditions"("version");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_termsConditionsId_fkey" FOREIGN KEY ("termsConditionsId") REFERENCES "TermsConditions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
