import { formatMoney } from '@/utils/currency';
import { formatRoi, roi, sparklinePath } from '@/utils/valuation';

// CELLAR-008: valoarea vinului în timp + câștigul față de prețul de achiziție
export default function ValueHistory({ wine, valuations = [] }) {
  const path = sparklinePath(valuations, 220, 48);
  const gain = roi(wine.purchasePrice, wine.estimatedValue);
  if (!path && gain == null) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.25rem' }}>
      {path && (
        <svg width="220" height="48" viewBox="-2 -2 224 52" role="img" aria-label={`Valoarea estimată în timp, de la ${formatMoney(valuations[0].value, valuations[0].currency)} la ${formatMoney(valuations.at(-1).value, valuations.at(-1).currency)}`}>
          <path d={path} fill="none" stroke="#c44569" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      )}
      {gain != null && (
        <div>
          <div style={{ fontSize: '1.4rem', color: gain >= 0 ? '#7fc79a' : '#ff8f8f' }}>{formatRoi(gain)}</div>
          <div style={{ fontSize: '0.72rem', opacity: 0.65 }}>față de prețul de achiziție</div>
        </div>
      )}
    </div>
  );
}
