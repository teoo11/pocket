# Pocket: cum am construit o aplicație cu ajutorul AI-ului

*O prezentare făcută de 6 elevi de 15 ani, pentru colegi de 15 ani.*


Taburi importante de deschis in browser :

https://console.cloud.google.com/auth/clients?project=poket-heckaton

---

## Cum folosim documentul ăsta

Detalii despre cum a fost implementată aplicatia (citite si chiar si prezentate poate).

Aici e mult mai mult conținut decat avem timp sa prezentam. Fiecare sa poata sa vorbeasca 1 minut (o sa dureze mai mult in realitate). Trebuie sa alegem ce vorbeste fiecare.

> **Sfat:** textul din fiecare parte e scris ca să poată fi citit, dar e mai bine să-l spuneți cu cuvintele voastre. Nu e nevoie să-l învățați pe de rost.

Poate va focusați mai mult pe prezentarea aplicației in sine.

---

## Partea 1: Ce este „vibecoding”? De unde a venit ideea?

### Ce înseamnă „vibecoding”

„Vibecoding” înseamnă să construiești o aplicație **vorbind cu un AI**, nu scriind tu fiecare rând de cod.

Tu îi explici AI-ului, în cuvinte normale, ce vrei. AI-ul scrie codul. Tu te uiți la rezultat și îi spui ce să schimbe. Și tot așa, până îți place.

Unii dintre noi **nu programaseră niciodată** înainte de proiectul ăsta. Am învățat pe parcurs, exersând mult cu AI-ul.

### Cum am găsit ideea

1. L-am întrebat pe **ChatGPT** care sunt cele mai **inovatoare idei** de aplicații.
2. Dintre ideile primite, am ales una care ne-a plăcut și am **dezvoltat-o** noi mai departe, adăugând lucrurile pe care le voiam.
3. Așa a apărut **Pocket**.

### Ce este Pocket, pe scurt

**Pocket** e un site unde oamenii din **București și Ilfov** pot cere ajutor pentru **treburi mici, plătite**, iar oamenii din apropiere se oferă să le facă.

Exemple: plimbat câinele, udat florile, ajutat pe cineva cu telefonul, cumpărături, meditații, cărat câteva cutii.

> **Fraza de reținut:** „Am pornit de la o întrebare pusă unui AI și am ajuns la o aplicație adevărată.”

---

## Partea 2: Primul aspect al site-ului

### Pasul 1: un prompt despre cum arată site-ul

Am rugat **ChatGPT** să ne ajute să scriem un prompt foarte detaliat despre **cum ar trebui să arate site-ul**: culori, butoane, ecrane, ce apare pe fiecare pagină. Aici i am dat multe detalii dar a adaugat si el.

### Pasul 2: l-am dat lui Claude Code

**Claude Code** este un AI care nu doar vorbește, ci **scrie direct fișierele de cod** pe calculator.

I-am dat prompt-ul făcut cu ChatGPT, iar Claude Code a construit prima versiune a site-ului.

### Pasul 3: modificări după modificări

Prima versiune nu a fost perfectă. Așa că am făcut **multe runde de modificări**:

- „Fă butoanele mai mari.”
- „Schimbă culorile în ceva mai cald.”
- „Mută butonul de postare în colțul din dreapta jos.”
- „Fără emoji, doar iconițe simple.”

Am continuat așa **până ne-a plăcut** cum arată.


> **Fraza de reținut:** „Nu am nimerit designul din prima. L-am construit pas cu pas, cerând schimbări mici.”

---

## Partea 3: Arăta bine, dar nu funcționa

### Problema

După toate modificările, aveam un site **frumos**, dar **logica nu funcționa cu adevărat**.

- conturile nu erau reale;
- joburile postate nu se salvau nicăieri pe internet;
- doi oameni de pe telefoane diferite nu se puteau vedea unul pe altul.

### Am întrebat AI-ul: ce unelte să folosim?

