import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  History,
  BarChart3,
  Menu,
  X,
  LogOut,
  PackageCheck,
  CreditCard,
  Settings,
  TrendingUp,
  Truck
} from "lucide-react";
import InstallPWA from "./InstallPWA";
import { getColombiaDateObject } from "../../utils/dateUtils";


const Layout = ({ children, currentView, setCurrentView, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      setDesktopSidebarOpen(!desktopSidebarOpen);
    } else {
      setSidebarOpen(true);
    }
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "sales", label: "Nueva venta", icon: ShoppingCart },
    { id: "orders", label: "Pedidos y Encargos", icon: Truck },
    { id: "products", label: "Productos", icon: Package },
    { id: "clients", label: "Clientes", icon: Users },
    { id: 'credits', label: 'Cuentas por Cobrar', icon: CreditCard },
    { id: "history", label: "Historial de ventas", icon: History },
    { id: "stockHistory", label: "Historial de Stock", icon: PackageCheck },
    { id: "analytics", label: "Análisis de Negocio", icon: TrendingUp },
    { id: "reports", label: "Reportes", icon: BarChart3 },
    //{ id: "config", label: "Configuración", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <aside 
        className={`hidden ${desktopSidebarOpen ? 'lg:flex' : 'lg:hidden'} lg:flex-col w-64 bg-white border-r border-gray-200 shadow-sm transition-all duration-300`}
      >
        <div className="p-0 border-b border-gray-200">
          <div className="inline-flex w-25 h-30 just">
            <img
              draggable="false"
              src="/img/Programmer-SINFONDO.png"
              alt=""
            />
          </div>
        </div>

        <nav className="flex-1 p-1 space-y-0">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all ${currentView === item.id
                  ? "bg-primary text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Sidebar - Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div className="inline-flex w-25 h-50 ">
                <img
                  draggable="false"
                  src="/img/Programmer-SINFONDO.png"
                  alt=""
                />
              </div>

              <button onClick={() => setSidebarOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <nav className="p-1 space-y-0">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${currentView === item.id
                      ? "bg-primary text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}

              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Cerrar sesión</span>
                </button>
              </div>
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 py-4 lg:px-8">
            <div className="flex items-center justify-between">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
                title={desktopSidebarOpen ? "Ocultar menú" : "Mostrar menú"}
              >
                <Menu size={24} />
              </button>
              <h2 className="text-xl font-semibold text-gray-800 hidden lg:block">
                {menuItems.find((item) => item.id === currentView)?.label}
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 capitalize">
                  {getColombiaDateObject().toLocaleDateString("es-CO", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-8">{children}</main>
      </div>

      {/* PWA Install Prompt */}
      <InstallPWA />
    </div>
  );
};

export default Layout;
