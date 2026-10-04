import type { Locale } from "@/i18n/config"

/**
 * Protection measures and working conditions for minors, from Law no. 53/2003 (Romanian Labour Code).
 * The Romanian text is the original; the English one is Pocket's translation.
 * Legal source text, so it lives here rather than in the UI message files.
 */
export type LawSection = { heading: string; items: string[] }

export const MINORS_LAW: Record<Locale, LawSection[]> = {
  ro: [
    {
      heading: "Dreptul la muncă",
      items: [
        "Persoana fizică dobândește capacitate de muncă la împlinirea vârstei de 16 ani.",
        "Încadrarea în muncă a persoanelor sub 15 ani este interzisă.",
        "Minorii pot încheia un contract de muncă de la 15 ani, cu acordul părinților sau al reprezentanților legali, doar pentru activități potrivite dezvoltării lor fizice, intelectuale și aptitudinale.",
        "Retragerea acordului până la împlinirea vârstei de 16 ani duce la încetarea de drept a contractului.",
        "Ocuparea unui loc de muncă greu, vătămător sau periculos este permisă doar după împlinirea vârstei de 18 ani.",
      ],
    },
    {
      heading: "Timpul de muncă",
      items: [
        "Durata maximă a muncii: 6 ore/zi și 30 de ore/săptămână.",
        "Munca suplimentară și munca de noapte sunt interzise pentru tinerii sub 18 ani.",
      ],
    },
    {
      heading: "Tinerii beneficiază de",
      items: [
        "Pauză de masă de cel puțin 30 de minute dacă lucrează mai mult de 4 ore și jumătate pe zi.",
        "Concediu de odihnă suplimentar de minimum 3 zile lucrătoare.",
      ],
    },
    {
      heading: "Salarizare",
      items: [
        "Salariul acordat minorilor este cel puțin la nivelul salariului minim pe economie.",
        "Tinerii cu vârsta între 16 și 18 ani pot urma un program de formare profesională în baza unui contract de ucenicie, cu respectarea tuturor condițiilor legale privind munca minorilor.",
      ],
    },
    {
      heading: "Sancțiuni",
      items: [
        "Încadrarea în muncă a unui minor cu nerespectarea condițiilor legale de vârstă sau utilizarea acestuia în activități contrare reglementărilor privind regimul de muncă pentru minori constituie infracțiune și se pedepsește cu: închisoare de la 3 luni la 2 ani sau amendă penală.",
      ],
    },
  ],
  en: [
    {
      heading: "The right to work",
      items: [
        "A person gains the capacity to work at the age of 16.",
        "Employing anyone under the age of 15 is forbidden.",
        "Minors can sign a work contract from the age of 15, with the agreement of their parents or legal guardians, and only for activities suited to their physical development, abilities and knowledge.",
        "If the agreement is withdrawn before the minor turns 16, the contract ends automatically.",
        "Heavy, harmful or dangerous work is only allowed after the age of 18.",
      ],
    },
    {
      heading: "Working time",
      items: [
        "Maximum working time: 6 hours a day and 30 hours a week.",
        "Overtime and night work are forbidden for young people under 18.",
      ],
    },
    {
      heading: "Young people are entitled to",
      items: [
        "A meal break of at least 30 minutes if they work more than 4 and a half hours a day.",
        "At least 3 extra working days of paid holiday.",
      ],
    },
    {
      heading: "Pay",
      items: [
        "The pay given to minors is at least the national minimum wage.",
        "Young people aged 16 to 18 can follow a vocational training programme under an apprenticeship contract, respecting all the legal rules on the work of minors.",
      ],
    },
    {
      heading: "Penalties",
      items: [
        "Employing a minor without respecting the legal age conditions, or using a minor in activities that break the rules on the work of minors, is a crime punished by: 3 months to 2 years in prison, or a criminal fine.",
      ],
    },
  ],
}
