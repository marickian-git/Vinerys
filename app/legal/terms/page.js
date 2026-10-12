import Link from 'next/link';
import LegalPage from '@/components/LegalPage';

export const metadata = { title: 'Termeni și condiții — Vinerys' };

export default function TermsPage() {
  return (
    <LegalPage title="Termeni și condiții" updated="11 octombrie 2026">
      <p>Vinerys este un serviciu de evidență a colecției personale de vinuri, oferit de [NUME OPERATOR / FIRMĂ]. Prin crearea unui cont accepți acești termeni.</p>

      <h2>Contul tău</h2>
      <p>Ești responsabil pentru păstrarea parolei și pentru datele pe care le introduci. Trebuie să ai vârsta legală pentru consumul de alcool în țara ta.</p>

      <h2>Recomandările AI</h2>
      <p>Identificarea etichetelor, ferestrele de consum, asocierile cu mâncarea și estimările de valoare sunt generate automat și pot conține erori. Sunt informative, nu sfaturi profesionale. Verifică datele importante (de ex. valoarea pentru asigurare).</p>

      <h2>Cheile AI proprii</h2>
      <p>Dacă adaugi chei API proprii, costurile apelurilor sunt suportate de contul tău la furnizorul respectiv. Vinerys le păstrează criptat și le folosește doar pentru cererile inițiate de tine.</p>

      <h2>Conținutul tău</h2>
      <p>Datele și fotografiile rămân ale tale. Ne acorzi doar dreptul de a le stoca și afișa pentru a-ți oferi serviciul. Le poți exporta sau șterge oricând din <Link href="/settings">Setări</Link>.</p>

      <h2>Utilizare acceptabilă</h2>
      <p>Nu încărca conținut ilegal și nu folosi serviciul pentru a ocoli limitele tehnice (de ex. scanări automate în masă).</p>

      <h2>Disponibilitate și răspundere</h2>
      <p>Serviciul este oferit „ca atare”, fără garanția funcționării neîntrerupte. În limitele legii, nu răspundem pentru pierderi indirecte. [CLAUZE DE REVIZUIT JURIDIC ÎNAINTE DE LANSAREA PUBLICĂ].</p>

      <h2>Modificări</h2>
      <p>Te anunțăm prin email despre modificările importante ale termenilor. Contact: [EMAIL DE CONTACT]. Detalii despre date: <Link href="/legal/privacy">Politica de confidențialitate</Link>.</p>
    </LegalPage>
  );
}
