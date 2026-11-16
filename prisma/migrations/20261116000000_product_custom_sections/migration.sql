-- Product page: custom sections, editable property-column title, table top banner title.
-- Additive only (nullable columns), safe on the existing production data.
-- IF NOT EXISTS: also safe if a column was already added earlier via `prisma db push`.

-- AlterTable
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "tableTopHeader" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "tablePropertyHeader" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "customSections" JSONB DEFAULT '[]';
