-- Add encrypted key storage for attribution app keys
ALTER TABLE "AttributionAppKey" ADD COLUMN "keyCipherText" TEXT;
ALTER TABLE "AttributionAppKey" ADD COLUMN "keyIv" TEXT;
ALTER TABLE "AttributionAppKey" ADD COLUMN "keyTag" TEXT;
