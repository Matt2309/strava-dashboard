-- AlterTable
ALTER TABLE "User" ADD COLUMN     "healthDataConsent" BOOLEAN,
ADD COLUMN     "healthDataConsentTimestamp" TIMESTAMP(3);
