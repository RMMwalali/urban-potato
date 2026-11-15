-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "discountPercent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "discountUntil" TIMESTAMP(3),
ADD COLUMN     "foundingMember" BOOLEAN NOT NULL DEFAULT false;

