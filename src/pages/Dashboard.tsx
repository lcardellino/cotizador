import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ComposedChart, Line
} from "recharts";
import { MapPin, Users, Route, Car, Plus, FileText, CheckCircle, DollarSign, TrendingUp, TrendingDown, ArrowUpRight, XCircle, Clock } from "lucide-react";

interface DashboardData {
  completedTrips: number;
  monthlyCompletedTripsRate: number;
  estimatedRevenue: number;
  monthlyRevenueRate: number;
  totalPassengers: number;
  profitMargin: number;
  totalVehicleCost: number;
  totalDriverCost: number;

  unitMetrics: {
    unitType: string;
    trips: number;
    avgPricePerKm: number;
  }[];

  tripTypes: {
    short: number;
    medium: number;
    long: number;
  };
  heatmapData: { location: string; value: number }[];
  recentBudgets: any[];
  revenueVsCostData: { month: string; revenue: number; costs: number }[];
}

const COLORS = ['#16a34a', '#dc2626', '#f59e0b', '#2563eb', '#8b5cf6'];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedBudgetsStr = localStorage.getItem("savedBudgets");
      const budgets: any[] = savedBudgetsStr ? JSON.parse(savedBudgetsStr) : [];
      
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      const isCurrentMonth = (dateStr: string) => {
        if (!dateStr) return false;
        const d = new Date(dateStr + 'T00:00:00');
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      };

      const isLastMonth = (dateStr: string) => {
        if (!dateStr) return false;
        const d = new Date(dateStr + 'T00:00:00');
        return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
      };

      const completedTripsList = budgets.filter(b => b.status === 'realizado');
      const completedTrips = completedTripsList.length;
      const currentMonthCompletedTrips = completedTripsList.filter(b => isCurrentMonth(b.date)).length;
      const lastMonthCompletedTrips = completedTripsList.filter(b => isLastMonth(b.date)).length;
      const monthlyCompletedTripsRate = lastMonthCompletedTrips === 0 ? 100 : ((currentMonthCompletedTrips - lastMonthCompletedTrips) / lastMonthCompletedTrips) * 100;

      const acceptedBudgetsList = budgets.filter(b => b.status === 'realizado' || b.status === 'confirmado');

      const estimatedRevenue = acceptedBudgetsList.reduce((acc, b) => acc + (Number(b.finalPrice) || 0), 0);
      
      const currentMonthRevenue = acceptedBudgetsList.filter(b => isCurrentMonth(b.date)).reduce((acc, b) => acc + (Number(b.finalPrice) || 0), 0);
      const lastMonthRevenue = acceptedBudgetsList.filter(b => isLastMonth(b.date)).reduce((acc, b) => acc + (Number(b.finalPrice) || 0), 0);
      const monthlyRevenueRate = lastMonthRevenue === 0 ? 100 : ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

      const totalPassengers = acceptedBudgetsList.reduce((acc, b) => acc + (Number(b.passengers) || 0), 0);

      const UNIT_SPECS: Record<string, { consumption: number; depreciation: number }> = {
        "19": { consumption: 8, depreciation: 200 },
        "24": { consumption: 3.5, depreciation: 400 },
        "44": { consumption: 3.5, depreciation: 400 },
        "46": { consumption: 3.5, depreciation: 400 },
        "60": { consumption: 3.5, depreciation: 800 },
      };

      let totalVehicleCost = 0;
      let totalDriverCost = 0;
      let totalProfit = 0;

      const monthlyData: Record<string, { revenue: number; costs: number }> = {};

      acceptedBudgetsList.forEach(b => {
        let bVehicleCost = 0;
        let bDriverCost = 0;

        if (b.carCost !== undefined) {
          bVehicleCost = (Number(b.carCost) || 0) + (Number(b.depreciationCost) || 0) + (Number(b.dirtRoadCost) || 0);
          bDriverCost = (Number(b.totalDriverCost) || 0);
        } else {
          // Recalculate for older budgets
          const totalKm = (Number(b.kmProductivos) || 0) + (Number(b.kmDestino) || 0) + (Number(b.kmImproductivos) || 0);
          const specs = UNIT_SPECS[b.unitType || "19"] || { consumption: 8, depreciation: 200 };
          const litersNeeded = specs.consumption > 0 ? totalKm / specs.consumption : 0;
          const carCost = litersNeeded * (Number(b.dieselPrice) || 1000) * (Number(b.busCount) || 1);
          const depreciationCost = totalKm * specs.depreciation * (Number(b.busCount) || 1);
          
          let baseDriverCost = 0;
          if (b.driverServiceType === "provincial") {
            baseDriverCost = 
              ((b.driverShift?.value || 0) * (b.driverShift?.count || 0)) + 
              ((b.driverViatico?.value || 0) * (b.driverViatico?.count || 0)) + 
              ((b.driverTomeDeje?.value || 0) * (b.driverTomeDeje?.count || 0)) + 
              ((b.driverExtraHour?.value || 0) * (b.driverExtraHour?.count || 0)) + 
              ((b.driverBed?.value || 0) * (b.driverBed?.count || 0));
          } else {
            baseDriverCost = 
              ((b.natBreakfast?.value || 0) * (b.natBreakfast?.count || 0)) + 
              ((b.natLunch?.value || 0) * (b.natLunch?.count || 0)) + 
              ((b.natSnack?.value || 0) * (b.natSnack?.count || 0)) + 
              ((b.natDinner?.value || 0) * (b.natDinner?.count || 0)) + 
              ((b.natBed?.value || 0) * (b.natBed?.count || 0));
          }
          const driverCost = baseDriverCost * (Number(b.driverCount) || 1);
          const baseCosts = carCost + depreciationCost + driverCost;
          const dirtRoadCost = baseCosts * ((Number(b.dirtRoadPercent) || 0) / 100);

          bVehicleCost = carCost + depreciationCost + dirtRoadCost;
          bDriverCost = driverCost;
        }

        totalVehicleCost += bVehicleCost;
        totalDriverCost += bDriverCost;
        totalProfit += (Number(b.profit) || 0);

        // Group by month for chart
        if (b.date) {
          const d = new Date(b.date + 'T00:00:00');
          const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { revenue: 0, costs: 0 };
          }
          monthlyData[monthKey].revenue += (Number(b.finalPrice) || 0);
          monthlyData[monthKey].costs += (bVehicleCost + bDriverCost);
        }
      });

      const profitMargin = estimatedRevenue > 0 ? (totalProfit / estimatedRevenue) * 100 : 0;

      const revenueVsCostData = Object.entries(monthlyData)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6); // Last 6 months

      const tripTypes = {
        short: acceptedBudgetsList.filter(b => b.km < 100).reduce((acc, b) => acc + (Number(b.km) || 0), 0),
        medium: acceptedBudgetsList.filter(b => b.km >= 100 && b.km <= 500).reduce((acc, b) => acc + (Number(b.km) || 0), 0),
        long: acceptedBudgetsList.filter(b => b.km > 500).reduce((acc, b) => acc + (Number(b.km) || 0), 0),
      };

      const locationCounts: Record<string, number> = {};
      acceptedBudgetsList.forEach(b => {
        if (b.destination) {
          locationCounts[b.destination] = (locationCounts[b.destination] || 0) + 1;
        }
      });
      
      const heatmapData = Object.entries(locationCounts)
        .map(([location, value]) => ({ location, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      const unitStats: Record<string, { trips: number, totalKm: number, totalRevenue: number }> = {};
      acceptedBudgetsList.forEach(b => {
        const unit = b.unitType || 'Desconocido';
        if (!unitStats[unit]) {
          unitStats[unit] = { trips: 0, totalKm: 0, totalRevenue: 0 };
        }
        unitStats[unit].trips += 1;
        unitStats[unit].totalKm += (Number(b.km) || 0);
        unitStats[unit].totalRevenue += (Number(b.finalPrice) || 0);
      });

      const unitMetrics = Object.entries(unitStats).map(([unitType, stats]) => {
        const avgPricePerKm = stats.totalKm > 0 ? stats.totalRevenue / stats.totalKm : 0;
        let formattedUnitType = unitType;
        if (unitType === '19') formattedUnitType = 'Sprinter 19';
        else if (unitType === '24') formattedUnitType = '24 Asientos';
        else if (unitType === '44') formattedUnitType = '24-44 Asientos';
        else if (unitType === '46') formattedUnitType = '46 Asientos';
        else if (unitType === '60') formattedUnitType = '60 Asientos';

        return {
          unitType: formattedUnitType,
          trips: stats.trips,
          avgPricePerKm
        };
      }).sort((a, b) => b.trips - a.trips);

      const recentBudgets = [...budgets]
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, 5);

      if (budgets.length === 0) {
        setData({
          completedTrips: 0,
          monthlyCompletedTripsRate: 0,
          estimatedRevenue: 0,
          monthlyRevenueRate: 0,
          totalPassengers: 0,
          profitMargin: 0,
          totalVehicleCost: 0,
          totalDriverCost: 0,
          unitMetrics: [],
          tripTypes: { short: 0, medium: 0, long: 0 },
          heatmapData: [],
          recentBudgets: [],
          revenueVsCostData: []
        });
      } else {
        setData({
          completedTrips,
          monthlyCompletedTripsRate,
          estimatedRevenue,
          monthlyRevenueRate,
          totalPassengers,
          profitMargin,
          totalVehicleCost,
          totalDriverCost,
          unitMetrics,
          tripTypes,
          heatmapData,
          recentBudgets,
          revenueVsCostData
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);
  };

  const formatCompactCurrency = (val: number) => {
    if (val >= 1000000) {
      return '$' + (val / 1000000).toFixed(1) + 'M';
    }
    if (val >= 1000) {
      return '$' + (val / 1000).toFixed(0) + 'K';
    }
    return '$' + val;
  };

  const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="-m-4 md:-m-8 p-4 md:p-8 bg-[#0f1117] min-h-[calc(100vh-64px)] md:min-h-screen text-white space-y-6 font-sans">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Ejecutivo</h1>
          <p className="text-slate-400 mt-1">Resumen operativo de tu empresa</p>
        </div>
        <Link 
          to="/cotizador"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-xl transition-colors"
        >
          <FileText className="w-5 h-5" />
          Nueva Cotización
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard 
          title="Viajes realizados" 
          value={(data?.completedTrips || 0).toLocaleString()} 
          icon={CheckCircle} 
          color="text-emerald-400" 
          bg="bg-emerald-500/20" 
          trend={data?.monthlyCompletedTripsRate}
        />
        <KpiCard 
          title="Facturación estimada" 
          value={formatCompactCurrency(data?.estimatedRevenue || 0)} 
          icon={DollarSign} 
          color="text-purple-400" 
          bg="bg-purple-500/20" 
          trend={data?.monthlyRevenueRate}
        />
        <KpiCard 
          title="Margen de ganancias" 
          value={`${(data?.profitMargin || 0).toFixed(1)}%`} 
          icon={TrendingUp} 
          color="text-blue-400" 
          bg="bg-blue-500/20" 
        />
        <KpiCard 
          title="Costos vehículo" 
          value={formatCompactCurrency(data?.totalVehicleCost || 0)} 
          icon={Car} 
          color="text-rose-400" 
          bg="bg-rose-500/20" 
        />
        <KpiCard 
          title="Costos conductores" 
          value={formatCompactCurrency(data?.totalDriverCost || 0)} 
          icon={Users} 
          color="text-amber-400" 
          bg="bg-amber-500/20" 
        />
        <KpiCard 
          title="Pasajeros transportados" 
          value={(data?.totalPassengers || 0).toLocaleString()} 
          icon={Users} 
          color="text-orange-400" 
          bg="bg-orange-500/20" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue vs Costs Chart */}
        <div className="bg-[#161920] p-6 rounded-2xl border border-[#222631] lg:col-span-3">
          <h2 className="text-lg font-semibold text-white mb-6">Ingresos vs Costos (Últimos 6 meses)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.revenueVsCostData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222631" />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{fill: '#94a3b8'}} />
                <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} tickFormatter={(value) => formatCompactCurrency(value)} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161920', borderColor: '#222631', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: any) => [formatCurrency(value), '']}
                  cursor={{ fill: '#222631' }}
                />
                <Legend wrapperStyle={{ color: '#94a3b8' }} />
                <Bar dataKey="revenue" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                <Line type="monotone" dataKey="costs" name="Costos" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Unit Types KPI Card */}
        <div className="bg-[#161920] p-6 rounded-2xl border border-[#222631] lg:col-span-2 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-white">KPI $/km por Unidad</h2>
          </div>
          
          <div className="space-y-6 flex-1">
            {data.unitMetrics.map((metric, index) => {
              const maxAvgPricePerKm = Math.max(...data.unitMetrics.map(m => m.avgPricePerKm), 1);
              const percentage = (metric.avgPricePerKm / maxAvgPricePerKm) * 100;
              return (
                <div key={index} className="flex flex-col gap-2">
                  <div className="flex justify-between items-end">
                    <span className="text-slate-200 font-medium">{metric.unitType}</span>
                    <span className="text-sm text-slate-400">{metric.trips} {metric.trips === 1 ? 'viaje' : 'viajes'}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-2.5 bg-[#222631] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-orange-500 font-semibold whitespace-nowrap">
                      {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(metric.avgPricePerKm)}/km
                    </span>
                  </div>
                </div>
              );
            })}
            {data.unitMetrics.length === 0 && (
              <div className="text-slate-400 text-center py-8">
                No hay datos suficientes
              </div>
            )}
          </div>
        </div>

        {/* Trip Types Chart */}
        <div className="bg-[#161920] p-6 rounded-2xl border border-[#222631]">
          <h2 className="text-lg font-semibold text-white mb-6">Distancia de viajes</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tripTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {tripTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161920', borderColor: '#222631', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: any) => [`${value} km`, 'Distancia Total']}
                />
                <Legend wrapperStyle={{ color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heatmap / Top Locations */}
        <div className="bg-[#161920] p-6 rounded-2xl border border-[#222631] lg:col-span-3">
          <h2 className="text-lg font-semibold text-white mb-6">Destinos Frecuentes</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.heatmapData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#222631" />
                <XAxis type="number" stroke="#94a3b8" tick={{fill: '#94a3b8'}} />
                <YAxis dataKey="location" type="category" width={120} stroke="#94a3b8" tick={{fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161920', borderColor: '#222631', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: any) => [value, 'Viajes']}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Budgets */}
      <div className="bg-[#161920] p-6 rounded-2xl border border-[#222631]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-white">Cotizaciones recientes</h2>
          <Link to="/cotizaciones" className="text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1">
            Ver todas <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {data.recentBudgets.map((budget, index) => (
            <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-[#222631] hover:border-slate-700 transition-all bg-[#1a1d24] gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-800/50 rounded-lg text-slate-400 hidden sm:block">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-white text-lg">{budget.client}</div>
                  <div className="text-sm text-slate-400 mt-0.5">
                    {budget.origen || 'Origen'} → {budget.destination}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                <div className={`flex items-center gap-1.5 text-sm font-medium ${
                  budget.status === 'realizado' || budget.status === 'confirmado' ? 'text-emerald-400' :
                  budget.status === 'cancelado' ? 'text-red-400' : 'text-amber-400'
                }`}>
                  {budget.status === 'realizado' || budget.status === 'confirmado' ? <CheckCircle className="w-4 h-4" /> :
                   budget.status === 'cancelado' ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  <span className="capitalize">{budget.status}</span>
                </div>
                <div className="font-bold text-white text-lg sm:w-28 text-right">{formatCurrency(budget.finalPrice)}</div>
              </div>
            </div>
          ))}
          {data.recentBudgets.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No hay cotizaciones recientes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, subtitle, icon: Icon, color, bg, trend }: { title: string, value: string, subtitle?: string, icon: any, color: string, bg: string, trend?: number }) {
  return (
    <div className="bg-[#161920] p-6 rounded-2xl border border-[#222631] flex flex-col relative">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${bg} ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center text-sm font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {trend > 0 ? '+' : ''}{Math.abs(trend).toFixed(0)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-white mb-1">{value}</p>
        <p className="text-sm font-medium text-slate-400">{title}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
