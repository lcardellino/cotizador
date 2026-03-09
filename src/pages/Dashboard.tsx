import { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { MapPin, Users, Route, Car } from "lucide-react";

interface DashboardData {
  totalTrips: number;
  totalKm: number;
  totalPassengers: number;
  avgKmPerTrip: number;
  tripTypes: {
    short: number;
    medium: number;
    long: number;
  };
  tripScopes: {
    provincial: number;
    national: number;
    international: number;
  };
  heatmapData: { location: string; value: number }[];
}

const COLORS = ['#16a34a', '#dc2626', '#f59e0b', '#2563eb', '#8b5cf6'];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedBudgetsStr = localStorage.getItem("savedBudgets");
      const budgets: any[] = savedBudgetsStr ? JSON.parse(savedBudgetsStr) : [];
      
      // Filter only 'realizado' budgets for statistics
      const realizedBudgets = budgets.filter(b => b.status === 'realizado');
      
      const totalTrips = realizedBudgets.length;
      const totalKm = realizedBudgets.reduce((acc, b) => acc + (Number(b.km) || 0), 0);
      const totalPassengers = realizedBudgets.reduce((acc, b) => acc + (Number(b.passengers) || 0), 0); // Assuming passengers might be added later, or we just use 0
      const avgKmPerTrip = totalTrips > 0 ? totalKm / totalTrips : 0;

      const tripTypes = {
        short: realizedBudgets.filter(b => b.km < 100).length,
        medium: realizedBudgets.filter(b => b.km >= 100 && b.km <= 500).length,
        long: realizedBudgets.filter(b => b.km > 500).length,
      };

      const tripScopes = {
        provincial: realizedBudgets.filter(b => b.tripType === 'provincial').length,
        national: realizedBudgets.filter(b => b.tripType === 'nacional').length,
        international: realizedBudgets.filter(b => b.tripType === 'internacional').length,
      };

      const locationCounts: Record<string, number> = {};
      realizedBudgets.forEach(b => {
        if (b.destination) {
          locationCounts[b.destination] = (locationCounts[b.destination] || 0) + 1;
        }
      });
      
      const heatmapData = Object.entries(locationCounts)
        .map(([location, value]) => ({ location, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5 destinations

      // If no realized budgets, show some empty or default state
      if (totalTrips === 0) {
        setData({
          totalTrips: 0,
          totalKm: 0,
          totalPassengers: 0,
          avgKmPerTrip: 0,
          tripTypes: { short: 0, medium: 0, long: 0 },
          tripScopes: { provincial: 0, national: 0, international: 0 },
          heatmapData: []
        });
      } else {
        setData({
          totalTrips,
          totalKm,
          totalPassengers,
          avgKmPerTrip,
          tripTypes,
          tripScopes,
          heatmapData
        });
      }
      setLoading(false);
    } catch (err) {
      console.error("Failed to load dashboard data from localStorage", err);
      setLoading(false);
    }
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const tripTypeData = [
    { name: 'Cortos (< 100km)', value: data?.tripTypes?.short || 0 },
    { name: 'Medios (100-500km)', value: data?.tripTypes?.medium || 0 },
    { name: 'Largos (> 500km)', value: data?.tripTypes?.long || 0 },
  ];

  const tripScopeData = [
    { name: 'Provincial', value: data?.tripScopes?.provincial || 0 },
    { name: 'Nacional', value: data?.tripScopes?.national || 0 },
    { name: 'Internacional', value: data?.tripScopes?.international || 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard de Operaciones</h1>
        <p className="text-slate-500 mt-1">Resumen general de viajes y métricas.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Viajes Realizados" 
          value={(data?.totalTrips || 0).toLocaleString()} 
          icon={Car} 
          color="text-green-600" 
          bg="bg-green-100" 
        />
        <KpiCard 
          title="Kilómetros Totales" 
          value={`${(data?.totalKm || 0).toLocaleString()} km`} 
          icon={Route} 
          color="text-emerald-600" 
          bg="bg-emerald-100" 
        />
        <KpiCard 
          title="Pasajeros Transportados" 
          value={(data?.totalPassengers || 0).toLocaleString()} 
          icon={Users} 
          color="text-amber-600" 
          bg="bg-amber-100" 
        />
        <KpiCard 
          title="Promedio por Viaje" 
          value={`${Math.round(data?.avgKmPerTrip || 0).toLocaleString()} km`} 
          icon={MapPin} 
          color="text-red-600" 
          bg="bg-red-100" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trip Types Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Tipos de Viajes (Distancia)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tripTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {tripTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trip Scopes Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Alcance de Viajes</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tripScopeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {tripScopeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heatmap / Top Locations */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Destinos Frecuentes (Mapa de Calor)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.heatmapData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="location" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, color, bg }: { title: string, value: string, icon: any, color: string, bg: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
      <div className={`p-4 rounded-xl ${bg} ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
