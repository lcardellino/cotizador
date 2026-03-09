import { useState, useEffect, useRef } from "react";
import { Trash2, FileText, Search, ChevronDown, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import * as htmlToImage from "html-to-image";
import { format } from "date-fns";
import { SavedBudget, BudgetStatus, TripType } from "../types";
import PdfExportTemplate from "../components/PdfExportTemplate";

export default function Historial() {
  const [budgets, setBudgets] = useState<SavedBudget[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [exportingId, setExportingId] = useState<string | null>(null);
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

  const handleTripTypeChange = (id: string, newType: TripType) => {
    const updatedBudgets = budgets.map(b => b.id === id ? { ...b, tripType: newType } : b);
    setBudgets(updatedBudgets);
    localStorage.setItem("savedBudgets", JSON.stringify(updatedBudgets));
  };

  const handleDelete = (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta cotización?")) {
      const updatedBudgets = budgets.filter((b) => b.id !== id);
      setBudgets(updatedBudgets);
      localStorage.setItem("savedBudgets", JSON.stringify(updatedBudgets));
    }
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

      const scale = 2;
      const node = pdfRef.current;
      const width = 800;
      const height = node.clientHeight || 1131;
      
      // Ensure all images are loaded
      const images = node.getElementsByTagName('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      const imgData = await htmlToImage.toPng(node, {
        pixelRatio: scale,
        backgroundColor: '#ffffff',
        cacheBust: true,
        width: width,
        height: height,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: `${width}px`,
          height: `${height}px`,
        }
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (height * pdfWidth) / width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Hubo un error al generar el PDF.');
    } finally {
      setExportingId(null);
      setSelectedBudgetForPdf(null);
    }
  };

  const filteredBudgets = budgets.filter((b) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      b.client.toLowerCase().includes(searchLower) ||
      b.budgetNumber.toLowerCase().includes(searchLower) ||
      b.destination.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6 relative">
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historial de Cotizaciones</h1>
          <p className="text-slate-500 mt-1">
            Consulta y administra las cotizaciones guardadas.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar cliente, destino..."
            className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Nro Presupuesto</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Horario</th>
                <th className="px-4 py-3 font-medium">Destino</th>
                <th className="px-4 py-3 font-medium text-right">Cant KM</th>
                <th className="px-4 py-3 font-medium text-right">Costo</th>
                <th className="px-4 py-3 font-medium text-right">Ganancia</th>
                <th className="px-4 py-3 font-medium text-right">Precio Final</th>
                <th className="px-4 py-3 font-medium">Contacto</th>
                <th className="px-4 py-3 font-medium">Teléfono</th>
                <th className="px-4 py-3 font-medium">Tipo Viaje</th>
                <th className="px-4 py-3 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBudgets.length > 0 ? (
                filteredBudgets.map((budget) => (
                  <tr key={budget.id} className={`hover:bg-slate-50/50 transition-colors ${budget.status === 'cancelado' ? 'opacity-50 grayscale' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <select
                          value={budget.status || 'pendiente'}
                          onChange={(e) => handleStatusChange(budget.id, e.target.value as BudgetStatus)}
                          className={`appearance-none pl-3 pr-8 py-1.5 text-xs font-medium rounded-full border focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer
                            ${budget.status === 'pendiente' || !budget.status ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                            ${budget.status === 'confirmado' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                            ${budget.status === 'realizado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                            ${budget.status === 'cancelado' ? 'bg-slate-100 text-slate-600 border-slate-300' : ''}
                          `}
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="confirmado">Confirmado</option>
                          <option value="realizado">Realizado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                        <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">
                      {budget.budgetNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{budget.date}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {budget.client}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{budget.time}</td>
                    <td className="px-4 py-3 text-slate-600">{budget.destination}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      {budget.km}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      {formatCurrency(budget.cost)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-600">
                      {formatCurrency(budget.profit)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(budget.finalPrice)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{budget.contact}</td>
                    <td className="px-4 py-3 text-slate-600">{budget.phone}</td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <select
                          value={budget.tripType || 'provincial'}
                          onChange={(e) => handleTripTypeChange(budget.id, e.target.value as TripType)}
                          className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium bg-slate-50 text-slate-700 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                        >
                          <option value="provincial">Provincial</option>
                          <option value="nacional">Nacional</option>
                          <option value="internacional">Internacional</option>
                        </select>
                        <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleExportPdf(budget)}
                          disabled={exportingId === budget.id}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
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
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={14} className="px-4 py-8 text-center text-slate-500">
                    {searchTerm
                      ? "No se encontraron cotizaciones que coincidan con la búsqueda."
                      : "No hay cotizaciones guardadas en el historial."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
