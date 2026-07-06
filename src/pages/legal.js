import { el } from '../utils/dom.js';
import { Navbar } from '../components/navbar.js';
import { Footer } from '../components/footer.js';

function LegalLayout(user, title, bodyHtml) {
  const wrap = el('<div></div>');
  wrap.appendChild(Navbar(user));
  const main = el(`
    <main class="max-w-3xl mx-auto px-6 py-14">
      <h1 class="text-2xl font-bold text-primary-900 mb-2">${title}</h1>
      <p class="text-xs text-primary-400 mb-8">Platné od: [doplňte datum zveřejnění]</p>
      <div class="prose prose-sm max-w-none text-primary-700 space-y-4 leading-relaxed">
        ${bodyHtml}
      </div>
    </main>
  `);
  wrap.appendChild(main);
  wrap.appendChild(Footer());
  return wrap;
}

export function TermsPage({ user } = {}) {
  return LegalLayout(
    user,
    'Obchodní podmínky',
    `
    <p><strong>Poznámka pro provozovatele:</strong> Toto je návrh obchodních podmínek. Před ostrým spuštěním doplňte údaje v hranatých závorkách a nechte text zkontrolovat právníkem/daňovým poradcem.</p>

    <h2 class="font-bold text-primary-900 text-lg mt-6">1. Úvodní ustanovení</h2>
    <p>Tyto obchodní podmínky upravují vzájemná práva a povinnosti mezi provozovatelem služby Hlídač dotací:</p>
    <p>[Jméno a příjmení / obchodní firma], IČO: [doplňte], se sídlem [doplňte adresu], (dále jen "Provozovatel")</p>
    <p>a uživatelem, který se registruje a používá webovou aplikaci dostupnou na adrese dotace.apexradasystems.com (dále jen "Služba").</p>

    <h2 class="font-bold text-primary-900 text-lg mt-6">2. Popis služby</h2>
    <p>Služba automaticky vyhledává a doporučuje dotační výzvy a granty na základě profilu firmy zadaného uživatelem (obor podnikání, kraj, velikost firmy). Informace o výzvách jsou čerpány z veřejně dostupných zdrojů a mají pouze informativní charakter.</p>
    <p><strong>Provozovatel negarantuje</strong> úplnost, aktuálnost ani správnost zobrazených informací o dotačních výzvách. Před podáním žádosti o dotaci je uživatel povinen si podmínky ověřit přímo u poskytovatele dotace.</p>

    <h2 class="font-bold text-primary-900 text-lg mt-6">3. Registrace a účet</h2>
    <p>Pro využívání Služby je nutná registrace e-mailem a heslem. Uživatel je povinen uvádět pravdivé údaje a chránit své přihlašovací údaje před zneužitím třetí osobou.</p>

    <h2 class="font-bold text-primary-900 text-lg mt-6">4. Ceník a platební podmínky</h2>
    <p>Služba je nabízena ve variantách:</p>
    <ul class="list-disc pl-6">
      <li><strong>FREE</strong> – zdarma, omezený rozsah funkcí</li>
      <li><strong>PRO</strong> – 490 Kč / měsíc</li>
      <li><strong>FIRMA</strong> – 1 490 Kč / měsíc</li>
    </ul>
    <p>Ceny jsou uvedeny [bez DPH / včetně DPH – doplňte podle vašeho stavu plátcovství DPH]. Platby jsou zpracovávány prostřednictvím platební brány Stripe. Předplatné se automaticky obnovuje na měsíční bázi, dokud jej uživatel nezruší v nastavení účtu. Zrušení je možné kdykoliv, k okamžiku konce aktuálně zaplaceného období.</p>

    <h2 class="font-bold text-primary-900 text-lg mt-6">5. Odstoupení od smlouvy</h2>
    <p>V souladu s § 1837 občanského zákoníku nelze u digitálního obsahu nedodávaného na hmotném nosiči odstoupit od smlouvy poté, co uživatel udělil výslovný souhlas se zahájením plnění před uplynutím lhůty pro odstoupení. Uživatel bere na vědomí, že aktivací placeného plánu souhlasí s okamžitým zahájením poskytování Služby.</p>

    <h2 class="font-bold text-primary-900 text-lg mt-6">6. Omezení odpovědnosti</h2>
    <p>Provozovatel neodpovídá za škodu vzniklou v důsledku nezískání dotace, opomenutí termínu výzvy, ani za rozhodnutí uživatele učiněná na základě informací zobrazených ve Službě.</p>

    <h2 class="font-bold text-primary-900 text-lg mt-6">7. Ochrana osobních údajů</h2>
    <p>Zpracování osobních údajů se řídí samostatným dokumentem <a href="#/zasady-zpracovani-udaju" class="text-accent-600 font-semibold">Zásady zpracování osobních údajů</a>.</p>

    <h2 class="font-bold text-primary-900 text-lg mt-6">8. Závěrečná ustanovení</h2>
    <p>Vztahy těmito podmínkami neupravené se řídí právním řádem České republiky, zejména občanským zákoníkem (zákon č. 89/2012 Sb.). Provozovatel si vyhrazuje právo tyto podmínky jednostranně měnit; o změně bude uživatel informován e-mailem nebo formou oznámení ve Službě.</p>
    <p>Kontakt: [e-mail], [telefon – nepovinně]</p>
  `
  );
}

