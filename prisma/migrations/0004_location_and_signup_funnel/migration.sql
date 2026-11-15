-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "isShowcase" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "locationSource" TEXT,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "signupGeo" JSONB;

-- CreateTable
CREATE TABLE "SignupEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stage" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "ipHash" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "timezone" TEXT,
    "language" TEXT,
    "referrer" TEXT,
    "email" TEXT,
    "businessName" TEXT,
    "error" TEXT,
    "businessId" TEXT,

    CONSTRAINT "SignupEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SignupEvent_createdAt_idx" ON "SignupEvent"("createdAt");

-- CreateIndex
CREATE INDEX "SignupEvent_visitorId_idx" ON "SignupEvent"("visitorId");

-- CreateIndex
CREATE INDEX "SignupEvent_stage_createdAt_idx" ON "SignupEvent"("stage", "createdAt");
