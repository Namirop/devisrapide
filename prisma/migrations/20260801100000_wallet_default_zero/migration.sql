-- Le default 100000 (1000 EUR) etait un reliquat de la phase de dev : tout pro
-- valide naissait avec 1000 EUR depensables, sans aucune WalletTransaction en
-- face. Le solde par defaut repasse a 0, le credit se fait par Stripe ou par
-- ajustement manuel admin (qui journalise).
--
-- Ne touche pas aux soldes existants : cette migration ne change que la valeur
-- appliquee aux futures lignes.
ALTER TABLE "ProProfile" ALTER COLUMN "walletBalanceCents" SET DEFAULT 0;
