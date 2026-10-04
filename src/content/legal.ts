import type { Locale } from "@/i18n/config"

/**
 * The privacy notice and terms of use, in plain language, describing how Pocket actually works.
 * DRAFT: to be reviewed by a lawyer before launch (see LEGAL.draft in config/pocket.ts).
 */
export type LegalSection = { heading: string; paragraphs: string[] }

export const PRIVACY: Record<Locale, LegalSection[]> = {
  en: [
    {
      heading: "Who we are",
      paragraphs: [
        "Pocket helps neighbours in Bucharest and Ilfov find each other for small paid jobs. The company that runs Pocket (named at the bottom of this page) is responsible for your data.",
      ],
    },
    {
      heading: "What we keep",
      paragraphs: [
        "Your account: your email address and password (stored only as a secure hash), or the account you log in with at Google or Apple.",
        "Your profile: your name, photo, a sentence about you, what you can help with, when you are free and your neighbourhood. Other signed-in people can see these.",
        "Private details: your phone number (optional), the point of your home, how far you would go and your savings goal. Only you see these, except your phone, which the person you agree a job with sees after the pick.",
        "Jobs, offers, messages and reviews you write, the payments of your jobs, your notifications, and the reports and messages you send to the team.",
        "A few small cookies that keep you logged in and remember your language, theme and text size. There are no advertising or tracking cookies.",
      ],
    },
    {
      heading: "Why we use it",
      paragraphs: [
        "To run Pocket for you: show jobs near you, connect you with the other person, keep your earnings and level, and send you notifications.",
        "To keep people safe: check jobs for dangerous words, read reports and stop misuse.",
        "To follow the law, for example rules about payments made through online platforms.",
      ],
    },
    {
      heading: "Who sees your address",
      paragraphs: [
        "Nobody sees where you live. A job shows only its neighbourhood and a point a short walk from the real place. The exact address of a job is shown only to the poster and to the person they pick, after the pick.",
      ],
    },
    {
      heading: "Companies that help us",
      paragraphs: [
        "Supabase stores the data, in the European Union (Ireland). Vercel runs the website. Google provides the map and the address search: what you type in the address box and your device's address reach Google. Stripe handles card payments and payouts: Pocket never sees your card or bank details. An email service sends account emails.",
      ],
    },
    {
      heading: "How long we keep it",
      paragraphs: [
        "As long as you have an account. When you delete it, your profile, photo, private details, notifications and payout account are removed. Jobs, payments and reviews you shared with someone else stay in their history without your name, and payment records are kept for as long as the law requires.",
      ],
    },
    {
      heading: "Your rights",
      paragraphs: [
        "You can see and correct your details in Me, download all your data and delete your account at any time (Me → Your data). You can also object to how we use your data or ask us anything at the address below.",
        "You can complain to the Romanian data protection authority (ANSPDCP, www.dataprotection.ro).",
      ],
    },
    {
      heading: "Young people",
      paragraphs: [
        "Jobs follow the rules for minors in the Romanian Labour Code: under 15 you can’t take jobs, and from 15 to 18 only with your parents’ agreement. The Rules for minors page explains them.",
      ],
    },
  ],
  ro: [
    {
      heading: "Cine suntem",
      paragraphs: [
        "Pocket îi ajută pe vecinii din București și Ilfov să se găsească pentru treburi mici, plătite. Firma care administrează Pocket (numită la finalul paginii) răspunde de datele tale.",
      ],
    },
    {
      heading: "Ce păstrăm",
      paragraphs: [
        "Contul tău: adresa de e-mail și parola (păstrată doar sub formă criptată), sau contul Google ori Apple cu care intri.",
        "Profilul tău: numele, poza, o propoziție despre tine, la ce poți ajuta, când ești liber și cartierul. Ceilalți utilizatori conectați le pot vedea.",
        "Date private: numărul de telefon (opțional), punctul casei tale, cât de departe ai merge și obiectivul de economii. Doar tu le vezi, cu excepția telefonului, pe care îl vede persoana cu care stabilești o treabă, după alegere.",
        "Treburile, ofertele, mesajele și recenziile pe care le scrii, plățile treburilor tale, notificările, rapoartele și mesajele trimise echipei.",
        "Câteva cookie-uri mici care te țin conectat și îți rețin limba, tema și mărimea textului. Nu folosim cookie-uri de reclame sau de urmărire.",
      ],
    },
    {
      heading: "De ce le folosim",
      paragraphs: [
        "Ca Pocket să funcționeze pentru tine: să-ți arătăm treburi din apropiere, să te punem în legătură cu cealaltă persoană, să-ți păstrăm câștigurile și nivelul și să-ți trimitem notificări.",
        "Ca oamenii să fie în siguranță: verificăm treburile pentru cuvinte periculoase, citim rapoartele și oprim abuzurile.",
        "Ca să respectăm legea, de exemplu regulile despre plățile făcute prin platforme online.",
      ],
    },
    {
      heading: "Cine îți vede adresa",
      paragraphs: [
        "Nimeni nu vede unde locuiești. O treabă arată doar cartierul și un punct la câțiva pași de locul real. Adresa exactă a unei treburi o văd doar cel care a postat-o și persoana aleasă, după alegere.",
      ],
    },
    {
      heading: "Firme care ne ajută",
      paragraphs: [
        "Supabase păstrează datele, în Uniunea Europeană (Irlanda). Vercel găzduiește site-ul. Google oferă harta și căutarea adreselor: ce scrii în câmpul de adresă și adresa dispozitivului tău ajung la Google. Stripe se ocupă de plățile cu cardul și de transferuri: Pocket nu vede niciodată datele cardului sau ale contului bancar. Un serviciu de e-mail trimite mesajele despre cont.",
      ],
    },
    {
      heading: "Cât timp le păstrăm",
      paragraphs: [
        "Cât timp ai cont. Când îl ștergi, se șterg profilul, poza, datele private, notificările și contul pentru plăți. Treburile, plățile și recenziile pe care le-ai avut cu altcineva rămân în istoricul lor, fără numele tău, iar evidența plăților se păstrează cât cere legea.",
      ],
    },
    {
      heading: "Drepturile tale",
      paragraphs: [
        "Îți poți vedea și corecta datele în Eu, poți descărca toate datele și îți poți șterge contul oricând (Eu → Datele tale). Te poți opune modului în care le folosim sau ne poți întreba orice la adresa de mai jos.",
        "Poți depune o plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP, www.dataprotection.ro).",
      ],
    },
    {
      heading: "Tinerii",
      paragraphs: [
        "Treburile respectă regulile pentru minori din Codul muncii: sub 15 ani nu poți lua treburi, iar între 15 și 18 ani doar cu acordul părinților. Pagina Reguli pentru minori le explică.",
      ],
    },
  ],
}

