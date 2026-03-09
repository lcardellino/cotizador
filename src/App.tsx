import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Calculator, History } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import Dashboard from "./pages/Dashboard";
import Cotizador from "./pages/Cotizador";
import Historial from "./pages/Historial";

import type { ReactNode } from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function Sidebar() {
  const location = useLocation();
  
  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/cotizador", label: "Cotizador", icon: Calculator },
    { path: "/historial", label: "Historial", icon: History },
  ];

  return (
    <div className="w-64 bg-green-900 text-green-100 flex flex-col h-full border-r border-green-800 print:hidden">
      <div className="p-6">
        <div className="bg-white p-3 rounded-xl mb-2 shadow-sm flex items-center justify-center min-h-[64px]">
          <img src="/logo.png" alt="Grupo Fono Bus" className="max-h-12 object-contain" />
        </div>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                isActive 
                  ? "bg-green-700 text-white shadow-sm" 
                  : "hover:bg-green-800 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/cotizador" element={<Cotizador />} />
          <Route path="/historial" element={<Historial />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
