import { NavLink, Outlet } from 'react-router-dom'
import { useApiKey } from '../context/ApiKeyContext'
import './Layout.css'

export default function Layout() {
  const { apiKey, setApiKey } = useApiKey()

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">Blub</div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Dashboard
          </NavLink>
          <NavLink to="/resume" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Resume
          </NavLink>
          <NavLink to="/jobs" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Jobs
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <label className="api-key-label">API Key</label>
          <input
            className="api-key-input"
            type="password"
            placeholder="sk-ant-…"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
