export interface CpvCode {
  code: string;
  label: string;
  division: string;
}

// Curated CPV codes relevant to Swiss procurement contexts.
// Full CPV taxonomy: https://simap.ted.europa.eu/web/simap/cpv
// This list covers the key sectors for the initial use cases.
export const CPV_CODES: CpvCode[] = [
  // Construction & Civil Engineering (45)
  { code: "45000000", label: "Construction work", division: "45" },
  { code: "45100000", label: "Site preparation work", division: "45" },
  { code: "45112000", label: "Excavating and earthmoving work", division: "45" },
  { code: "45112500", label: "Earthmoving work", division: "45" },
  { code: "45112700", label: "Land restoration and reclamation work", division: "45" },
  { code: "45200000", label: "Works for complete or part construction and civil engineering work", division: "45" },
  { code: "45220000", label: "Engineering works and construction works", division: "45" },
  { code: "45221000", label: "Engineering works for bridges and tunnels", division: "45" },
  { code: "45221100", label: "Bridge construction works", division: "45" },
  { code: "45221200", label: "Tunnel construction works", division: "45" },
  { code: "45230000", label: "Construction work for pipelines, communication and power lines", division: "45" },
  { code: "45233000", label: "Construction, foundation and surface works for highways, roads", division: "45" },
  { code: "45233100", label: "Construction works for highways, roads", division: "45" },
  { code: "45240000", label: "Construction work for water projects", division: "45" },
  { code: "45241000", label: "Harbour construction work", division: "45" },
  { code: "45246000", label: "River regulation and flood control works", division: "45" },
  { code: "45260000", label: "Roof works and other special trade construction works", division: "45" },
  { code: "45262000", label: "Special trade construction works other than roof works", division: "45" },
  { code: "45262620", label: "Erection of retaining structures", division: "45" },
  { code: "45300000", label: "Building installation work", division: "45" },
  { code: "45310000", label: "Electrical installation work", division: "45" },
  { code: "45315000", label: "Electrical installation works of heating and other electrical building-equipment", division: "45" },
  { code: "45340000", label: "Fencing, railing and safety equipment installation work", division: "45" },
  { code: "45400000", label: "Building completion work", division: "45" },

  // Engineering / Architecture (71)
  { code: "71000000", label: "Architectural, construction, engineering and inspection services", division: "71" },
  { code: "71300000", label: "Engineering services", division: "71" },
  { code: "71311000", label: "Civil engineering consultancy services", division: "71" },
  { code: "71311200", label: "Highway engineering services", division: "71" },
  { code: "71311300", label: "Infrastructure engineering services", division: "71" },
  { code: "71312000", label: "Structural engineering consultancy services", division: "71" },
  { code: "71313000", label: "Environmental engineering consultancy services", division: "71" },
  { code: "71320000", label: "Engineering design services", division: "71" },
  { code: "71400000", label: "Urban planning and landscape architectural services", division: "71" },

  // IT / Software (72)
  { code: "72000000", label: "IT services: consulting, software development, Internet and support", division: "72" },
  { code: "72100000", label: "Hardware consultancy services", division: "72" },
  { code: "72200000", label: "Software programming and consultancy services", division: "72" },
  { code: "72210000", label: "Programming services of packaged software products", division: "72" },
  { code: "72211000", label: "Programming services of systems and user software", division: "72" },
  { code: "72212000", label: "Programming services for application software", division: "72" },
  { code: "72220000", label: "Systems and technical consultancy services", division: "72" },
  { code: "72230000", label: "Custom software development services", division: "72" },
  { code: "72250000", label: "System and support services", division: "72" },
  { code: "72260000", label: "Software-related services", division: "72" },
  { code: "72300000", label: "Data services", division: "72" },
  { code: "72310000", label: "Data processing services", division: "72" },
  { code: "72320000", label: "Database services", division: "72" },
  { code: "72400000", label: "Internet services", division: "72" },
  { code: "72500000", label: "Computer-related services", division: "72" },
  { code: "72600000", label: "Computer support and consultancy services", division: "72" },
  { code: "72700000", label: "Computer network services", division: "72" },
  { code: "72720000", label: "Wide area network services", division: "72" },

  // OT / Industrial Control / Security (35, 38, 51)
  { code: "35000000", label: "Security, fire-fighting, police and defence equipment", division: "35" },
  { code: "35120000", label: "Surveillance and security systems and devices", division: "35" },
  { code: "35125000", label: "Monitoring system", division: "35" },
  { code: "35125100", label: "Sensors", division: "35" },
  { code: "38000000", label: "Laboratory, optical and precision equipments", division: "38" },
  { code: "38500000", label: "Checking and testing apparatus", division: "38" },
  { code: "38600000", label: "Optical instruments", division: "38" },
  { code: "51000000", label: "Installation services (except software)", division: "51" },
  { code: "51100000", label: "Installation services of electrical and mechanical equipment", division: "51" },
  { code: "51110000", label: "Installation services of electrical equipment", division: "51" },
  { code: "51210000", label: "Installation services of measuring equipment", division: "51" },

  // Electrical / Energy (31, 65)
  { code: "31000000", label: "Electrical machinery, apparatus, equipment and consumables", division: "31" },
  { code: "31600000", label: "Electrical equipment and apparatus", division: "31" },
  { code: "31680000", label: "Electrical supplies and accessories", division: "31" },
  { code: "31682000", label: "Electrical supplies", division: "31" },
  { code: "31682500", label: "Emergency power supply equipment", division: "31" },
  { code: "65000000", label: "Public utilities", division: "65" },
  { code: "65100000", label: "Transmission of electricity and related services", division: "65" },
  { code: "65300000", label: "Electricity distribution and related services", division: "65" },
  { code: "65500000", label: "Meter reading service", division: "65" },

  // Environmental / Natural Hazard (77, 90)
  { code: "77000000", label: "Agricultural, forestry, horticultural, aquacultural and apicultural services", division: "77" },
  { code: "77200000", label: "Forestry services", division: "77" },
  { code: "77231000", label: "Forestry management services", division: "77" },
  { code: "77231600", label: "Forest protection services", division: "77" },
  { code: "90000000", label: "Sewage, refuse, cleaning and environmental services", division: "90" },
  { code: "90700000", label: "Environmental services", division: "90" },
  { code: "90720000", label: "Environmental protection", division: "90" },
  { code: "90721000", label: "Environmental safety services", division: "90" },
  { code: "90721500", label: "Natural disaster protection services", division: "90" },
  { code: "90730000", label: "Pollution tracking, monitoring and rehabilitation", division: "90" },

  // Research & Development (73)
  { code: "73000000", label: "Research and development services and related consultancy services", division: "73" },
  { code: "73100000", label: "Research and experimental development services", division: "73" },
  { code: "73200000", label: "Research and development consultancy services", division: "73" },
  { code: "73300000", label: "Design and execution of research and development", division: "73" },

  // Consulting / Professional Services (79)
  { code: "79000000", label: "Business services: law, marketing, consulting, recruitment, printing and security", division: "79" },
  { code: "79100000", label: "Legal services", division: "79" },
  { code: "79400000", label: "Business and management consultancy and related services", division: "79" },
  { code: "79410000", label: "Business and management consultancy services", division: "79" },
  { code: "79411000", label: "General management consultancy services", division: "79" },

  // Training / Education (80)
  { code: "80000000", label: "Education and training services", division: "80" },
  { code: "80500000", label: "Training services", division: "80" },

  // Healthcare (85)
  { code: "85000000", label: "Health and social work services", division: "85" },
  { code: "85100000", label: "Health services", division: "85" },

  // Transport (60)
  { code: "60000000", label: "Transport services (excl. Waste transport)", division: "60" },
  { code: "60100000", label: "Road transport services", division: "60" },
  { code: "60200000", label: "Land transport services", division: "60" },

  // Supply / Equipment (34)
  { code: "34000000", label: "Transport equipment and auxiliary products to transportation", division: "34" },
  { code: "34100000", label: "Motor vehicles", division: "34" },
  { code: "34900000", label: "Miscellaneous transport equipment and spare parts", division: "34" },
];

