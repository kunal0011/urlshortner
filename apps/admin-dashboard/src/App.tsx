import { useState } from 'react';
import Sidebar, { type Page } from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Links from './pages/Links';
import Users from './pages/Users';
import Orgs from './pages/Orgs';
import './index.css';

function App() {
  const [page, setPage] = useState<Page>('dashboard');

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard />;
      case 'links': return <Links />;
      case 'users': return <Users />;
      case 'orgs': return <Orgs />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar active={page} onNavigate={setPage} />
      <main style={{ flex: 1, padding: '32px 40px', overflow: 'auto' }}>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
