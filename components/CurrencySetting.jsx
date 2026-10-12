'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { updateCurrency } from '@/utils/actions';
import { CURRENCIES } from '@/utils/currency';

// DATA-007: moneda în care se afișează statisticile; prețurile vinurilor rămân în moneda lor
export default function CurrencySetting({ initial = 'EUR' }) {
  const [currency, setCurrency] = useState(initial);
  const change = async (event) => {
    const next = event.target.value;
    setCurrency(next);
    const result = await updateCurrency(next);
    if (result?.error) toast.error(result.error);
    else toast.success(`Statisticile se afișează în ${next}`);
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
      <label htmlFor="currency-setting" style={{ fontSize: '0.85rem' }}>Moneda statisticilor</label>
      <select id="currency-setting" value={currency} onChange={change} className="set-input" style={{ width: 'auto' }}>
        {CURRENCIES.map((code) => <option key={code} value={code}>{code}</option>)}
      </select>
      <p style={{ flexBasis: '100%', margin: 0, fontSize: '0.75rem', opacity: 0.6 }}>Valorile în alte monede se convertesc cu cursul zilnic BCE. Prețul fiecărui vin rămâne în moneda în care l-ai introdus.</p>
    </div>
  );
}
