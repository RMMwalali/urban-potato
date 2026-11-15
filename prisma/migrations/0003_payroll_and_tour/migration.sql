-- CreateEnum
CREATE TYPE "PayType" AS ENUM ('COMMISSION', 'SALARY', 'BASE_PLUS_COMMISSION', 'CHAIR_RENTAL');

-- CreateEnum
CREATE TYPE "PayRunStatus" AS ENUM ('DRAFT', 'APPROVED', 'PAID');

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "payrollConfig" JSONB;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "baseSalary" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "chairRent" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "payType" "PayType" NOT NULL DEFAULT 'COMMISSION',
ADD COLUMN     "payoutPhone" TEXT,
ADD COLUMN     "statutory" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tourDoneAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PayRun" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "PayRunStatus" NOT NULL DEFAULT 'DRAFT',
    "note" TEXT,
    "createdById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payslip" (
    "id" TEXT NOT NULL,
    "payRunId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "payType" "PayType" NOT NULL,
    "base" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "commission" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "services" INTEGER NOT NULL DEFAULT 0,
    "serviceRevenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tips" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "bonus" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "otherDeductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "advances" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "statutory" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "statutoryLines" JSONB,
    "chairRent" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "gross" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "note" TEXT,
    "paidAt" TIMESTAMP(3),
    "paidMethod" "PaymentMethod",
    "paidRef" TEXT,

    CONSTRAINT "Payslip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAdvance" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "payslipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffAdvance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PayRun_businessId_periodStart_idx" ON "PayRun"("businessId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "Payslip_payRunId_userId_key" ON "Payslip"("payRunId", "userId");

-- CreateIndex
CREATE INDEX "StaffAdvance_businessId_userId_idx" ON "StaffAdvance"("businessId", "userId");

-- AddForeignKey
ALTER TABLE "PayRun" ADD CONSTRAINT "PayRun_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_payRunId_fkey" FOREIGN KEY ("payRunId") REFERENCES "PayRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAdvance" ADD CONSTRAINT "StaffAdvance_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAdvance" ADD CONSTRAINT "StaffAdvance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAdvance" ADD CONSTRAINT "StaffAdvance_payslipId_fkey" FOREIGN KEY ("payslipId") REFERENCES "Payslip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

