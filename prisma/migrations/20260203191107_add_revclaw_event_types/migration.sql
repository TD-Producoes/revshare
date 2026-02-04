-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventType" ADD VALUE 'REVCLAW_AGENT_REGISTERED';
ALTER TYPE "EventType" ADD VALUE 'REVCLAW_AGENT_CLAIMED';
ALTER TYPE "EventType" ADD VALUE 'REVCLAW_TOKEN_EXCHANGED';
ALTER TYPE "EventType" ADD VALUE 'REVCLAW_TOKEN_REFRESHED';
ALTER TYPE "EventType" ADD VALUE 'REVCLAW_INSTALLATION_REVOKED';
ALTER TYPE "EventType" ADD VALUE 'REVCLAW_INTENT_CREATED';
ALTER TYPE "EventType" ADD VALUE 'REVCLAW_INTENT_APPROVED';
ALTER TYPE "EventType" ADD VALUE 'REVCLAW_INTENT_DENIED';
ALTER TYPE "EventType" ADD VALUE 'REVCLAW_INTENT_EXECUTED';