export function PrivacyPage({ user } = {}) {
  return LegalLayout(
    user,
    'Zásady zpracování osobních údajů',
    `
    <p><strong>Poznámka pro provozovatele:</strong> Toto je návrh v souladu s obecným rámcem GDPR. Před ostrým spuštěním doplňte identifikační údaje a nechte text zkontrolovat právníkem – zejména ověřte, zda někteří zpracovatelé (Stripe, Resend) ukládají data mimo EU/EHP a zda je potřeba doplnit standardní smluvní doložky.</p>

    <h2 class="font-bold text-primary-900 text-lg mt-6">1. Správce osobních údajů</h2>
    <p>Správcem osobních údajů je [Jméno a příjmení / obchodní firma], IČO: [doplňte], se sídlem [doplňte adresu], kontaktní e-mail: ondrejrada42@gmail.com (dále jen "Správce").</p>

    <h2 class="font-bold text-primary-900 text-lg mt-6">2. Jaké údaje zpracováváme</h2>
    <ul class="list-disc pl-6">
      <li>E-mailová adresa a heslo (heslo v zašifrované podobě, Správce k němu nemá přístup)</li>
      <li>Profil firmy: obor(y) podnikání, kraj, velikost firmy</li>
      <li>Nastavení notifikací a uložené/vyloučené výzvy</li>
      <li>Platební údaje – zpracovává výhradně platební brána Stripe, Správce čísla platebních karet nikdy nevidí ani neukládá</li>
      <li>Technické údaje (IP adresa, čas přihlášení) v rozsahu nezbytném pro provoz a zabezpečení</li>
    </ul>

    <h2 class="font-bold text-primary-900 text-lg mt-6">3. Účel a právní základ zpracování</h2>
    <ul class="list-disc pl-6">
      <li><strong>Plnění smlouvy</strong> – poskytování Služby, párování relevantních výzev, zasílání notifikací dle nastavení uživatele</li>
      <li><strong>Plnění právní povinnosti</strong> – vedení účetních dokladů u placených plánů</li>
      <li><strong>Oprávněný zájem</strong> – zabezpečení účtu a služby proti zneužití</li>
    </ul>

    <h2 class="font-bold text-primary-900 text-lg mt-6">4. Příjemci a zpracovatelé osobních údajů</h2>
    <p>Pro provoz Služby využíváme následující zpracovatele:</p>
    <ul class="list-disc pl-6">
      <li><strong>Supabase</strong> – databáze a autentizace uživatelů</li>
      <li><strong>Cloudflare</strong> – hosting aplikace a serverová infrastruktura</li>
      <li><strong>Resend</strong> – odesílání e-mailových notifikací</li>
      <li><strong>Stripe</strong> – zpracování plateb za předplatné</li>
    </ul>
    <p>Uvedení zpracovatelé mohou zpracovávat údaje i mimo Evropský hospodářský prostor; v takovém případě je přenos zajištěn standardními smluvními doložkami schválenými Evropskou komisí.</p>

    <h2 class="font-bold text-primary-900 text-lg mt-6">5. Doba uchovávání</h2>
    <p>Osobní údaje uchováváme po dobu trvání uživatelského účtu. Po zrušení účtu jsou údaje vymazány do 30 dnů, s výjimkou údajů, které je Správce povinen uchovávat déle na základě zákona (např. účetní doklady).</p>

    <h2 class="font-bold text-primary-900 text-lg mt-6">6. Práva subjektu údajů</h2>
    <p>Uživatel má právo na přístup ke svým osobním údajům, jejich opravu, výmaz, omezení zpracování, přenositelnost a právo vznést námitku proti zpracování. Žádosti lze zasílat na e-mail ondrejrada42@gmail.com. Uživatel má také právo podat stížnost u Úřadu pro ochranu osobních údajů (uoou.cz).</p>

    <h2 class="font-bold text-primary-900 text-lg mt-6">7. Cookies</h2>
    <p>Aplikace používá pouze technické cookies/úložiště nezbytné pro přihlášení a fungování Služby. V současné době nepoužíváme žádné analytické ani marketingové cookies třetích stran.</p>

    <h2 class="font-bold text-primary-900 text-lg mt-6">8. Kontakt</h2>
    <p>V případě dotazů ke zpracování osobních údajů nás kontaktujte na ondrejrada42@gmail.com.</p>
  `
  );
}
