-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('POLICY_ACCEPTED', 'TERMS_ACCEPTED', 'HEALTH_DATA_CONSENT_GRANTED', 'HEALTH_DATA_CONSENT_REVOKED', 'HEALTH_DATA_ERASED', 'DATA_EXPORTED', 'ACCOUNT_DELETED', 'USER_REGISTERED', 'LOGIN', 'LOGOUT');

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "isPseudonymized" BOOLEAN NOT NULL DEFAULT false,
    "action" "AuditAction" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_subjectId_createdAt_idx" ON "audit_logs"("subjectId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
