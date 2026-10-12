'use client';

export default function PrintButton({ label = 'Printează' }) {
  return <button type="button" onClick={() => window.print()}>{label}</button>;
}