AI-ul s-ar fi chinuit prea mult să facă toate lucrurile de la zero. Așa că le-am întrebat pe **Gemini** și pe **ChatGPT** care sunt **cele mai bune unelte** pentru o aplicație funcțională construită cu AI. Răspunsul a fost:

| Unealtă | Ce face | Comparație simplă | Cost |
|---|---|---|---|
| **Next.js** | Construiește partea de site pe care o vezi (frontend-ul) | Piesele de Lego, cu instrucțiuni, din care faci site-ul | Gratuit |
| **Vercel** | Pune site-ul pe internet, ca oricine să intre pe el (hosting) | Serverul unde sta siteul | Gratuit |
| **Supabase** | Baza de date: ține minte conturile, joburile, mesajele | Un dulap uriaș cu fișe, foarte bine organizat | Gratuit |

### De ce Supabase a fost alegerea potrivită

Supabase ne-a dat, într-un singur loc:

- **Conturi** (autentificare): te poți loga cu Google, Apple sau email.
- **Baza de date**: unde se salvează tot.
- **Chat în timp real**: mesajele apar imediat, fără să dai refresh.
- **Stocare de fișiere**: de exemplu, poze de profil.

> **Cuvinte noi:**
> - **Frontend** = partea pe care o vezi și pe care apeși.
> - **Bază de date** = locul unde aplicația ține minte informațiile.
> - **Framework** = un set de unelte gata făcute, ca să nu construiești totul de la zero.
> - **Hosting** = locul de pe internet unde „locuiește” site-ul.

> **Fraza de reținut:** „Când nu știam ce unelte să folosim, am întrebat tot un AI.”

---

## Partea 4: Rescrierea aplicației și „modul plan”

### Am luat-o de la capăt, de data asta cu baza de date

Cu informațiile de la Gemini și ChatGPT, i-am cerut lui **Claude Code** să **rescrie tot codul**, de data asta gândit de la început pentru **Next.js + Supabase + Vercel**.

Am păstrat designul care ne plăcea, dar „în spate” totul a fost refăcut ca să funcționeze de-adevăratelea.

### Cel mai important truc: modul plan

Asta e **cea mai importantă lecție** din tot proiectul.

Claude Code are un **mod plan**. În modul ăsta:

1. **Nu scrie cod imediat.** Mai întâi se gândește și face un plan.
2. **Îl obligăm să ne pună întrebări** despre detalii. De exemplu:
   - „Adresa exactă o vede toată lumea sau doar cine face jobul?”
   - „Cum se plătește: cash sau card?”
3. Abia după ce suntem de acord cu planul, începe să scrie codul.

### Ce făceam când nu știam răspunsul

Uneori AI-ul ne întreba lucruri tehnice pe care **nu le știam**. Atunci **întrebam alt AI** și abia apoi răspundeam.

Așa am aflat, de exemplu, că pentru messaje, este nevoie de ceva realtime de la supabase.

### De ce contează

Dacă îi spui unui AI doar „fă-mi o aplicație”, el **ghicește** ce vrei, și de multe ori ghicește greșit.

Dacă îl pui să **întrebe**, aplicația iese **exact cum ți-o imaginezi**.

> **Fraza de reținut:** „Nu-l lăsa pe AI să ghicească. Pune-l să te întrebe.”

---

## Partea 5: Cheile de acces (partea enervantă) și ce am învățat

### Ce este o „cheie de acces”

**Supabase**, **Vercel** și **Google Maps** ne-au cerut să creăm **manual** niște **chei de acces** (în engleză: *API keys*).

O cheie de acces e ca o **legitimație**: îi arată serviciului că aplicația noastră are voie să-l folosească. De exemplu, fără cheia de Google Maps, harta din aplicație nu apare.

### De ce a fost enervant

