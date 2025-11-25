import { useState, useEffect } from 'react';
import Layout from './components/ui/Layout';
import Dashboard from './components/ui/Dashboard';
import Products from './components/ui/Products.jsx';
import Clients from './components/ui/Clients';
import Sales from './components/ui/Sales';
import SalesHistory from './components/ui/SalesHistory';
import Reports from './components/ui/Reports';
import StockHistory from './components/ui/StockHistory';
import Login from './components/ui/Login';
import Credits from './components/ui/Credits';
import Configuracion from './components/ui/Configuracion';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar si hay sesión activa al cargar
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Función para manejar login exitoso
  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    setCurrentView('dashboard');
  };

  // Si no está autenticado, mostrar Login
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout
      currentView={currentView}
      setCurrentView={setCurrentView}
      onLogout={handleLogout}
    >
      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'products' && <Products />}
      {currentView === 'clients' && <Clients />}
      {currentView === 'sales' && <Sales />}
      {currentView === 'history' && <SalesHistory />}
      {currentView === 'stockHistory' && <StockHistory />}
      {currentView === 'credits' && <Credits />}
      {currentView === 'reports' && <Reports />}
      {currentView === 'config' && <Configuracion />}
    </Layout>
  );
}

export default App;
