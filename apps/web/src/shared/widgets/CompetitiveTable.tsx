import React from 'react';
type Row = { region:string; ourSharePct:number|null; topCompetitor:string|null; topCompSharePct:number|null; deltaPct:number|null };
const CompetitiveTable:React.FC<{rows:Row[]}> = ({rows})=>(
  <div className="rounded-lg border p-4">
    <div className="text-sm text-muted-foreground mb-2">Competitive Overview</div>
    <table className="w-full text-sm">
      <thead><tr><th className="text-left">Region</th><th>Our Share</th><th>Top Competitor</th><th>Share</th><th>Δ</th></tr></thead>
      <tbody>
        {rows.map((r,i)=>(
          <tr key={i} className="border-t">
            <td>{r.region}</td>
            <td className="text-center">{r.ourSharePct ?? '—'}%</td>
            <td className="text-center">{r.topCompetitor ?? '—'}</td>
            <td className="text-center">{r.topCompSharePct ?? '—'}%</td>
            <td className={`text-center ${r.deltaPct != null && r.deltaPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{r.deltaPct ?? '—'}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
export default CompetitiveTable;