export const TERMS: Record<Locale, LegalSection[]> = {
  en: [
    {
      heading: "What Pocket is",
      paragraphs: [
        "Pocket is a place where neighbours post small jobs and offer to help. A job is an agreement between the two people: Pocket is not the employer of helpers and does not do the jobs itself.",
      ],
    },
    {
      heading: "Who can use it",
      paragraphs: [
        "You must live or work in Bucharest or Ilfov. Under 15 you can't take jobs; from 15 to 18 only with a parent's agreement and within the rules for minors. Read them before your first job.",
      ],
    },
    {
      heading: "Posting and helping",
      paragraphs: [
        "Describe jobs honestly, with a fair pay and the real time. Jobs that are dangerous, illegal or not allowed for minors are refused.",
        "Offer only for jobs you can do, come on time, and tell the other person early if something changes. The time you report when you finish must be true: it decides your points.",
      ],
    },
    {
      heading: "Paying",
      paragraphs: [
        "The pay is agreed in the job and paid in two halves: one at the start and the rest when the poster confirms the job is done. Each half is paid in cash or by card.",
        "Card payments go through Stripe straight to the helper's account. On card payments Pocket keeps a fee from the amount the helper receives; helpers see what they actually got in My earnings. Cash payments have no fee.",
      ],
    },
    {
      heading: "Reviews, messages and reports",
      paragraphs: [
        "Reviews must be honest and about the job. Be polite in messages and keep them in Pocket. Report anything that feels wrong; in danger, call 112 first.",
      ],
    },
    {
      heading: "When we step in",
      paragraphs: [
        "We can remove posts, messages or reviews and suspend accounts that break these rules or put people at risk.",
      ],
    },
    {
      heading: "Responsibility",
      paragraphs: [
        "We work to keep Pocket safe and running, but we can't check every person or job in advance. Pocket isn't responsible for how a job is done or for agreements between users, as far as the law allows.",
      ],
    },
    {
      heading: "Changes and law",
      paragraphs: [
        "We tell you in the app before these terms change. Romanian law applies.",
      ],
    },
  ],
  ro: [
    {
      heading: "Ce este Pocket",
      paragraphs: [
        "Pocket este un loc unde vecinii postează treburi mici și se oferă să ajute. O treabă este o înțelegere între cele două persoane: Pocket nu este angajatorul celor care ajută și nu face treburile.",
      ],
    },
    {
      heading: "Cine îl poate folosi",
      paragraphs: [
        "Trebuie să locuiești sau să lucrezi în București ori Ilfov. Sub 15 ani nu poți lua treburi; între 15 și 18 ani doar cu acordul unui părinte și cu respectarea regulilor pentru minori. Citește-le înainte de prima treabă.",
      ],
    },
    {
      heading: "Postare și ajutor",
      paragraphs: [
        "Descrie treburile cinstit, cu o plată corectă și timpul real. Treburile periculoase, ilegale sau interzise minorilor sunt refuzate.",
        "Oferă-te doar pentru treburi pe care le poți face, vino la timp și anunță din timp dacă se schimbă ceva. Timpul pe care îl raportezi la final trebuie să fie real: de el depind punctele.",
      ],
    },
    {
      heading: "Plata",
      paragraphs: [
        "Plata se stabilește în treabă și se dă în două jumătăți: una la început și restul când cel care a postat confirmă că treaba e gata. Fiecare jumătate se plătește cash sau cu cardul.",
        "Plățile cu cardul trec prin Stripe direct în contul celui care ajută. La plățile cu cardul, Pocket reține un comision din suma primită de cel care ajută; acesta vede suma reală în Câștigurile mele. Plățile cash nu au comision.",
      ],
    },
    {
      heading: "Recenzii, mesaje și rapoarte",
      paragraphs: [
        "Recenziile trebuie să fie cinstite și despre treabă. Fii politicos în mesaje și păstrează-le în Pocket. Raportează orice nu ți se pare în regulă; dacă ești în pericol, sună întâi la 112.",
      ],
    },
    {
      heading: "Când intervenim",
      paragraphs: [
        "Putem șterge postări, mesaje sau recenzii și putem suspenda conturile care încalcă aceste reguli sau pun oamenii în pericol.",
      ],
    },
    {
      heading: "Răspundere",
      paragraphs: [
        "Ne străduim ca Pocket să fie sigur și să funcționeze, dar nu putem verifica dinainte fiecare persoană sau treabă. Pocket nu răspunde de felul în care e făcută o treabă sau de înțelegerile dintre utilizatori, în limitele permise de lege.",
      ],
    },
    {
      heading: "Modificări și lege",
      paragraphs: [
        "Te anunțăm în aplicație înainte ca acești termeni să se schimbe. Se aplică legea română.",
      ],
    },
  ],
}
