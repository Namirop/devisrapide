import { Column, Row, Section } from "@react-email/components";

import { colors } from "./theme";

/**
 * Récapitulatif "label / valeur" (lead, client, recharge) rendu comme un
 * document : filets fins entre les lignes plutôt qu'une carte grise
 * imbriquée dans la feuille. Les valeurs s'alignent sur une même colonne,
 * ce qui rend le bloc scannable sans conteneur ni fond.
 *
 * `tone` colore la valeur seulement quand elle porte un état réel
 * (montant crédité, solde bas) — jamais pour décorer.
 *
 * Bordure posée sur les <td> (Column) et non sur la <table> (Row) :
 * c'est la seule technique fiable dans Outlook, qui ignore les bordures
 * de table sans border-collapse.
 */
export type Fact = {
  label: string;
  value: string;
  tone?: "success" | "danger" | "muted";
};

export function EmailFacts({ items }: { items: Fact[] }) {
  return (
    <Section style={wrap}>
      {items.map((fact, index) => {
        const cell = index === 0 ? {} : divider;
        return (
          <Row key={fact.label}>
            <Column style={{ ...labelCell, ...cell }}>{fact.label}</Column>
            <Column
              style={{
                ...valueCell,
                ...cell,
                ...(fact.tone ? toneStyles[fact.tone] : {}),
              }}
            >
              {fact.value}
            </Column>
          </Row>
        );
      })}
    </Section>
  );
}

const toneStyles = {
  success: { color: colors.success },
  danger: { color: colors.danger },
  muted: { color: colors.muted, fontWeight: 400 },
} as const;

const wrap = {
  margin: "20px 0 24px",
};

const divider = {
  borderTop: `1px solid ${colors.line}`,
};

const labelCell = {
  color: colors.muted,
  fontSize: "13px",
  lineHeight: "20px",
  padding: "9px 12px 9px 0",
  verticalAlign: "top" as const,
  width: "38%",
};

const valueCell = {
  color: colors.ink,
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  padding: "9px 0",
  verticalAlign: "top" as const,
  fontVariantNumeric: "tabular-nums" as const,
};
