import Link from 'next/link';
import LegalPage from '@/components/LegalPage';

export const metadata = { title: 'Politica de confidențialitate — Vinerys' };

export default function PrivacyPage() {
  return (
    <LegalPage title="Politica de confidențialitate" updated="11 octombrie 2026">
      <p><strong>Operator:</strong> [NUME OPERATOR / FIRMĂ], [ADRESĂ], contact: [EMAIL DE CONTACT].</p>

      <h2>Ce date colectăm</h2>
      <ul>
        <li><strong>Cont:</strong> nume, adresă de email, parolă (stocată doar ca hash), avatar opțional.</li>
        <li><strong>Pivnița ta:</strong> vinurile pe care le adaugi (nume, producător, an, preț, locație, note, rating) și fotografiile încărcate.</li>
        <li><strong>Istoric:</strong> acțiunile asupra vinurilor (adăugare, modificare, consum) și scanările AI.</li>
        <li><strong>Tehnice:</strong> sesiunile de autentificare (dată, IP, browser), pentru securitatea contului.</li>
        <li><strong>Agenți AI:</strong> cheile API pe care le adaugi sunt criptate și nu sunt afișate niciodată în clar. Tokenii și costul estimat al fiecărui apel AI sunt păstrați pentru statistici.</li>
      </ul>

      <h2>De ce le folosim</h2>
      <p>Datele sunt folosite pentru a-ți oferi serviciul (pivnița, recomandările, scanarea etichetelor), pentru securitatea contului și pentru emailurile tranzacționale (confirmare email, resetare parolă). Temeiul legal este executarea contractului (art. 6(1)(b) GDPR) și interesul legitim pentru securitate (art. 6(1)(f)). Nu vindem date și nu facem publicitate.</p>

      <h2>Cu cine le împărtășim</h2>
      <ul>
        <li><strong>Furnizorii AI</strong> pe care îi configurezi tu (de ex. Google Gemini, Anthropic, OpenRouter): primesc fotografia etichetei pentru identificare, cu cheia ta API.</li>
        <li><strong>Email:</strong> [FURNIZOR EMAIL, de ex. Brevo] trimite emailurile tranzacționale.</li>
        <li><strong>Găzduire:</strong> [FURNIZOR GĂZDUIRE / LOCAȚIE SERVER].</li>
      </ul>
      <p>Dacă activezi <em>colecția publică</em>, oricine are linkul vede vinurile și fotografiile din colecție. O poți dezactiva oricând din Setări.</p>

      <h2>Cookie-uri</h2>
      <p>Folosim doar cookie-uri strict necesare: sesiunea de autentificare și preferințele de afișare. Nu folosim cookie-uri de analiză sau marketing, deci nu este necesar un banner de consimțământ. Dacă vom adăuga astfel de cookie-uri, îți vom cere acordul înainte.</p>

      <h2>Cât timp le păstrăm</h2>
      <p>Cât timp ai cont. La ștergerea contului, datele și fotografiile sunt șterse imediat. Copiile de siguranță se suprascriu în cel mult [NUMĂR] zile.</p>

      <h2>Drepturile tale</h2>
      <p>Ai dreptul de acces, rectificare, ștergere, portabilitate, opoziție și restricționare. Din <Link href="/settings">Setări</Link> poți descărca toate datele (JSON) și îți poți șterge contul. Pentru orice altă cerere: [EMAIL DE CONTACT]. Poți depune o plângere la ANSPDCP (dataprotection.ro).</p>
    </LegalPage>
  );
}
