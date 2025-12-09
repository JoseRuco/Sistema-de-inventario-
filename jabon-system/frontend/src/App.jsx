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
import Analytics from './components/ui/Analytics';

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

  // Detectar si se abrió desde pantalla de inicio (PWA)
  useEffect(() => {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone ||
      document.referrer.includes('android-app://');

    if (isPWA) {
      console.log('✅ App abierta en modo PWA standalone');
      // Ocultar barra de direcciones en Android si es posible
      if (window.screen && window.screen.orientation) {
        try {
          window.screen.orientation.lock('portrait').catch(() => { });
        } catch (e) { }
      }
    } else {
      console.log('ℹ️ App abierta en navegador normal');
    }

    // Prevenir zoom en iOS PWA
    document.addEventListener('gesturestart', function (e) {
      e.preventDefault();
    });
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
      {currentView === 'analytics' && <Analytics />}
      {currentView === 'reports' && <Reports />}
      {currentView === 'config' && <Configuracion />}
    </Layout>
  );
}

export default App;
