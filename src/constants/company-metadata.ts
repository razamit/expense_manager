export interface CompanyMetadata {
  id: string;
  name: string;
  hebrewName: string;
  type: "bank" | "credit";
  credentialFields: CredentialField[];
}

export interface CredentialField {
  key: string;
  label: string;
  type: "text" | "password" | "number";
  placeholder?: string;
}

const usernamePasswordFields: CredentialField[] = [
  { key: "username", label: "Username", type: "text" },
  { key: "password", label: "Password", type: "password" },
];

const idPasswordFields: CredentialField[] = [
  { key: "id", label: "ID Number", type: "text", placeholder: "תעודת זהות" },
  { key: "password", label: "Password", type: "password" },
];

const cardFields: CredentialField[] = [
  { key: "id", label: "ID Number", type: "text" },
  { key: "card6Digits", label: "Last 6 digits", type: "text" },
  { key: "password", label: "Password", type: "password" },
];

export const COMPANY_METADATA: CompanyMetadata[] = [
  {
    id: "hapoalim",
    name: "Bank Hapoalim",
    hebrewName: "בנק הפועלים",
    type: "bank",
    credentialFields: [
      { key: "userCode", label: "User Code", type: "text" },
      { key: "password", label: "Password", type: "password" },
    ],
  },
  {
    id: "leumi",
    name: "Bank Leumi",
    hebrewName: "בנק לאומי",
    type: "bank",
    credentialFields: usernamePasswordFields,
  },
  {
    id: "discount",
    name: "Discount Bank",
    hebrewName: "בנק דיסקונט",
    type: "bank",
    credentialFields: [
      { key: "id", label: "ID Number", type: "text" },
      { key: "password", label: "Password", type: "password" },
      { key: "num", label: "Account Number", type: "text" },
    ],
  },
  {
    id: "mizrahi",
    name: "Mizrahi Tefahot",
    hebrewName: "מזרחי טפחות",
    type: "bank",
    credentialFields: idPasswordFields,
  },
  {
    id: "max",
    name: "Max (Leumi Card)",
    hebrewName: "מקס",
    type: "credit",
    credentialFields: usernamePasswordFields,
  },
  {
    id: "visaCal",
    name: "Visa Cal",
    hebrewName: "ויזה כאל",
    type: "credit",
    credentialFields: usernamePasswordFields,
  },
  {
    id: "isracard",
    name: "Isracard",
    hebrewName: "ישראכרט",
    type: "credit",
    credentialFields: [
      { key: "id", label: "ID Number", type: "text" },
      { key: "card6Digits", label: "Last 6 Card Digits", type: "text" },
      { key: "password", label: "Password", type: "password" },
    ],
  },
  {
    id: "amex",
    name: "Amex",
    hebrewName: "אמריקן אקספרס",
    type: "credit",
    credentialFields: cardFields,
  },
  {
    id: "beyahadOtsar",
    name: "Bank Otsar Hahayal",
    hebrewName: "בנק אוצר החייל",
    type: "bank",
    credentialFields: usernamePasswordFields,
  },
  {
    id: "beinleumi",
    name: "Bank HaBeinleumi (FIBI 31)",
    hebrewName: "הבנק הבינלאומי",
    type: "bank",
    credentialFields: usernamePasswordFields,
  },
  {
    id: "mercantile",
    name: "Mercantile Bank",
    hebrewName: "בנק מרכנתיל",
    type: "bank",
    credentialFields: idPasswordFields,
  },
];

export function getCompanyMetadata(
  companyType: string
): CompanyMetadata | undefined {
  return COMPANY_METADATA.find((c) => c.id === companyType);
}

export function getCompanyTypeIdsByKind(
  type: CompanyMetadata["type"]
): string[] {
  return COMPANY_METADATA.filter((company) => company.type === type).map(
    (company) => company.id
  );
}
