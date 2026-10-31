/**
 * Panchang names. Sources: Surya Siddhanta conventions as used in standard
 * almanacs (e.g. Drik Panchang); Rahu Kaal segment order is the widely used
 * 8-part daytime division.
 */

/** 15 tithi names; tithi 15 is Purnima (Shukla), tithi 30 is Amavasya (Krishna). */
export const TITHI_NAMES = [
  "Pratipada",
  "Dwitiya",
  "Tritiya",
  "Chaturthi",
  "Panchami",
  "Shashthi",
  "Saptami",
  "Ashtami",
  "Navami",
  "Dashami",
  "Ekadashi",
  "Dwadashi",
  "Trayodashi",
  "Chaturdashi",
] as const;

/** 27 nitya yogas, from (Sun + Moon) sidereal longitude in 13°20′ steps. */
export const YOGA_NAMES = [
  "Vishkambha",
  "Priti",
  "Ayushman",
  "Saubhagya",
  "Shobhana",
  "Atiganda",
  "Sukarma",
  "Dhriti",
  "Shula",
  "Ganda",
  "Vriddhi",
  "Dhruva",
  "Vyaghata",
  "Harshana",
  "Vajra",
  "Siddhi",
  "Vyatipata",
  "Variyana",
  "Parigha",
  "Shiva",
  "Siddha",
  "Sadhya",
  "Shubha",
  "Shukla",
  "Brahma",
  "Indra",
  "Vaidhriti",
] as const;

/** Seven movable karanas that repeat 8 times (karanas 2–57 of the lunar month). */
export const MOVABLE_KARANAS = ["Bava", "Balava", "Kaulava", "Taitila", "Garaja", "Vanija", "Vishti"] as const;
/** Fixed karanas: #1 is Kimstughna; #58–60 are Shakuni, Chatushpada, Naga. */
export const FIRST_KARANA = "Kimstughna";
export const LAST_KARANAS = ["Shakuni", "Chatushpada", "Naga"] as const;

/** Vara (weekday) names, Sunday = 0. */
export const VARA_NAMES = [
  "Ravivara",
  "Somavara",
  "Mangalavara",
  "Budhavara",
  "Guruvara",
  "Shukravara",
  "Shanivara",
] as const;

/**
 * Rahu Kaal: daytime (sunrise→sunset) split into 8 equal parts; the part number
 * (1-based) for each weekday, Sunday = 0. Mon 2, Sat 3, Fri 4, Wed 5, Thu 6, Tue 7, Sun 8.
 */
export const RAHU_KAAL_PART = [8, 2, 7, 5, 6, 4, 3] as const;
