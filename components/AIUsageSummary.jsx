// Consumul AI din ultimele 6 luni (AI-013). Costul e estimat din tokeni și prețurile configurate.
const number = (value) => new Intl.NumberFormat('ro-RO').format(value ?? 0);
const usd = (value) => (value == null ? '—' : `$${value.toFixed(value < 1 ? 4 : 2)}`);

function Table({ caption, head, rows }) {
  return (
    <div style={{ overflowX: 'auto', marginTop: '0.75rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
        <caption style={{ textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.6, marginBottom: '0.4rem' }}>{caption}</caption>
        <thead>
          <tr>{head.map((label) => <th key={label} scope="col" style={{ textAlign: 'left', padding: '0.35rem 0.5rem', fontWeight: 500, opacity: 0.7 }}>{label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((cells, index) => (
            <tr key={index} style={{ borderTop: '1px solid rgba(196,69,105,0.12)' }}>
              {cells.map((cell, cellIndex) => <td key={cellIndex} style={{ padding: '0.35rem 0.5rem' }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AIUsageSummary({ usage }) {
  if (!usage?.byMonth?.length) {
    return <p style={{ fontSize: '0.8rem', opacity: 0.6, margin: 0 }}>Încă nu există scanări AI înregistrate.</p>;
  }
  return (
    <div>
      <Table
        caption="Pe lună"
        head={['Luna', 'Apeluri', 'Tokeni (in / out)', 'Cost estimat', 'Eșuate']}
        rows={usage.byMonth.map((row) => [row.month, number(row.calls), `${number(row.inputTokens)} / ${number(row.outputTokens)}`, usd(row.costUsd), number(row.failures)])}
      />
      <Table
        caption="Pe agent"
        head={['Agent', 'Apeluri', 'Tokeni (in / out)', 'Cost estimat', 'Latență medie']}
        rows={usage.byAgent.map((row) => [row.name, number(row.calls), `${number(row.inputTokens)} / ${number(row.outputTokens)}`, usd(row.costUsd), row.avgLatencyMs == null ? '—' : `${number(row.avgLatencyMs)} ms`])}
      />
      {usage.platform && (
        <Table
          caption="Platformă (admin)"
          head={['Luna', 'Utilizatori', 'Apeluri', 'Cost estimat']}
          rows={usage.platform.map((row) => [row.month, number(row.users), number(row.calls), usd(row.costUsd)])}
        />
      )}
      <p style={{ fontSize: '0.72rem', opacity: 0.5, marginTop: '0.75rem' }}>
        Costul apare când agentul are prețuri setate sau e pe tier gratuit.
      </p>
    </div>
  );
}
