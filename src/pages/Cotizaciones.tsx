import { useState, useEffect, useRef } from "react";
import { Trash2, FileText, Search, ChevronDown, Loader2, Plus, Eye, CheckCircle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { format } from "date-fns";
import { SavedBudget, BudgetStatus, TripType, PaymentStatus } from "../types";
import PdfExportTemplate from "../components/PdfExportTemplate";

export default function Cotizaciones() {
  const [budgets, setBudgets] = useState<SavedBudget[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todas");
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{title: string, type: 'success' | 'error'} | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const [selectedBudgetForPdf, setSelectedBudgetForPdf] = useState<SavedBudget | null>(null);

  useEffect(() => {
    const loadBudgets = () => {
      const savedBudgetsStr = localStorage.getItem("savedBudgets");
      if (savedBudgetsStr) {
        try {
          const parsed = JSON.parse(savedBudgetsStr);
          setBudgets(parsed);
        } catch (e) {
          console.error("Error parsing saved budgets", e);
        }
      }
    };
    loadBudgets();
  }, []);

  const handleStatusChange = (id: string, newStatus: BudgetStatus) => {
    const updatedBudgets = budgets.map(b => b.id === id ? { ...b, status: newStatus } : b);
    setBudgets(updatedBudgets);
    localStorage.setItem("savedBudgets", JSON.stringify(updatedBudgets));
  };

  const handlePaymentStatusChange = (id: string, newStatus: PaymentStatus) => {
    const updatedBudgets = budgets.map(b => b.id === id ? { ...b, paymentStatus: newStatus } : b);
    setBudgets(updatedBudgets);
    localStorage.setItem("savedBudgets", JSON.stringify(updatedBudgets));
  };

  const handleTripTypeChange = (id: string, newType: TripType) => {
    const updatedBudgets = budgets.map(b => b.id === id ? { ...b, tripType: newType } : b);
    setBudgets(updatedBudgets);
    localStorage.setItem("savedBudgets", JSON.stringify(updatedBudgets));
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      const updatedBudgets = budgets.filter((b) => b.id !== deleteConfirmId);
      setBudgets(updatedBudgets);
      localStorage.setItem("savedBudgets", JSON.stringify(updatedBudgets));
      setDeleteConfirmId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(val);
  };

  const handleExportPdf = async (budget: SavedBudget) => {
    if (exportingId) return;
    
    try {
      setExportingId(budget.id);
      setSelectedBudgetForPdf(budget);
      
      // Wait for state to update and component to render
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!pdfRef.current) {
        throw new Error("PDF reference not found");
      }
      
      // Generate filename: Fecha_Cliente_FB-XXXX
      const dateStr = format(new Date(), 'dd-MM-yyyy');
      const clientName = budget.client ? budget.client.replace(/[^a-z0-9]/gi, '_') : 'SinCliente';
      const fileName = `${dateStr}_${clientName}_${budget.budgetNumber}.pdf`;

      const node = pdfRef.current;
      
      // Ensure all images are loaded
      const images = node.getElementsByTagName('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      const opt = {
        margin:       0,
        filename:     fileName,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true, windowWidth: 794 },
        jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(node).save();
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      setToastMessage({ title: 'Hubo un error al generar el PDF.', type: 'error' });
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setExportingId(null);
      setSelectedBudgetForPdf(null);
    }
  };

  const filteredBudgets = budgets.filter((b) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      b.client.toLowerCase().includes(searchLower) ||
      b.budgetNumber.toLowerCase().includes(searchLower) ||
      b.destination.toLowerCase().includes(searchLower) ||
      (b.origen && b.origen.toLowerCase().includes(searchLower));

    if (!matchesSearch) return false;

    if (filterStatus === 'todas') return true;
    if (filterStatus === 'pendiente' && b.status === 'pendiente') return true;
    if (filterStatus === 'aceptada' && b.status === 'confirmado') return true;
    if (filterStatus === 'realizado' && b.status === 'realizado') return true;
    if (filterStatus === 'cancelado' && b.status === 'cancelado') return true;

    return false;
  });

  const getUnitName = (unitType?: string) => {
    if (!unitType) return 'Bus';
    if (unitType === '19') return 'Minibús';
    if (unitType === '24' || unitType === '44' || unitType === '46' || unitType === '60') return 'Bus';
    return unitType;
  };

  return (
    <div className="bg-[#0f1117] min-h-full text-white space-y-6 font-sans">
      {/* Hidden PDF Template for Export - Always rendered to ensure images load */}
      <PdfExportTemplate 
        ref={pdfRef}
        correlativeNumber={selectedBudgetForPdf?.budgetNumber || ''}
        cliente={selectedBudgetForPdf?.client || ''}
        contacto={selectedBudgetForPdf?.contact || ''}
        telefono={selectedBudgetForPdf?.phone || ''}
        mail={selectedBudgetForPdf?.mail || ''}
        origen={selectedBudgetForPdf?.origen || ''}
        destino={selectedBudgetForPdf?.destination || ''}
        regresoA={selectedBudgetForPdf?.regresoA || ''}
        fechaSalida={selectedBudgetForPdf?.date || ''}
        horaSalida={selectedBudgetForPdf?.time || ''}
        fechaRegreso={selectedBudgetForPdf?.fechaRegreso || ''}
        horaRegreso={selectedBudgetForPdf?.horaRegreso || ''}
        descripcion={selectedBudgetForPdf?.descripcion || ''}
        passengers={selectedBudgetForPdf?.passengers || 0}
        subtotal={selectedBudgetForPdf?.subtotal || selectedBudgetForPdf?.cost || 0}
        ivaAmount={selectedBudgetForPdf?.ivaAmount || (selectedBudgetForPdf ? selectedBudgetForPdf.finalPrice - selectedBudgetForPdf.cost - selectedBudgetForPdf.profit : 0)}
        finalTotal={selectedBudgetForPdf?.finalPrice || 0}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Cotizaciones</h1>
          <p className="text-slate-400 mt-1">
            {budgets.length} cotizaciones en total
          </p>
        </div>
        <Link 
          to="/cotizador"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-xl transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Cotización
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#161920] p-4 rounded-2xl border border-[#222631]">
        <div className="relative w-full lg:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por cliente, origen, destino..."
            className="w-full pl-10 pr-3 py-2 bg-[#0f1117] border border-[#222631] rounded-xl focus:outline-none focus:border-blue-500 text-sm text-white placeholder-slate-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {['Todas', 'Pendiente', 'Aceptada', 'Cancelado', 'Realizado'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status.toLowerCase())}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filterStatus === status.toLowerCase() 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-[#0f1117] text-slate-400 border border-[#222631] hover:text-white hover:border-slate-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#161920] rounded-2xl border border-[#222631] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 border-b border-[#222631] bg-[#1a1d24]">
              <tr>
                <th className="px-6 py-4 font-medium whitespace-nowrap">N° Cotización</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Cliente</th>
                <th className="px-6 py-4 font-medium min-w-[250px]">Ruta</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Unidad</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">KM</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Precio final</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">$/km</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Estado</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Pago</th>
                <th className="px-6 py-4 font-medium text-right whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222631]">
              {filteredBudgets.length > 0 ? (
                filteredBudgets.map((budget) => {
                  const km = Number(budget.km) || 0;
                  const pricePerKm = km > 0 ? budget.finalPrice / km : 0;
                  
                  return (
                    <tr key={budget.id} className="hover:bg-[#1a1d24] transition-colors group">
                      <td className={`px-6 py-4 font-mono font-medium whitespace-nowrap
                        ${budget.status === 'pendiente' || !budget.status ? 'text-amber-400' : ''}
                        ${budget.status === 'confirmado' ? 'text-emerald-400' : ''}
                        ${budget.status === 'realizado' ? 'text-blue-400' : ''}
                        ${budget.status === 'cancelado' ? 'text-red-400' : ''}
                      `}>
                        {budget.budgetNumber}
                      </td>
                      <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                        {budget.client}
                      </td>
                      <td className="px-6 py-4 text-slate-400 min-w-[250px]">
                        {budget.origen || 'Origen'} <span className="text-slate-600 mx-1">→</span> {budget.destination}
                      </td>
                      <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                        {getUnitName(budget.unitType)}
                      </td>
                      <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                        {km.toLocaleString('es-AR')} km
                      </td>
                      <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                        {formatCurrency(budget.finalPrice)}
                      </td>
                      <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                        ${pricePerKm.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative inline-block">
                          <select
                            value={budget.status || 'pendiente'}
                            onChange={(e) => handleStatusChange(budget.id, e.target.value as BudgetStatus)}
                            className={`appearance-none pl-3 pr-8 py-1.5 text-xs font-bold rounded-full border focus:outline-none cursor-pointer transition-colors shadow-sm
                              ${budget.status === 'pendiente' || !budget.status ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20' : ''}
                              ${budget.status === 'confirmado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' : ''}
                              ${budget.status === 'realizado' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20' : ''}
                              ${budget.status === 'cancelado' ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20' : ''}
                            `}
                          >
                            <option value="pendiente" className="bg-[#161920] text-amber-400">Pendiente</option>
                            <option value="confirmado" className="bg-[#161920] text-emerald-400">Aceptada</option>
                            <option value="realizado" className="bg-[#161920] text-blue-400">Realizado</option>
                            <option value="cancelado" className="bg-[#161920] text-red-400">Cancelado</option>
                          </select>
                          <ChevronDown className={`w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-70
                            ${budget.status === 'pendiente' || !budget.status ? 'text-amber-400' : ''}
                            ${budget.status === 'confirmado' ? 'text-emerald-400' : ''}
                            ${budget.status === 'realizado' ? 'text-blue-400' : ''}
                            ${budget.status === 'cancelado' ? 'text-red-400' : ''}
                          `} />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative inline-block">
                          <select
                            value={budget.paymentStatus || 'falta_pagar'}
                            onChange={(e) => handlePaymentStatusChange(budget.id, e.target.value as PaymentStatus)}
                            className={`appearance-none pl-3 pr-8 py-1.5 text-xs font-bold rounded-full border focus:outline-none cursor-pointer transition-colors shadow-sm
                              ${budget.paymentStatus === 'falta_pagar' || !budget.paymentStatus ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20' : ''}
                              ${budget.paymentStatus === 'pago' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' : ''}
                            `}
                          >
                            <option value="falta_pagar" className="bg-[#161920] text-amber-400">Falta Pagar</option>
                            <option value="pago" className="bg-[#161920] text-emerald-400">Pago</option>
                          </select>
                          <ChevronDown className={`w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-70
                            ${budget.paymentStatus === 'falta_pagar' || !budget.paymentStatus ? 'text-amber-400' : ''}
                            ${budget.paymentStatus === 'pago' ? 'text-emerald-400' : ''}
                          `} />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            to="/cotizador"
                            state={{ budgetToLoad: budget }}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            title="Ver Cotización"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleExportPdf(budget)}
                            disabled={exportingId === budget.id}
                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Exportar PDF"
                          >
                            {exportingId === budget.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(budget.id)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                    {searchTerm || filterStatus !== 'todas'
                      ? "No se encontraron cotizaciones que coincidan con los filtros."
                      : "No hay cotizaciones guardadas."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Toast Message */}
      {toastMessage && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-xl shadow-lg border flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 ${
          toastMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span className="font-medium">{toastMessage.title}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d24] rounded-2xl border border-[#222631] w-full max-w-md p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">Confirmar eliminación</h2>
            <p className="text-slate-300 mb-6">
              ¿Estás seguro de que deseas eliminar esta cotización? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 rounded-xl font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl font-medium bg-red-600 hover:bg-red-500 text-white transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
