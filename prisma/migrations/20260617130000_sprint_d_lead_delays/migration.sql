-- Sprint D : ajuste les délais de statut des leads (données AppConfig).
-- Pas de changement de schéma. Idempotent.

-- Expiration globale : 24h -> 72h. N'affecte que les nouveaux leads
-- (les leads existants gardent leur expiresAt snapshoté à la création).
UPDATE "AppConfig" SET value = '72', "updatedAt" = now()
WHERE key = 'LEAD_GLOBAL_TIMEOUT_HOURS';

-- Nouveau seuil "en souffrance" (alerte admin) = 24h après création, tunable.
INSERT INTO "AppConfig" (key, value, "valueType", description, "updatedAt")
VALUES (
  'LEAD_SOUFFRANCE_HOURS',
  '24',
  'int',
  'Seuil (heures) avant qu''un lead actif sans acheteur soit considéré « en souffrance » (alerte admin, basé sur createdAt).',
  now()
)
ON CONFLICT (key) DO NOTHING;
