export type HealthArea = {
  id: string;
  label: string;
  section?: string;
  increase2025: number;
  increase2026: number;
  increase2027: number;
  arrears: number;
  salary2027: number;
  overtime?: [number, number, number, number];
};

export type HealthAllowance = {
  id: string;
  label: string;
  areas: string[];
  increase: Record<string, number>;
  arrears: Record<string, number>;
};

export type HealthLevel = {
  id: string;
  areaId: string;
  label: string;
  dep: number;
  overtime?: [number, number, number, number];
};

export type HealthDepRule = {
  areaId: string;
  annualValue: number;
  maxCount: number;
};

export const healthAreas: HealthArea[] = [
  { id:"eq", label:"Elevata Qualificazione", increase2025:70.30, increase2026:140.50, increase2027:181.00, arrears:1945.68, salary2027:39873.70 },
  { id:"professionisti", label:"Professionisti della salute e Funzionari", increase2025:50.50, increase2026:101.10, increase2027:130.20, arrears:1398.90, salary2027:28688.11, overtime:[15.32,17.62,19.92,22.99] },
  { id:"assistenti", label:"Assistenti", increase2025:46.60, increase2026:93.20, increase2027:120.00, arrears:1290.48, salary2027:26435.27, overtime:[14.12,16.24,18.36,21.18] },
  { id:"operatori", label:"Operatori", increase2025:43.70, increase2026:87.40, increase2027:112.60, arrears:1209.99, salary2027:24804.59, overtime:[13.25,15.24,17.23,19.88] },
  { id:"supporto", label:"Personale di supporto", increase2025:41.40, increase2026:82.90, increase2027:106.70, arrears:1147.15, salary2027:23507.74, overtime:[12.56,14.44,16.32,18.84] },
  { id:"ricercatore", label:"Ricercatore sanitario", section:"IRCCS e IZS", increase2025:54.20, increase2026:108.50, increase2027:139.70, arrears:1501.35, salary2027:30665.65 },
  { id:"collaboratore-ricerca", label:"Collaboratore professionale di ricerca sanitaria", section:"IRCCS e IZS", increase2025:50.50, increase2026:101.10, increase2027:130.20, arrears:1398.90, salary2027:28688.11 },
];

export const healthAllowances: HealthAllowance[] = [
  { id:"none", label:"Nessuna indennità specifica", areas:healthAreas.map((area) => area.id), increase:{}, arrears:{} },
  { id:"infermieristica", label:"Specificità infermieristica", areas:["professionisti","assistenti","operatori"], increase:{professionisti:93.35,assistenti:83.23,operatori:78.07}, arrears:{professionisti:1026.85,assistenti:915.53,operatori:858.77} },
  { id:"tutela", label:"Tutela del malato e promozione della salute", areas:["professionisti","assistenti","operatori"], increase:{professionisti:69.90,assistenti:62.40,operatori:58.50}, arrears:{professionisti:768.90,assistenti:686.40,operatori:643.50} },
  { id:"ostetrica", label:"Ostetrica — equiparata all’indennità infermieristica", areas:["professionisti"], increase:{professionisti:93.35}, arrears:{professionisti:1026.85} },
];

const level = (areaId: string, id: string, dep: number, overtime?: [number, number, number, number]): HealthLevel => ({ id:`${areaId}-${id.toLowerCase()}`, areaId, label:id, dep, overtime });

