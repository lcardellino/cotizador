import { useState, useEffect } from "react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  parseISO, 
  isAfter, 
  isBefore, 
  startOfDay
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, Clock, Calendar as CalendarIcon, MapPin, Users, Bus, DollarSign, X, FileText, Edit2, Save } from "lucide-react";
import { SavedBudget, BudgetStatus, PaymentStatus } from "../types";
import { api } from "../lib/api";

export default function Agenda() {
  const currentUser = localStorage.getItem("currentUser") || "lucas";
  const [currentDate, setCurrentDate] = useState(new Date());
  const [budgets, setBudgets] = useState<SavedBudget[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<SavedBudget | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState<BudgetStatus>('pendiente');
  const [editPaymentStatus, setEditPaymentStatus] = useState<PaymentStatus>('falta_pagar');

  useEffect(() => {
    const loadBudgets = async () => {
      const parsed = await api.getBudgets(currentUser);
      const activeBudgets = parsed.filter((b: SavedBudget) => b.status !== 'cancelado');
      setBudgets(activeBudgets);
    };
    loadBudgets();
  }, [currentUser]);

  const handleOpenBudget = (budget: SavedBudget) => {
    setSelectedBudget(budget);
    setIsEditing(false);
    setEditStatus(budget.status);
    setEditPaymentStatus(budget.paymentStatus || 'falta_pagar');
  };

  const handleCloseBudget = () => {
    setSelectedBudget(null);
    setIsEditing(false);
  };

  const handleSaveBudgetStatus = async () => {
    if (!selectedBudget) return;
    
    const parsed = await api.getBudgets(currentUser);
    const updatedBudgets = parsed.map((b: SavedBudget) => 
      b.id === selectedBudget.id ? { ...b, status: editStatus, paymentStatus: editPaymentStatus } : b
    );
    await api.syncBudgets(currentUser, updatedBudgets);
    
    // Update local state
    const activeBudgets = updatedBudgets.filter((b: SavedBudget) => b.status !== 'cancelado');
    setBudgets(activeBudgets);
    
    // Update selected budget
    setSelectedBudget({ ...selectedBudget, status: editStatus, paymentStatus: editPaymentStatus });
    setIsEditing(false);
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const today = startOfDay(new Date());
  const threeDaysFromNow = addDays(today, 3);

  // Helper to parse budget date safely
  const getBudgetDate = (dateStr: string) => {
    if (!dateStr) return null;
    try {
      // Assuming dateStr is YYYY-MM-DD
      // Append T00:00:00 to force local timezone parsing instead of UTC
      const dateStringWithTime = dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`;
      const parsed = new Date(dateStringWithTime);
      if (isNaN(parsed.getTime())) return null;
      return startOfDay(parsed);
    } catch {
      return null;
    }
  };

  // Upcoming alerts (next 3 days)
  const upcomingAlerts = budgets.filter(b => {
    const bDate = getBudgetDate(b.date);
    if (!bDate) return false;
    return (isSameDay(bDate, today) || isAfter(bDate, today)) && 
           (isSameDay(bDate, threeDaysFromNow) || isBefore(bDate, threeDaysFromNow));
  }).sort((a, b) => {
    const dateA = getBudgetDate(a.date)?.getTime() || 0;
    const dateB = getBudgetDate(b.date)?.getTime() || 0;
    return dateA - dateB;
  });

  // Upcoming list (from today onwards)
  const upcomingList = budgets.filter(b => {
    const bDate = getBudgetDate(b.date);
    if (!bDate) return false;
    return isSameDay(bDate, today) || isAfter(bDate, today);
  }).sort((a, b) => {
    const dateA = getBudgetDate(a.date)?.getTime() || 0;
    const dateB = getBudgetDate(b.date)?.getTime() || 0;
    return dateA - dateB;
  });

  const getEventColor = (budget: SavedBudget) => {
    if (budget.status === 'pendiente' || !budget.status) {
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30'; // Amarillo -> pendiente de confirmación
    }
    if (budget.paymentStatus === 'pago') {
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'; // Verde -> viaje pagado
    }
    return 'bg-red-500/20 text-red-400 border-red-500/30'; // Rojo -> viaje no pagado
  };

  const getUnitName = (unitType?: string) => {
    if (!unitType) return 'Bus';
    if (unitType === '19') return 'Minibús 19';
    if (unitType === '24') return 'Minibús 24';
    if (unitType === '44') return 'Bus 44';
    if (unitType === '46') return 'Bus 46';
    if (unitType === '60') return 'Bus 60';
    return unitType;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(val);
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white capitalize">
          {format(currentDate, "MMMM yyyy", { locale: es })}
        </h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 bg-[#1a1d24] border border-[#222631] rounded-lg hover:bg-[#222631] transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 bg-[#1a1d24] border border-[#222631] rounded-lg text-sm font-medium text-slate-300 hover:bg-[#222631] transition-colors">
            Hoy
          </button>
          <button onClick={nextMonth} className="p-2 bg-[#1a1d24] border border-[#222631] rounded-lg hover:bg-[#222631] transition-colors">
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const dateFormat = "EEEE";
    const days = [];
    let startDate = startOfWeek(currentDate, { weekStartsOn: 1 });

    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="text-center py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider" key={i}>
          {format(addDays(startDate, i), dateFormat, { locale: es })}
        </div>
      );
    }
    return <div className="grid grid-cols-7 border-b border-[#222631]">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        // Find budgets for this day
        const dayBudgets = budgets.filter(b => {
          const bDate = getBudgetDate(b.date);
          return bDate && isSameDay(bDate, cloneDay);
        });

        days.push(
          <div
            className={`min-h-[120px] p-2 border-r border-b border-[#222631] transition-colors ${
              !isSameMonth(day, monthStart)
                ? "bg-[#0f1117]/50 text-slate-600"
                : isSameDay(day, today)
                ? "bg-blue-900/10 text-blue-400"
                : "bg-[#161920] text-slate-300 hover:bg-[#1a1d24]"
            }`}
            key={day.toString()}
          >
            <div className="flex justify-between items-start mb-1">
              <span className={`text-sm font-medium ${isSameDay(day, today) ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : ''}`}>
                {formattedDate}
              </span>
            </div>
            <div className="flex flex-col gap-1 mt-2">
              {dayBudgets.map(budget => (
                <div 
                  key={budget.id}
                  onClick={() => handleOpenBudget(budget)}
                  className={`text-xs p-1.5 rounded border cursor-pointer truncate transition-all hover:opacity-80 flex flex-col gap-0.5 ${getEventColor(budget)}`}
                  title={`${budget.client} - ${budget.destination}`}
                >
                  <div className="font-semibold truncate">{budget.client}</div>
                  <div className="text-[10px] opacity-80 truncate">{budget.destination}</div>
                  <div className="text-[10px] font-medium opacity-90 truncate">{getUnitName(budget.unitType)}</div>
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="border-l border-t border-[#222631] rounded-xl overflow-hidden">{rows}</div>;
  };

  return (
    <div className="bg-[#0f1117] min-h-full text-white space-y-6 font-sans">
      <div className="flex items-center gap-3">
        <CalendarIcon className="w-8 h-8 text-blue-500" />
        <div>
          <h1 className="text-2xl font-bold">Agenda de Servicios</h1>
          <p className="text-slate-400 text-sm">Gestión operativa y calendario de viajes</p>
        </div>
      </div>

      {/* Alertas: Próximos servicios (3 días) */}
      {upcomingAlerts.length > 0 && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-blue-400">Próximos servicios (3 días)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingAlerts.map(alert => (
              <div 
                key={alert.id} 
                onClick={() => handleOpenBudget(alert)}
                className="bg-[#161920] border border-[#222631] p-4 rounded-xl cursor-pointer hover:border-blue-500/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-white truncate">{alert.client}</div>
                  <div className="text-xs font-medium text-slate-400 bg-[#1a1d24] px-2 py-1 rounded-md">
                    {format(getBudgetDate(alert.date) || new Date(), "dd/MM/yyyy")}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-400 mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">{alert.destination}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>{alert.passengers}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Bus className="w-3.5 h-3.5" />
                    <span>{getUnitName(alert.unitType)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#222631]">
                  <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md ${
                    alert.paymentStatus === 'pago' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {alert.paymentStatus === 'pago' ? '💰 PAGADO' : '⚠ NO PAGADO'}
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md ${
                    alert.status === 'realizado' ? 'bg-emerald-500/10 text-emerald-400' : 
                    alert.status === 'confirmado' ? 'bg-blue-500/10 text-blue-400' : 
                    'bg-slate-500/10 text-slate-400'
                  }`}>
                    {alert.status === 'realizado' ? 'Realizado' : 
                     alert.status === 'confirmado' ? '🚌 Confirmado' : 
                     'Cotización'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendario */}
      <div className="bg-[#161920] p-6 rounded-2xl border border-[#222631]">
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </div>

      {/* Lista Operativa */}
      <div className="bg-[#161920] rounded-2xl border border-[#222631] overflow-hidden">
        <div className="p-6 border-b border-[#222631]">
          <h2 className="text-lg font-semibold text-white">Lista Operativa de Próximos Viajes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 border-b border-[#222631] bg-[#1a1d24]">
              <tr>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Fecha</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Cliente</th>
                <th className="px-6 py-4 font-medium min-w-[200px]">Destino</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Unidad</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Pasajeros</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Estado Pago</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Estado Servicio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222631]">
              {upcomingList.length > 0 ? (
                upcomingList.map((budget) => (
                  <tr 
                    key={budget.id} 
                    onClick={() => handleOpenBudget(budget)}
                    className="hover:bg-[#1a1d24] transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                      {format(getBudgetDate(budget.date) || new Date(), "dd/MM/yyyy")}
                    </td>
                    <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                      {budget.client}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {budget.destination}
                    </td>
                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                      {getUnitName(budget.unitType)}
                    </td>
                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                      {budget.passengers}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        budget.paymentStatus === 'pago' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {budget.paymentStatus === 'pago' ? '💰 PAGADO' : '⚠ NO PAGADO'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        budget.status === 'realizado' ? 'bg-emerald-500/10 text-emerald-400' : 
                        budget.status === 'confirmado' ? 'bg-blue-500/10 text-blue-400' : 
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {budget.status === 'realizado' ? 'Realizado' : 
                         budget.status === 'confirmado' ? '🚌 Confirmado' : 
                         'Cotización'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No hay viajes próximos programados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle del Viaje */}
      {selectedBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#161920] border border-[#222631] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-[#222631]">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Detalle del Viaje
              </h3>
              <button 
                onClick={handleCloseBudget}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-[#222631]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Header Info */}
              <div className="flex flex-wrap gap-4 justify-between items-start">
                <div>
                  <div className="text-sm text-slate-400 mb-1">Cliente</div>
                  <div className="text-2xl font-bold text-white">{selectedBudget.client}</div>
                  <div className="text-sm text-slate-400 mt-1">Cotización N° {selectedBudget.budgetNumber}</div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {isEditing ? (
                    <>
                      <select
                        value={editPaymentStatus}
                        onChange={(e) => setEditPaymentStatus(e.target.value as PaymentStatus)}
                        className="px-3 py-1.5 bg-[#0f1117] border border-[#222631] rounded-lg text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="pago">💰 PAGADO</option>
                        <option value="falta_pagar">⚠ NO PAGADO</option>
                      </select>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as BudgetStatus)}
                        className="px-3 py-1.5 bg-[#0f1117] border border-[#222631] rounded-lg text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="pendiente">Cotización</option>
                        <option value="confirmado">🚌 Confirmado</option>
                        <option value="realizado">Realizado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </>
                  ) : (
                    <>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold ${
                        selectedBudget.paymentStatus === 'pago' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {selectedBudget.paymentStatus === 'pago' ? '💰 PAGADO' : '⚠ NO PAGADO'}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold ${
                        selectedBudget.status === 'realizado' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                        selectedBudget.status === 'confirmado' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                        'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {selectedBudget.status === 'realizado' ? 'Realizado' : 
                         selectedBudget.status === 'confirmado' ? '🚌 Confirmado' : 
                         'Cotización'}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Grid Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#0f1117] p-4 rounded-xl border border-[#222631]">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Ruta</span>
                  </div>
                  <div className="text-white font-medium">{selectedBudget.origen || 'Origen'}</div>
                  <div className="text-slate-500 text-xs my-1">↓</div>
                  <div className="text-white font-medium">{selectedBudget.destination}</div>
                  {selectedBudget.regresoA && (
                    <>
                      <div className="text-slate-500 text-xs my-1">↓</div>
                      <div className="text-white font-medium">{selectedBudget.regresoA}</div>
                    </>
                  )}
                </div>

                <div className="bg-[#0f1117] p-4 rounded-xl border border-[#222631]">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Fechas y Horarios</span>
                  </div>
                  <div className="text-white font-medium">
                    Salida: {format(getBudgetDate(selectedBudget.date) || new Date(), "dd/MM/yyyy")} {selectedBudget.time && `a las ${selectedBudget.time}`}
                  </div>
                  {selectedBudget.fechaRegreso && (
                    <div className="text-white font-medium mt-2">
                      Regreso: {format(getBudgetDate(selectedBudget.fechaRegreso) || new Date(), "dd/MM/yyyy")} {selectedBudget.horaRegreso && `a las ${selectedBudget.horaRegreso}`}
                    </div>
                  )}
                </div>

                <div className="bg-[#0f1117] p-4 rounded-xl border border-[#222631]">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Bus className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Unidad y Pasajeros</span>
                  </div>
                  <div className="text-white font-medium">{getUnitName(selectedBudget.unitType)}</div>
                  <div className="text-slate-400 text-sm mt-1">{selectedBudget.passengers} pasajeros</div>
                  {selectedBudget.busCount && selectedBudget.busCount > 1 && (
                    <div className="text-slate-400 text-sm mt-1">{selectedBudget.busCount} unidades asignadas</div>
                  )}
                </div>

                <div className="bg-[#0f1117] p-4 rounded-xl border border-[#222631]">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Precio Cotizado</span>
                  </div>
                  <div className="text-2xl font-mono font-bold text-white">{formatCurrency(selectedBudget.finalPrice)}</div>
                  <div className="text-slate-400 text-sm mt-1">{selectedBudget.km} km totales</div>
                </div>
              </div>

              {/* Notas */}
              {selectedBudget.descripcion && (
                <div className="bg-[#0f1117] p-4 rounded-xl border border-[#222631]">
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Notas del viaje</div>
                  <p className="text-white text-sm whitespace-pre-wrap">{selectedBudget.descripcion}</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-[#222631] bg-[#1a1d24] flex justify-between items-center">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-[#222631] hover:bg-slate-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar Estado
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveBudgetStatus}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Guardar
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditStatus(selectedBudget.status);
                      setEditPaymentStatus(selectedBudget.paymentStatus || 'falta_pagar');
                    }}
                    className="px-4 py-2 bg-[#222631] hover:bg-slate-700 text-white font-medium rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              )}
              
              <button 
                onClick={handleCloseBudget}
                className="px-6 py-2 bg-[#222631] hover:bg-slate-700 text-white font-medium rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
