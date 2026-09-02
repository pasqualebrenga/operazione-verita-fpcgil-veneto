export type ContractRow = {
  inquadramento: string;
  area: string;
  tabellare2024: number;
  tabellare2027: number;
  aumento2025: number;
  aumento2026: number;
  aumento2027: number;
  arretrati: number;
  ivc2025: number;
  ivc2026: number;
  comparto2026: number;
  compartoIncremento2027: number;
};

export type LocalDifferentialRule = {
  area: string;
  annualValue: number;
  maxCount: number;
};

const levels: Record<string, [string, number, number][]> = {
  "Operatori": [["A1",21399.16,22815.51],["A2",21659.31,23075.66],["A3",22062.09,23478.44],["A4",22405.33,23821.68],["A5",22815.12,24231.47],["A6",23176.61,24592.96]],
  "Operatori esperti": [["B1",22298.50,23774.39],["B2",22626.47,24102.36],["B3",23428.99,24904.88],["B4",23746.50,25222.39],["B5",24103.42,25579.31],["B6",24499.26,25975.15],["B7",25357.71,26833.60],["B8",25878.15,27354.04]],
  "Istruttori": [["C1",25066.98,26726.17],["C2",25604.56,27263.75],["C3",26233.63,27892.82],["C4",26971.74,28630.93],["C5",27880.32,29539.51],["C6",28600.95,30260.14]],
  "Funzionari ed EQ": [["D1",27206.95,29007.71],["D2",28399.85,30200.61],["D3",30844.82,32645.58],["D4",32039.19,33839.95],["D5",33333.54,35134.30],["D6",35500.96,37301.72],["D7",37199.41,39000.17]],
};

const economics: Record<string, [number, number, number, number, number, number, number, number]> = {
  "Operatori": [38.63,78.12,108.95,973.93,144.86,164.60,22.68,9.74],
  "Operatori esperti": [40.22,81.33,113.53,1013.74,150.92,171.50,27.52,11.82],
  "Istruttori": [45.20,91.40,127.63,1139.13,169.67,192.80,32.06,13.77],
  "Funzionari ed EQ": [49.04,99.18,138.52,1235.83,184.19,209.30,36.33,15.61],
};

export const contractRows: ContractRow[] = Object.entries(levels).flatMap(([area, rows]) => {
  const [aumento2025, aumento2026, aumento2027, arretrati, ivc2025, ivc2026, comparto2026, compartoIncremento2027] = economics[area];
  return rows.map(([inquadramento, tabellare2024, tabellare2027]) => ({ inquadramento, area, tabellare2024, tabellare2027, aumento2025, aumento2026, aumento2027, arretrati, ivc2025, ivc2026, comparto2026, compartoIncremento2027 }));
});

export const contractGroups = Object.entries(levels).map(([label, rows]) => ({ label, values: rows.map(([value]) => value) }));

export const localDifferentialRules: LocalDifferentialRule[] = [
  { area:"Funzionari ed EQ", annualValue:1600, maxCount:6 },
  { area:"Istruttori", annualValue:750, maxCount:5 },
  { area:"Operatori esperti", annualValue:650, maxCount:5 },
  { area:"Operatori", annualValue:550, maxCount:5 },
];

export function findContractRow(inquadramento: string) {
  return contractRows.find((row) => row.inquadramento === inquadramento) ?? contractRows.find((row) => row.inquadramento === "C1")!;
}

export function differentialRuleForLocalArea(area: string) {
  return localDifferentialRules.find((item) => item.area === area)!;
}
