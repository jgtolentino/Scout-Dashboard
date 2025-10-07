import { fetchKpis, fetchEtlRuns } from "../../actions/fetchKpis";

export default async function OverviewPage() {
  try {
    const [kpiRows, etlRuns] = await Promise.all([
      fetchKpis(),
      fetchEtlRuns(5)
    ]);
    
    const latest = kpiRows[0] ?? { 
      linked: 0, 
      extracted: 0, 
      runs: 0, 
      all_ok: false, 
      h: "No data" 
    };
    
    const totalLinked = kpiRows.reduce((sum, row) => sum + row.linked, 0);
    const totalExtracted = kpiRows.reduce((sum, row) => sum + row.extracted, 0);
    const totalRuns = kpiRows.reduce((sum, row) => sum + row.runs, 0);

    return (
      <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ marginBottom: 24, color: '#1a1a1a' }}>Scout – ETL Overview</h1>
        
        {/* Current Status */}
        <section style={{ 
          backgroundColor: '#f8f9fa', 
          padding: 20, 
          borderRadius: 8, 
          marginBottom: 24,
          border: '1px solid #e9ecef'
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '1.2em', color: '#495057' }}>Current Status</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <strong>Last Run:</strong> {new Date(latest.h).toLocaleString()}
            </div>
            <div>
              <strong>Linked:</strong> <span style={{ color: '#28a745' }}>{latest.linked}</span>
            </div>
            <div>
              <strong>Extracted:</strong> <span style={{ color: '#007bff' }}>{latest.extracted}</span>
            </div>
            <div>
              <strong>Runs/Hour:</strong> {latest.runs}
            </div>
            <div>
              <strong>Health:</strong>{' '}
              <span style={{ 
                color: latest.all_ok ? '#28a745' : '#dc3545',
                fontWeight: 'bold'
              }}>
                {latest.all_ok ? "✅ OK" : "⚠️ Attention"}
              </span>
            </div>
          </div>
        </section>

        {/* 24H Summary */}
        <section style={{ 
          backgroundColor: '#ffffff', 
          padding: 20, 
          borderRadius: 8, 
          marginBottom: 24,
          border: '1px solid #e9ecef'
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '1.2em', color: '#495057' }}>Last 24 Hours</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
            <div style={{ textAlign: 'center', padding: 16, backgroundColor: '#e8f5e8', borderRadius: 6 }}>
              <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#28a745' }}>{totalLinked}</div>
              <div style={{ fontSize: '0.9em', color: '#6c757d' }}>Total Linked</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, backgroundColor: '#e7f3ff', borderRadius: 6 }}>
              <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#007bff' }}>{totalExtracted}</div>
              <div style={{ fontSize: '0.9em', color: '#6c757d' }}>Total Extracted</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, backgroundColor: '#fff3cd', borderRadius: 6 }}>
              <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#856404' }}>{totalRuns}</div>
              <div style={{ fontSize: '0.9em', color: '#6c757d' }}>Total Runs</div>
            </div>
          </div>
        </section>

        {/* Recent Runs */}
        <section style={{ 
          backgroundColor: '#ffffff', 
          padding: 20, 
          borderRadius: 8,
          border: '1px solid #e9ecef'
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '1.2em', color: '#495057' }}>Recent Runs</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Time</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>Linked</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>Extracted</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Status</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Error</th>
                </tr>
              </thead>
              <tbody>
                {etlRuns.map((run) => (
                  <tr key={run.run_id} style={{ borderBottom: '1px solid #f8f9fa' }}>
                    <td style={{ padding: '8px 12px' }}>
                      {new Date(run.ran_at).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: '#28a745' }}>
                      {run.linked}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: '#007bff' }}>
                      {run.extracted}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      {run.ok ? (
                        <span style={{ color: '#28a745' }}>✅</span>
                      ) : (
                        <span style={{ color: '#dc3545' }}>❌</span>
                      )}
                    </td>
                    <td style={{ 
                      padding: '8px 12px', 
                      color: '#dc3545', 
                      fontSize: '0.8em',
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {run.err || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Instructions */}
        <section style={{ 
          backgroundColor: '#f8f9fa', 
          padding: 16, 
          borderRadius: 8, 
          marginTop: 24,
          fontSize: '0.9em',
          color: '#6c757d'
        }}>
          <strong>ETL Pipeline:</strong> Runs every 5 minutes • Links face events to transactions • Extracts brands from transcripts
        </section>
      </main>
    );

  } catch (error) {
    return (
      <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <h1>Scout – ETL Overview</h1>
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: 16, 
          borderRadius: 8,
          border: '1px solid #f5c6cb'
        }}>
          <strong>Error loading dashboard:</strong> {error instanceof Error ? error.message : 'Unknown error'}
        </div>
        <p style={{ marginTop: 16, color: '#6c757d' }}>
          Please check your Supabase configuration and ensure the ETL tables are properly set up.
        </p>
      </main>
    );
  }
}