export const healthLevels: HealthLevel[] = [
  level("eq","Nessuna ex categoria / DEP",0),
  level("professionisti","D",0,[15.32,17.62,19.92,22.99]),
  level("professionisti","D1",927.45,[15.82,18.19,20.57,23.73]),
  level("professionisti","D2",1759.12,[16.26,18.70,21.14,24.40]),
  level("professionisti","D3",2595.96,[16.71,19.22,21.73,25.07]),
  level("professionisti","D4",3439.19,[17.16,19.74,22.31,25.74]),
  level("professionisti","D5",4347.62,[17.65,20.29,22.94,26.47]),
  level("professionisti","D6",5412.18,[18.22,20.95,23.68,27.32]),
  level("professionisti","DS",1977.54,[16.38,18.84,21.30,24.57]),
  level("professionisti","DS1",3040.96,[16.95,19.49,22.03,25.42]),
  level("professionisti","DS2",4133.12,[17.53,20.16,22.79,26.30]),
  level("professionisti","DS3",5257.74,[18.13,20.85,23.57,27.20]),
  level("professionisti","DS4",6231.95,[18.65,21.45,24.25,27.98]),
  level("professionisti","DS5",7210.08,[19.18,22.05,24.93,28.76]),
  level("professionisti","DS6",8584.53,[19.91,22.90,25.88,29.87]),
  level("assistenti","C",0,[14.12,16.24,18.36,21.18]),
  level("assistenti","C1",719.14,[14.51,16.68,18.86,21.76]),
  level("assistenti","C2",1579.25,[14.97,17.21,19.45,22.45]),
  level("assistenti","C3",2422.48,[15.42,17.73,20.04,23.12]),
  level("assistenti","C4",3661.52,[16.08,18.49,20.90,24.12]),
  level("assistenti","C5",4951.53,[16.77,19.28,21.80,25.15]),
  level("operatori","BS",0,[13.25,15.24,17.23,19.88]),
  level("operatori","BS1",676.72,[13.61,15.65,17.70,20.42]),
  level("operatori","BS2",1310.95,[13.95,16.04,18.14,20.93]),
  level("operatori","BS3",1767.90,[14.19,16.32,18.45,21.29]),
  level("operatori","BS4",2521.97,[14.60,16.79,18.98,21.90]),
  level("operatori","BS5",3301.79,[15.01,17.27,19.52,22.52]),
  level("supporto","A",0,[12.56,14.44,16.32,18.84]),
  level("supporto","A1",0,[12.56,14.44,16.32,18.84]),
  level("supporto","A2",0,[12.56,14.44,16.32,18.84]),
  level("supporto","A3",225.68,[12.68,14.58,16.48,19.02]),
  level("supporto","A4",568.43,[12.86,14.79,16.72,19.29]),
  level("supporto","A5",916.00,[13.05,15.00,16.96,19.57]),
  level("supporto","B",0,[12.56,14.44,16.32,18.84]),
  level("supporto","B1",598.85,[12.88,14.81,16.74,19.32]),
  level("supporto","B2",1201.42,[13.20,15.18,17.16,19.80]),
  level("supporto","B3",1582.66,[13.40,15.41,17.42,20.10]),
  level("supporto","B4",2061.10,[13.66,15.71,17.76,20.49]),
  level("supporto","B5",2528.32,[13.91,15.99,18.08,20.86]),
  level("ricercatore","Nessuna ex categoria / DEP",0),
  level("collaboratore-ricerca","Nessuna ex categoria / DEP",0),
];

export const healthDepRules: HealthDepRule[] = [
  { areaId:"professionisti", annualValue:1200, maxCount:7 },
  { areaId:"assistenti", annualValue:1000, maxCount:6 },
  { areaId:"operatori", annualValue:800, maxCount:6 },
  { areaId:"supporto", annualValue:700, maxCount:6 },
];

export function findHealthArea(id: string) {
  return healthAreas.find((area) => area.id === id) ?? healthAreas[1];
}

export function findHealthAllowance(id: string, areaId: string) {
  const allowance = healthAllowances.find((item) => item.id === id && item.areas.includes(areaId));
  return allowance ?? healthAllowances[0];
}

export function levelsForHealthArea(areaId: string) {
  return healthLevels.filter((item) => item.areaId === areaId);
}

export function findHealthLevel(id: string, areaId: string) {
  return healthLevels.find((item) => item.id === id && item.areaId === areaId) ?? levelsForHealthArea(areaId)[0];
}

export function depRuleForHealthArea(areaId: string) {
  return healthDepRules.find((item) => item.areaId === areaId);
}
