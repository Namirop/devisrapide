import { type CSSProperties } from "react";

import { Text } from "@react-email/components";

import { rowLabel, rowText } from "./theme";

/**
 * Ligne "label : valeur" des cartes récapitulatives (lead, client,
 * recharge). `valueStyle` permet de surligner une valeur (montant en
 * vert, référence en mono) sans dupliquer le markup.
 */
export function EmailRow({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: CSSProperties;
}) {
  return (
    <Text style={rowText}>
      <span style={rowLabel}>{label}&nbsp;:</span>{" "}
      <strong style={valueStyle}>{value}</strong>
    </Text>
  );
}
