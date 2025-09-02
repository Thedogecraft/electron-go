import { useEffect, useState } from 'react'
import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'

function App() {
  const [goOutput, setGoOutput] = useState('')

  useEffect(() => {
    const handler = (event, data) => {
      setGoOutput(data)
    }
    window.electron.ipcRenderer.on('go-output', handler)
    return () => {
      window.electron.ipcRenderer.removeListener('go-output', handler)
    }
  }, [])

  const requestSysInfo = () => {
    window.electron.ipcRenderer.send('go-command', 'sysinfo')
  }

  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">Powered by electron-vite</div>
      <div className="text">
        Build an Electron app with <span className="react">React</span>
      </div>
      <p className="tip">
        Please try pressing <code>F12</code> to open the devTool
      </p>
      <div className="actions">
        <div className="action">
          <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
            Documentation
          </a>
        </div>
        <div className="action">
          <button onClick={requestSysInfo}>Get System Info from Go</button>
        </div>
      </div>
      <Versions></Versions>
      <div
        style={{
          marginTop: '2em',
          padding: '1em',
          background: '#222',
          color: '#fff',
          borderRadius: '8px'
        }}
      >
        <strong>Go Output:</strong>
        <pre>{goOutput}</pre>
      </div>
    </>
  )
}

export default App
