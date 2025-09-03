import { useEffect, useRef, useState } from 'react'
import { GoWsClient } from './lib/go'

function App() {
  const [systemInfo, setSystemInfo] = useState({})
  const [isConnected, setIsConnected] = useState(false)
  const client = useRef(null)

  useEffect(() => {
    client.current = new GoWsClient()
    
    client.current.onSystemInfo((data) => {
      setSystemInfo(data)
      setIsConnected(true)
    })

    return () => client.current?.disconnect()
  }, [])

  useEffect(() => {
    if (!isConnected) return
    
    const interval = setInterval(() => {
      client.current?.sendCommand('get-system-info')
    }, 1000)
    
    return () => clearInterval(interval)
  }, [isConnected])

  function clearRecycleBin() {
    client.current?.sendCommand('clear-recycle-bin')
    console.log('Clearing recycle bin...')
    alert('Cleared recycle bin (Not really)')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold">System Dashboard</h1>
        <p className="text-gray-400">
          Powered by <span className="text-blue-400">Electron</span>,{' '}
          <span className="text-green-400">Go</span> & React
        </p>
        {!isConnected && (
          <p className="text-yellow-400 mt-2">
            Connecting to system monitor...
          </p>
        )}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {Object.entries(systemInfo).length > 0 ? (
          Object.entries(systemInfo).map(([key, value]) => (
            <div key={key} className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-gray-400 text-sm capitalize">{key}</div>
              <div className="text-white text-xl font-semibold mt-1">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-400">
            Loading system information...
          </div>
        )}

       
      </div>
      <button onClick={clearRecycleBin} className='bg-purple-700 text-white px-4 py-2 rounded-xl cursor-pointer hover:bg-purple-600 transition-all active:scale-95'>Clear Recycle Bin</button>
    </div>
  )
}

export default App