- AI-ul **nu putea face asta în locul nostru**: a trebuit să intrăm noi pe fiecare site, să ne facem cont și să generăm cheile.
- Fiecare serviciu avea **multe permisiuni de setat**, adică ce are voie cheia să facă și ce nu. E ca la o cartelă de hotel: trebuie să alegi exact ce uși poate deschide.
- Dacă uitai o permisiune, ceva nu mergea și trebuia să cauți de ce.
- **Cheile sunt secrete.** Nu le arăți nimănui și nu le pui pe internet, pentru că cine le are poate folosi serviciile în numele tău.

> **Sfat pentru cine vrea să încerce:** când nu înțelegeți o setare, întrebați AI-ul „cum creez cheie Google Maps cu link” etc. Vă va da tutorial pas cu pas cu link.

### Ce am învățat din tot proiectul

1. **Poți construi o aplicație reală fără să fi programat înainte**, dar trebuie răbdare și multe încercări.
2. **AI-uri diferite sunt bune la lucruri diferite:** ChatGPT pentru idei și prompturi, Gemini și ChatGPT pentru sfaturi, Claude Code pentru scris codul.
3. **Modul plan și întrebările** fac diferența între o aplicație care „aproape merge” și una care merge.
4. **Nu orice se poate face de AI:** conturile și cheile le-am făcut noi.
5. **Când nu știi ceva, cauți.** Nimeni nu știe totul de la început.

> **Fraza de reținut:** „AI-ul scrie codul, dar deciziile le luăm noi.”

---

## Partea 6: Demonstrație live, aplicația Pocket

### Ce face aplicația

**Pocket** leagă oameni care au nevoie de ajutor cu **oameni din apropiere care vor să ajute**, pentru treburi mici, plătite, în **București și Ilfov**.

**Un singur cont face ambele lucruri:** poți și să ceri ajutor, și să ajuți. Ca pe YouTube, unde același cont poate și să se uite la clipuri, și să încarce.

### Categoriile de joburi

Animale · Telefon și tehnologie · Meditații · Cărat · Plante și grădină · Cumpărături și comisioane · Prin casă · Creativ · Calculator · Altele

### Cum funcționează un job, de la început la sfârșit

1. **Cineva postează un job.** Răspunde la câte o întrebare pe ecran: ce fel de job, detalii, ziua, ora, cât durează, cât plătește, unde.
2. **Ajutoarele se oferă.** Când cineva se oferă, se deschide **un chat** între cele două persoane.
3. **Cel care a postat alege** pe cineva dintre cei care s-au oferit (le vede nota, câte joburi au făcut, nivelul).
4. **Ajutorul apasă „Încep acum”** și se plătește **prima jumătate**.
5. **Ajutorul termină**, iar cel care a postat confirmă că e gata. Se plătește **a doua jumătate**.
6. **Amândoi își lasă recenzii** (stele și câteva cuvinte). Recenziile apar doar după ce și-au scris-o amândoi, ca să fie sincere.

### Lucruri speciale de arătat

- **Harta:** joburile apar pe o hartă Google. Pinul **nu e pus exact** pe casa omului, ci mutat cu 70–140 de metri, pentru siguranță.
- **Confidențialitate:** adresa exactă și telefonul le vede **doar** persoana aleasă pentru job.
- **Puncte și niveluri:** primești puncte pentru fiecare job terminat (un job de o oră = 5 puncte) și urci în nivel.
- **Clasamentul (Top):** cei mai activi ajutoare, pe luni.
- **Câștiguri private:** câștigurile tale le vezi doar tu. În aplicație spunem mereu **„câștiguri”**, niciodată „bani”.
- **Pagina pentru minori:** regulile din Codul Muncii, mai ales pentru joburile de **noapte** (22:00–06:00) și cele de **cărat**.
- **Ușor pentru oricine:** text mare, butonul **Aa**, mod întunecat, română și engleză.
- **Plată:** cu cardul sau cash, în două jumătăți.

### Scenariul demonstrației (pas cu pas)

> **Pregătire înainte de prezentare:** două conturi logate, unul pe laptop și unul pe telefon (sau în două ferestre diferite ale browserului). Verificați că merge internetul.

