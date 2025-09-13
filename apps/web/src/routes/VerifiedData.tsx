import { useEffect, useState } from 'react'
import { initPostHog, posthog } from '@/lib/posthog'

export default function VerifiedData() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => { 
    initPostHog(); 
    posthog.capture('page_view', { route: location.pathname })
    
    fetch('https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/ssot-status', {
      headers: {
        'Authorization': 'Bearer ' + import.meta.env.VITE_SUPABASE_ANON_KEY
      }
    })
    .then(res => res.json())
    .then(setData)
    .finally(() => setLoading(false))
  }, [])
  
  if (loading) return <div className="p-6">Loading...</div>
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Verified Data</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Table</th>
            <th className="border p-2">Row Count</th>
            <th className="border p-2">Min Date</th>
            <th className="border p-2">Max Date</th>
            <th className="border p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.table_name} className={row.row_count === 0 ? 'bg-red-50' : ''}>
              <td className="border p-2">{row.table_name}</td>
              <td className="border p-2">{row.row_count}</td>
              <td className="border p-2">{row.min_date}</td>
              <td className="border p-2">{row.max_date}</td>
              <td className="border p-2">{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}