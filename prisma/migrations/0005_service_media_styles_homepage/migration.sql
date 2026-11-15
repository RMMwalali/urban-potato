-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "styleId" TEXT,
ADD COLUMN     "styleName" TEXT;

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "featureConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "homeLogo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "homeServices" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "logoId" TEXT;

-- CreateTable
CREATE TABLE "ServiceStyle" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2),
    "durationMin" INTEGER,
    "position" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceStyle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "serviceId" TEXT,
    "styleId" TEXT,
    "mime" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "thumb" BYTEA,
    "alt" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceStyle_serviceId_idx" ON "ServiceStyle"("serviceId");

-- CreateIndex
CREATE INDEX "Media_businessId_kind_idx" ON "Media"("businessId", "kind");

-- CreateIndex
CREATE INDEX "Media_serviceId_position_idx" ON "Media"("serviceId", "position");

-- AddForeignKey
ALTER TABLE "ServiceStyle" ADD CONSTRAINT "ServiceStyle_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "ServiceStyle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
