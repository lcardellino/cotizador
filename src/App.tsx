import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { LayoutDashboard, Calculator, FileText, Users, Calendar, Bus, ChevronLeft, ChevronRight, Menu, Bell, LogOut } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useState, useEffect } from "react";
import { api } from "./lib/api";

import Dashboard from "./pages/Dashboard";
import Cotizador from "./pages/Cotizador";
import Cotizaciones from "./pages/Cotizaciones";
import Clientes from "./pages/Clientes";
import Agenda from "./pages/Agenda";
import Vehiculos from "./pages/Vehiculos";
import Login from "./pages/Login";

import type { ReactNode } from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }: { isCollapsed: boolean, setIsCollapsed: (val: boolean) => void, isMobileOpen: boolean, setIsMobileOpen: (val: boolean) => void }) {
  const location = useLocation();
  
  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/cotizador", label: "Cotizador", icon: Calculator },
    { path: "/clientes", label: "Clientes", icon: Users },
    { path: "/cotizaciones", label: "Presupuestos", icon: FileText },
    { path: "/agenda", label: "Agenda", icon: Calendar },
    { path: "/vehiculos", label: "Vehículos", icon: Bus },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      <div className={cn(
        "fixed md:static inset-y-0 left-0 z-50 flex flex-col h-full bg-[#161920] text-slate-300 border-r border-[#222631] transition-all duration-300 ease-in-out print:hidden overflow-x-hidden",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        isCollapsed ? "md:w-20" : "md:w-64",
        "w-64 shrink-0" // default width for mobile when open
      )}>
        <div className="p-4 flex items-center justify-between">
          <div className={cn(
            "bg-transparent flex items-center justify-center overflow-hidden transition-all duration-300",
            isCollapsed ? "w-12 h-12 p-1 md:mx-auto" : "w-full p-3 min-h-[64px]"
          )}>
            <img 
              src={isCollapsed ? "/logo fono solo.png" : "/logo.png"} 
              alt="Grupo Fono Bus" 
              className={cn(
                "object-contain transition-all duration-300",
                isCollapsed ? "max-h-8" : "max-h-12"
              )} 
            />
          </div>
        </div>
        
        <nav className="flex-1 px-3 space-y-2 mt-4 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors whitespace-nowrap relative",
                  isActive 
                    ? "bg-[#112a2e] text-[#2dd4bf]" 
                    : "text-slate-400 hover:bg-[#1a1d24] hover:text-slate-200",
                  isCollapsed ? "md:justify-center" : ""
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2dd4bf] rounded-l-lg" />
                )}
                <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-[#2dd4bf]" : "text-slate-400")} />
                <span className={cn(
                  "font-medium transition-all duration-300",
                  isCollapsed ? "md:opacity-0 md:w-0 md:hidden" : "opacity-100 w-auto"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle Button (Desktop only) */}
        <div className="p-4 hidden md:flex justify-end border-t border-[#222631]">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-[#1a1d24] text-slate-400 hover:text-white transition-colors flex items-center justify-center w-full"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </>
  );
}

function Layout({ children, onLogout }: { children: ReactNode, onLogout: () => void }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [upcomingRTOs, setUpcomingRTOs] = useState<any[]>([]);

  const currentUser = localStorage.getItem("currentUser") || "lucas";

  useEffect(() => {
    const loadBudgets = async () => {
      try {
        const parsed = await api.getBudgets(currentUser);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setDate(today.getDate() + 3);

        const upcoming = parsed.filter((b: any) => {
          if (!b.date) return false;
          // Assuming date is in YYYY-MM-DD format
          const dateStringWithTime = b.date.includes('T') ? b.date : `${b.date}T00:00:00`;
          const eventDate = new Date(dateStringWithTime);
          return eventDate >= today && eventDate <= threeDaysFromNow && b.status === 'confirmado';
        }).sort((a: any, b: any) => {
          const dateA = new Date(a.date.includes('T') ? a.date : `${a.date}T00:00:00`).getTime();
          const dateB = new Date(b.date.includes('T') ? b.date : `${b.date}T00:00:00`).getTime();
          return dateA - dateB;
        });

        setUpcomingEvents(upcoming);
      } catch (e) {
        console.error("Error fetching saved budgets for alerts", e);
      }
    };

    const loadVehicles = async () => {
      try {
        const vehicles = await api.getVehicles();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tenDaysFromNow = new Date(today);
        tenDaysFromNow.setDate(today.getDate() + 10);

        const rtos: any[] = [];

        vehicles.forEach((v: any) => {
          if (v.rtoNacional) {
            const rtoNacDate = new Date(`${v.rtoNacional}T00:00:00`);
            if (rtoNacDate >= today && rtoNacDate <= tenDaysFromNow) {
              rtos.push({ id: `${v.id}-nac`, plate: v.plate, type: 'Nacional', date: v.rtoNacional });
            } else if (rtoNacDate < today) {
              rtos.push({ id: `${v.id}-nac`, plate: v.plate, type: 'Nacional', date: v.rtoNacional, expired: true });
            }
          }
          if (v.rtoProvincial) {
            const rtoProvDate = new Date(`${v.rtoProvincial}T00:00:00`);
            if (rtoProvDate >= today && rtoProvDate <= tenDaysFromNow) {
              rtos.push({ id: `${v.id}-prov`, plate: v.plate, type: 'Provincial', date: v.rtoProvincial });
            } else if (rtoProvDate < today) {
              rtos.push({ id: `${v.id}-prov`, plate: v.plate, type: 'Provincial', date: v.rtoProvincial, expired: true });
            }
          }
        });

        rtos.sort((a, b) => new Date(`${a.date}T00:00:00`).getTime() - new Date(`${b.date}T00:00:00`).getTime());
        setUpcomingRTOs(rtos);
      } catch (e) {
        console.error("Error fetching vehicles for alerts", e);
      }
    };

    loadBudgets();
    loadVehicles();

    window.addEventListener("vehiclesUpdated", loadVehicles);
    return () => {
      window.removeEventListener("vehiclesUpdated", loadVehicles);
    };
  }, [currentUser]);

  return (
    <div className="flex h-screen bg-[#0f1117] overflow-hidden font-sans">
      <Sidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-[#161920] border-b border-[#222631] p-4 flex items-center justify-between shadow-sm z-30">
          <div className="flex items-center">
            <button 
              onClick={() => setIsMobileOpen(true)} 
              className="md:hidden p-2 -ml-2 text-slate-400 hover:bg-[#1a1d24] rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="md:hidden ml-4 font-semibold text-white">Grupo Fono Bus</span>
          </div>
          
          <div className="flex items-center gap-4 relative ml-auto">
            <button 
              className="p-2 text-slate-400 hover:text-white hover:bg-[#222631] rounded-lg transition-colors relative"
              onClick={() => setShowAlerts(!showAlerts)}
            >
              <Bell className="w-5 h-5" />
              {(upcomingEvents.length > 0 || upcomingRTOs.length > 0) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-[#222631] rounded-lg transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>

            {showAlerts && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-[#161920] border border-[#222631] rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-3 border-b border-[#222631] bg-[#1a1d24]">
                  <h3 className="text-sm font-semibold text-white">Próximos Eventos (3 días)</h3>
                </div>
                <div className="max-h-60 overflow-y-auto p-2 space-y-2">
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.map(event => (
                      <div key={event.id} className="p-3 rounded-lg bg-[#0f1117] border border-[#222631]">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium text-white">{event.client}</span>
                          <span className="text-xs text-slate-400">{event.date}</span>
                        </div>
                        <div className="text-xs text-slate-400 mb-2 truncate">{event.origen} → {event.destination}</div>
                        <div className="flex justify-between items-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${event.paymentStatus === 'pago' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                            {event.paymentStatus === 'pago' ? 'Pagado' : 'Falta Pagar'}
                          </span>
                          <span className="text-xs font-mono text-blue-400">{event.budgetNumber}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-slate-500">
                      No hay eventos confirmados para los próximos 3 días.
                    </div>
                  )}
                </div>
                
                <div className="p-3 border-y border-[#222631] bg-[#1a1d24]">
                  <h3 className="text-sm font-semibold text-white">Vencimientos RTO (10 días)</h3>
                </div>
                <div className="max-h-60 overflow-y-auto p-2 space-y-2">
                  {upcomingRTOs.length > 0 ? (
                    upcomingRTOs.map(rto => (
                      <div key={rto.id} className={`p-3 rounded-lg bg-[#0f1117] border ${rto.expired ? 'border-red-500/50' : 'border-amber-500/50'}`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium text-white">Patente: {rto.plate}</span>
                          <span className={`text-xs ${rto.expired ? 'text-red-400 font-bold' : 'text-amber-400'}`}>{rto.date}</span>
                        </div>
                        <div className="text-xs text-slate-400">
                          RTO {rto.type} {rto.expired ? 'Vencida' : 'por vencer'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-slate-500">
                      No hay vencimientos RTO próximos.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("isAuthenticated") === "true";
  });
  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem("currentUser") || "";
  });

  const handleLogin = (username: string) => {
    setIsAuthenticated(true);
    setCurrentUser(username);
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("currentUser", username);

    // Migrate old budgets if they exist and the user's specific storage is empty
    const oldBudgets = localStorage.getItem("savedBudgets");
    const userBudgets = localStorage.getItem(`savedBudgets_${username}`);
    
    if (oldBudgets && !userBudgets) {
      localStorage.setItem(`savedBudgets_${username}`, oldBudgets);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser("");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("currentUser");
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          !isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" />
        } />
        
        <Route path="/*" element={
          isAuthenticated ? (
            <Layout onLogout={handleLogout}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/cotizador" element={<Cotizador />} />
                <Route path="/cotizaciones" element={<Cotizaciones />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/agenda" element={<Agenda />} />
                <Route path="/vehiculos" element={<Vehiculos />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />
      </Routes>
    </BrowserRouter>
  );
}
