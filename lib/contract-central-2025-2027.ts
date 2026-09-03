export type CentralProfile = {
  id: string;
  label: string;
  section?: string;
  increase2025: number;
  increase2026: number;
  increase2027: number;
  salary2027: number;
  arrears?: number;
  differentialArea?: "funzionari" | "assistenti" | "operatori";
};

export type CentralDifferentialRule = {
  areaId: "funzionari" | "assistenti" | "operatori";
  annualValue: number;
  maxCount: number;
};

function annualWithThirteenth(twelveMonths: number) {
  return Math.round((twelveMonths + twelveMonths / 12) * 100) / 100;
}

export const centralProfiles: CentralProfile[] = [
  {
    id: "ep",
    label: "Elevate Professionalità",
    increase2025: 78.1,
    increase2026: 156.2,
    increase2027: 221,
    salary2027: annualWithThirteenth(37286.49),
    arrears: 1907.38,
  },
  {
    id: "funzionari",
    label: "Funzionari",
    increase2025: 57.2,
    increase2026: 114.4,
    increase2027: 161.8,
    salary2027: annualWithThirteenth(27304.73),
    arrears: 1396.92,
    differentialArea: "funzionari",
  },
  {
    id: "assistenti",
    label: "Assistenti",
    increase2025: 47.1,
    increase2026: 94.2,
    increase2027: 133.2,
    salary2027: annualWithThirteenth(22482.77),
    arrears: 1150.38,
    differentialArea: "assistenti",
  },
  {
    id: "operatori",
    label: "Operatori",
    increase2025: 44.7,
    increase2026: 89.5,
    increase2027: 126.6,
    salary2027: annualWithThirteenth(21366.84),
    arrears: 1092.2,
    differentialArea: "operatori",
  },
  {
    id: "pii-4-super",
    label: "Professionista II qualifica · PII 4 super",
    section: "ENAC · ANSFISA · ANSV",
    increase2025: 97.24,
    increase2026: 194.49,
    increase2027: 275.08,
    salary2027: annualWithThirteenth(46421.16),
  },
  {
    id: "pii-4",
    label: "Professionista II qualifica · PII 4",
    section: "ENAC · ANSFISA · ANSV",
    increase2025: 90.63,
    increase2026: 181.26,
    increase2027: 256.37,
    salary2027: annualWithThirteenth(43264.25),
  },
  {
    id: "pii-3",
    label: "Professionista II qualifica · PII 3",
    section: "ENAC · ANSFISA · ANSV",
    increase2025: 80.74,
    increase2026: 161.49,
    increase2027: 228.4,
    salary2027: annualWithThirteenth(38544.4),
  },
  {
    id: "pii-2",
    label: "Professionista II qualifica · PII 2",
    section: "ENAC · ANSFISA · ANSV",
    increase2025: 70.91,
    increase2026: 141.82,
    increase2027: 200.58,
    salary2027: annualWithThirteenth(33849.65),
  },
  {
    id: "pii-1",
    label: "Professionista II qualifica · PII 1",
    section: "ENAC · ANSFISA · ANSV",
    increase2025: 62.13,
    increase2026: 124.26,
    increase2027: 175.75,
    salary2027: annualWithThirteenth(29659.2),
  },
  {
    id: "ispettore-specialista",
    label: "Ispettore specialista",
    section: "ENAC · ANSFISA · ANSV",
    increase2025: 57.2,
    increase2026: 114.4,
    increase2027: 161.8,
    salary2027: annualWithThirteenth(33837.44),
  },
];

export const centralDifferentialRules: CentralDifferentialRule[] = [
  { areaId: "funzionari", annualValue: 2250, maxCount: 5 },
  { areaId: "assistenti", annualValue: 1250, maxCount: 5 },
  { areaId: "operatori", annualValue: 800, maxCount: 2 },
];

export function findCentralProfile(id: string) {
  return centralProfiles.find((profile) => profile.id === id) ?? centralProfiles[1];
}

export function differentialRuleForCentralProfile(profile: CentralProfile) {
  return centralDifferentialRules.find((rule) => rule.areaId === profile.differentialArea);
}