export const CPV_MAP = Object.fromEntries(
  CPV_CODES.map((c) => [c.code, c])
);

// Group CPV codes by division for display
export const CPV_DIVISIONS: Record<string, { label: string; codes: CpvCode[] }> = {
  "45": { label: "Construction", codes: [] },
  "71": { label: "Engineering Services", codes: [] },
  "72": { label: "IT & Software", codes: [] },
  "35": { label: "Security & Surveillance", codes: [] },
  "38": { label: "Laboratory & Instruments", codes: [] },
  "51": { label: "Installation Services", codes: [] },
  "31": { label: "Electrical Equipment", codes: [] },
  "65": { label: "Public Utilities", codes: [] },
  "77": { label: "Forestry & Agricultural", codes: [] },
  "90": { label: "Environmental Services", codes: [] },
  "73": { label: "R&D Services", codes: [] },
  "79": { label: "Professional Services", codes: [] },
  "80": { label: "Education & Training", codes: [] },
  "85": { label: "Healthcare", codes: [] },
  "60": { label: "Transport", codes: [] },
  "34": { label: "Transport Equipment", codes: [] },
};

CPV_CODES.forEach((code) => {
  if (CPV_DIVISIONS[code.division]) {
    CPV_DIVISIONS[code.division].codes.push(code);
  }
});

export function getCpvLabel(code: string): string {
  // Try exact match first
  if (CPV_MAP[code]) return CPV_MAP[code].label;
  // Try to find by division (first 2 digits)
  const division = code.slice(0, 2);
  const divLabel = CPV_DIVISIONS[division]?.label;
  return divLabel ? `${divLabel} (${code})` : code;
}

export function getCpvDivisionLabel(code: string): string {
  const division = code.slice(0, 2);
  return CPV_DIVISIONS[division]?.label ?? division;
}