1. **Pagina principală** (laptop): arătați categoriile, joburile din apropiere și clasamentul.
2. **Harta:** deschideți harta și arătați pinii cu prețuri.
3. **Postați un job** (laptop, Contul A): de exemplu „Plimbat câinele, 30 de minute, 25 lei”. Arătați cum aplicația pune câte o întrebare pe fiecare ecran.
4. **Oferiți-vă pentru job** (telefon, Contul B): arătați că jobul apare imediat și apăsați „Mă ofer să ajut”.
5. **Chatul:** trimiteți un mesaj de pe telefon și arătați că apare **instant** pe laptop. (Asta e partea de „timp real” de la Supabase.)
6. **Alegeți ajutorul** (laptop): apăsați „Alege”.
7. **Butonul Aa și modul întunecat:** arătați cât de mare se poate face textul.
8. **Pagina „Eu”:** nivelul, punctele și câștigurile private.

### Plan de rezervă

Dacă nu merge internetul sau ceva se blochează: **pregătiți capturi de ecran** cu fiecare pas de mai sus, ca să le puteți arăta în loc de demonstrația live.

---

## Încheiere

> „Acum câteva săptămâni, unii dintre noi nu scriseseră niciun rând de cod. Azi avem o aplicație reală, cu conturi, hartă, chat și aproape plăți. Nu am făcut-o singuri: am lucrat cu AI-ul. Dar ideile, deciziile și răbdarea au fost ale noastre. Mulțumim! Aveți întrebări?”

---

## Întrebări pe care s-ar putea să le primim (și răspunsuri)

**„Deci AI-ul a făcut tot?”**
Nu. AI-ul a scris codul, dar noi am ales ideea, am decis cum arată și cum funcționează, am răspuns la întrebările lui, am creat conturile și cheile și am testat totul.

**„Cât a costat?”**
Nimic pentru găzduire și baza de date: Vercel și Supabase au variante gratuite. *(Completați dacă ați plătit abonamente la AI.)*. Avem un abonament de 20 euro de claude (si unu de claude de 100 dar putem sa nu zicem) si unu de Gemini 5 euro.

**„E sigur pentru copii?”**
Avem o pagină cu regulile din Codul Muncii pentru minori, avertismente la joburile de noapte și de cărat, adresa se vede doar după ce ești ales, iar pinii de pe hartă nu arată locația exactă. Cuvintele periculoase sunt blocate când postezi un job, și poți raporta orice persoană sau job.

**„Cât timp a durat?”**
*Astea doua zile. Cel mai mult am așteptat după Claude sa scrie codul.*

**„Ce a fost cel mai greu?”**
Cheile de acces cu toate permisiunile lor, și momentul în care am realizat că site-ul arăta bine, dar nu funcționa, și a trebuit să-l rescriem.

---

## Mic dicționar (pentru cine nu a programat niciodată)

| Cuvânt | Ce înseamnă |
|---|---|
| **Vibecoding** | Construiești o aplicație vorbind cu un AI, care scrie codul pentru tine |
| **Prompt** | Mesajul sau cererea pe care o scrii unui AI |
| **Claude Code** | Un AI care scrie direct fișierele de cod pe calculator |
| **Mod plan** | Un mod al lui Claude Code în care face mai întâi un plan și pune întrebări, înainte să scrie cod |
| **Frontend** | Partea aplicației pe care o vezi și pe care apeși |
| **Bază de date** | Locul unde aplicația ține minte informațiile (conturi, joburi, mesaje) |
| **Framework** | Un set de unelte gata făcute pentru construit aplicații (de exemplu Next.js) |
| **Hosting** | Locul de pe internet unde „stă” site-ul, ca să poată intra oricine (de exemplu Vercel) |
| **Cheie de acces (API key)** | Un cod secret care îi dă aplicației voie să folosească un serviciu (Supabase, Google Maps) |
| **Permisiuni** | Ce are voie o cheie să facă și ce nu |
| **Timp real** | Informația apare imediat pe toate ecranele, fără refresh |
