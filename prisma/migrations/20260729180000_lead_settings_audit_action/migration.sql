-- AlterEnum
-- Trace les modifications des reglages de cycle de vie des leads
-- (souffrance, expiration, paliers de zone, acheteurs max) faites
-- depuis /admin/configuration.
ALTER TYPE "AuditAction" ADD VALUE 'LEAD_SETTINGS_UPDATED';
