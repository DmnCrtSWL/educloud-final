/**
 * Helpers to parse and extract data from a Mexican CURP.
 * Format: AAAA######XXXXXX##
 * (Chars 4-9 are YYMMDD of birth date)
 * (Char 10 is gender: H or M)
 */

import { getLocalYear, getLocalDateString } from "./dateUtils";

export interface CurpData {
  isValid: boolean;
  dateOfBirth: Date | null;
  age: number | null;
  gender: "Hombre" | "Mujer" | null;
  suggestedGrade: 1 | 2 | 3 | null;
}

export function parseCurp(curp: string): CurpData {
  const cleanCurp = (curp || "").toUpperCase().trim();

  // Basic Regex for CURP to ensure length and structure
  // 4 letters, 6 numbers, 6 letters, 2 alphanumeric
  const curpRegex =
    /^([A-Z][AEIOUX][A-Z]{2}\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])[HM](?:AS|B[CS]|C[CLMSH]|D[FG]|G[TR]|HG|JC|M[CNS]|N[ETL]|OC|PL|Q[TR]|S[PLR]|T[CSL]|VZ|YN|ZS)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d])(\d)$/;

  const isValid = curpRegex.test(cleanCurp);

  if (!isValid && cleanCurp.length < 18) {
    return {
      isValid: false,
      dateOfBirth: null,
      age: null,
      gender: null,
      suggestedGrade: null,
    };
  }

  // Extract DOB (YYMMDD in positions 4-9)
  const dobStr = cleanCurp.substring(4, 10);
  const yearStr = dobStr.substring(0, 2);
  const monthStr = dobStr.substring(2, 4);
  const dayStr = dobStr.substring(4, 6);

  // Determine century. If year is between 00 and 24, it's 2000s, else 1900s.
  // We can also check the penultime digit (pos 16) but a simple year threshold works for kids.
  const currentYear = getLocalYear();
  const yearTwoDigits = parseInt(yearStr, 10);
  const year =
    yearTwoDigits <= currentYear % 100
      ? 2000 + yearTwoDigits
      : 1900 + yearTwoDigits;

  const month = parseInt(monthStr, 10) - 1; // 0-indexed in JS
  const day = parseInt(dayStr, 10);

  const dateOfBirth = new Date(year, month, day);

  // Calculate exact age
  const today = new Date(getLocalDateString());
  let age = getLocalYear() - dateOfBirth.getFullYear();
  const m = today.getMonth() - dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }

  // Extract Gender (position 10, meaning index 10)
  const genderChar = cleanCurp.substring(10, 11);
  const gender =
    genderChar === "H" ? "Hombre" : genderChar === "M" ? "Mujer" : null;

  // Suggest Grade based on age.
  // Standard Mexican Secondary School:
  // 12 -> 1ro
  // 13 -> 2do
  // 14+ -> 3ro
  let suggestedGrade: 1 | 2 | 3 | null = null;
  if (age <= 12) suggestedGrade = 1;
  else if (age === 13) suggestedGrade = 2;
  else if (age >= 14) suggestedGrade = 3;

  return {
    isValid,
    dateOfBirth,
    age,
    gender,
    suggestedGrade,
  };
}
