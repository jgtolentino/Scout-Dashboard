import { useDataStore } from '../store/dataStore'

function DataToggle() {
  const { dataSource, setDataSource } = useDataStore()

  return (
    <div className="data-toggle">
      <button
        className={`data-toggle-option ${dataSource === 'simulated' ? 'data-toggle-option-selected' : 'data-toggle-option-unselected'}`}
        onClick={() => setDataSource('simulated')}
      >
        Simulated
      </button>
      <button
        className={`data-toggle-option ${dataSource === 'realtime' ? 'data-toggle-option-selected' : 'data-toggle-option-unselected'}`}
        onClick={() => setDataSource('realtime')}
      >
        Real-time
      </button>
    </div>
  )
}

export default DataToggle
