export type ValidityScore = {
  score: number;
  total: number;
  percentage: number;
};

export function getValidityColor(score: number): string {
  if (score >= 900) return 'high';
  if (score >= 700) return 'medium';
  if (score >= 500) return 'low';
  return 'critical';
}

export function getValidityLabel(score: number): string {
  if (score >= 900) return 'High Validity';
  if (score >= 700) return 'Medium Validity';
  if (score >= 500) return 'Low Validity';
  return 'Critical Validity';
}
