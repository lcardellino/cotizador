import { useState, useMemo, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Save, FileText, Loader2, Download, X, ChevronUp, ChevronDown, Mountain, Flame, Trash2, Copy, Check, CheckCircle, XCircle } from "lucide-react";
import html2pdf from "html2pdf.js";
import { format } from "date-fns";
import PdfExportTemplate from "../components/PdfExportTemplate";
import { SavedBudget, TripType } from "../types";

type UnitType = "19" | "24" | "44" | "46" | "60";
type DriverServiceType = "provincial" | "nacional";
type CostItem = { value: number; count: number };

const UNIT_SPECS: Record<UnitType, { consumption: number; depreciation: number }> = {
  "19": { consumption: 8, depreciation: 200 },
  "24": { consumption: 3.5, depreciation: 400 },
  "44": { consumption: 3.5, depreciation: 400 },
  "46": { consumption: 3.5, depreciation: 400 },
  "60": { consumption: 3.5, depreciation: 800 },
};

const getSavedCost = (key: string, defaultValue: CostItem): CostItem => {
  try {
    const saved = localStorage.getItem(`cost_${key}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...parsed, count: 0 };
    }
  } catch (e) {
    console.error("Error reading from localStorage", e);
  }
  return defaultValue;
};

const getSavedNumber = (key: string, defaultValue: number): number => {
  try {
    const saved = localStorage.getItem(`num_${key}`);
    if (saved) {
      return parseFloat(saved);
    }
  } catch (e) {
    console.error("Error reading from localStorage", e);
  }
  return defaultValue;
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
};

export default function Cotizador() {
  const currentUser = localStorage.getItem("currentUser") || "lucas";
  // Datos del Cliente y Viaje
  const [cliente, setCliente] = useState("");
  const [contacto, setContacto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [mail, setMail] = useState("");
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [regresoA, setRegresoA] = useState("");
  const [fechaSalida, setFechaSalida] = useState("");
  const [horaSalida, setHoraSalida] = useState("");
  const [fechaRegreso, setFechaRegreso] = useState("");
  const [horaRegreso, setHoraRegreso] = useState("");
  const [descripcion, setDescripcion] = useState("");

  // Parámetros del viaje
  const [kmProductivos, setKmProductivos] = useState<number>(0);
  const [kmDestino, setKmDestino] = useState<number>(0);
  const [kmImproductivos, setKmImproductivos] = useState<number>(0);
  const [unitType, setUnitType] = useState<UnitType>("19");
  const [passengers, setPassengers] = useState<number>(0);
  const [dieselPrice, setDieselPrice] = useState<number>(() => getSavedNumber('dieselPrice', 1000));
  const [driverCount, setDriverCount] = useState<number>(1);
  const [busCount, setBusCount] = useState<number>(1);

  // Costo conductor
  const [driverServiceType, setDriverServiceType] = useState<DriverServiceType>("provincial");
  
  // Tipo de viaje
  const [tripType, setTripType] = useState<TripType>("provincial");
  
  // Costo conductor provincial
  const [driverShift, setDriverShift] = useState<CostItem>(() => getSavedCost('driverShift', { value: 63199, count: 0 }));
  const [driverViatico, setDriverViatico] = useState<CostItem>(() => getSavedCost('driverViatico', { value: 13574, count: 0 }));
  const [driverTomeDeje, setDriverTomeDeje] = useState<CostItem>(() => getSavedCost('driverTomeDeje', { value: 4597, count: 0 }));
  const [driverExtraHour, setDriverExtraHour] = useState<CostItem>(() => getSavedCost('driverExtraHour', { value: 9196, count: 0 }));
  const [driverBed, setDriverBed] = useState<CostItem>(() => getSavedCost('driverBed', { value: 21591, count: 0 }));

  // Viáticos nacional
  const [natBreakfast, setNatBreakfast] = useState<CostItem>(() => getSavedCost('natBreakfast', { value: 3624, count: 0 }));
  const [natLunch, setNatLunch] = useState<CostItem>(() => getSavedCost('natLunch', { value: 13337, count: 0 }));
  const [natSnack, setNatSnack] = useState<CostItem>(() => getSavedCost('natSnack', { value: 3624, count: 0 }));
  const [natDinner, setNatDinner] = useState<CostItem>(() => getSavedCost('natDinner', { value: 13337, count: 0 }));
  const [natBed, setNatBed] = useState<CostItem>(() => getSavedCost('natBed', { value: 21591, count: 0 }));

  useEffect(() => {
    localStorage.setItem('cost_driverShift', JSON.stringify(driverShift));
    localStorage.setItem('cost_driverViatico', JSON.stringify(driverViatico));
    localStorage.setItem('cost_driverTomeDeje', JSON.stringify(driverTomeDeje));
    localStorage.setItem('cost_driverExtraHour', JSON.stringify(driverExtraHour));
    localStorage.setItem('cost_driverBed', JSON.stringify(driverBed));
    localStorage.setItem('cost_natBreakfast', JSON.stringify(natBreakfast));
    localStorage.setItem('cost_natLunch', JSON.stringify(natLunch));
    localStorage.setItem('cost_natSnack', JSON.stringify(natSnack));
    localStorage.setItem('cost_natDinner', JSON.stringify(natDinner));
    localStorage.setItem('cost_natBed', JSON.stringify(natBed));
  }, [driverShift, driverViatico, driverTomeDeje, driverExtraHour, driverBed, natBreakfast, natLunch, natSnack, natDinner, natBed]);

  useEffect(() => {
    localStorage.setItem('num_dieselPrice', dieselPrice.toString());
  }, [dieselPrice]);

  // Configuraciones extra
  const [dirtRoadPercent, setDirtRoadPercent] = useState<number>(0);
  const [profitMultiplier, setProfitMultiplier] = useState<number>(1.3);
  const [isExporting, setIsExporting] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBudgetNumber, setEditingBudgetNumber] = useState<string | null>(null);
  const [savedBudgets, setSavedBudgets] = useState<SavedBudget[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<{title: string, type: 'success' | 'error'} | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const handleCopy = () => {
    const formatDateStr = (dateStr: string) => {
      if (!dateStr) return '-';
      if (dateStr.includes('-') && !dateStr.includes('T')) {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
      }
      try {
        return format(new Date(dateStr), 'dd/MM/yyyy');
      } catch (e) {
        return dateStr;
      }
    };

    const textToCopy = `*Cotización de Viaje*\n\n` +
      `*Cliente:* ${cliente || '-'}\n` +
      `*Destino:* ${destino || '-'}\n` +
      `*Fecha Salida:* ${formatDateStr(fechaSalida)}\n` +
      `*Pasajeros:* ${passengers || '-'}\n` +
      `*Unidad:* ${unitType} Asientos\n\n` +
      `*Total Final:* ${formatCurrency(calculations.finalTotal)}\n`;
      
    navigator.clipboard.writeText(textToCopy).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleClearForm = () => {
    setShowClearConfirm(true);
  };

  const confirmClearForm = () => {
    setCliente("");
    setContacto("");
    setTelefono("");
    setMail("");
    setOrigen("");
    setDestino("");
    setRegresoA("");
    setFechaSalida("");
    setHoraSalida("");
    setFechaRegreso("");
    setHoraRegreso("");
    setDescripcion("");
    setKmProductivos(0);
    setKmDestino(0);
    setKmImproductivos(0);
    setUnitType("19");
    setPassengers(0);
    setBusCount(1);
    setDriverCount(1);
    setDirtRoadPercent(0);
    setProfitMultiplier(1.3);
    setEditingId(null);
    setEditingBudgetNumber(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowClearConfirm(false);
  };

  const cancelClearForm = () => {
    setShowClearConfirm(false);
  };

  useEffect(() => {
    const existingBudgetsStr = localStorage.getItem(`savedBudgets_${currentUser}`);
    if (existingBudgetsStr) {
      setSavedBudgets(JSON.parse(existingBudgetsStr));
    }
  }, [currentUser]);

  useEffect(() => {
    if (location.state?.budgetToLoad) {
      handleLoadBudget(location.state.budgetToLoad);
      // Clear state to avoid reloading on subsequent renders
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  // Cálculos
  const calculations = useMemo(() => {
    const totalKm = (kmProductivos || 0) + (kmDestino || 0) + (kmImproductivos || 0);
    const specs = UNIT_SPECS[unitType];
    
    // Costo por coche = (Total KM / Consumo) * Precio Gasoil * Cantidad de Colectivos
    const litersNeeded = specs.consumption > 0 ? totalKm / specs.consumption : 0;
    const carCost = litersNeeded * (dieselPrice || 0) * (busCount || 1);
    
    // Depreciación * Cantidad de Colectivos
    const depreciationCost = totalKm * specs.depreciation * (busCount || 1);

    // Costo Conductores * Cantidad de Choferes
    let baseDriverCost = 0;
    if (driverServiceType === "provincial") {
      baseDriverCost = 
        (driverShift.value * driverShift.count) + 
        (driverViatico.value * driverViatico.count) + 
        (driverTomeDeje.value * driverTomeDeje.count) + 
        (driverExtraHour.value * driverExtraHour.count) + 
        (driverBed.value * driverBed.count);
    } else {
      baseDriverCost = 
        (natBreakfast.value * natBreakfast.count) + 
        (natLunch.value * natLunch.count) + 
        (natSnack.value * natSnack.count) + 
        (natDinner.value * natDinner.count) + 
        (natBed.value * natBed.count);
    }
    const totalDriverCost = baseDriverCost * (driverCount || 1);

    // Costos Base
    const baseCosts = carCost + depreciationCost + totalDriverCost;

    // Extra por viaje de tierra
    const dirtRoadCost = baseCosts * ((dirtRoadPercent || 0) / 100);

    // Subtotal
    const subtotal = baseCosts + dirtRoadCost;

    // Ganancia
    const profitAmount = subtotal * (profitMultiplier || 1);
    const totalWithProfit = subtotal + profitAmount;

    // IVA 10.5%
    const ivaAmount = totalWithProfit * 0.105;
    const finalTotal = totalWithProfit + ivaAmount;

    return {
      totalKm,
      carCost,
      depreciationCost,
      totalDriverCost,
      dirtRoadCost,
      subtotal,
      profitAmount,
      ivaAmount,
      finalTotal
    };
  }, [
    kmProductivos, kmDestino, kmImproductivos, unitType, dieselPrice, busCount, driverCount,
    driverServiceType, driverShift, driverViatico, driverTomeDeje, driverExtraHour, driverBed,
    natBreakfast, natLunch, natSnack, natDinner, natBed,
    dirtRoadPercent, profitMultiplier
  ]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    if (!pdfRef.current) return;
    
    try {
      setIsExporting(true);
      
      // Get correlative number from localStorage
      const currentNumber = parseInt(localStorage.getItem('correlativeNumber') || '1', 10);
      const formattedNumber = currentNumber.toString().padStart(5, '0');
      
      // Generate filename: Fecha_Cliente_FB-XXXX
      const dateStr = format(new Date(), 'dd-MM-yyyy');
      const clientName = cliente ? cliente.replace(/[^a-z0-9]/gi, '_') : 'SinCliente';
      const fileName = `${dateStr}_${clientName}_FB-${formattedNumber}.pdf`;

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
      setIsExporting(false);
    }
  };

  // Get current correlative number for template
  const currentCorrelativeNumber = editingBudgetNumber 
    ? editingBudgetNumber.replace('FB-', '') 
    : (parseInt(localStorage.getItem('correlativeNumber') || '1', 10)).toString().padStart(5, '0');

  const handleSaveBudget = async () => {
    try {
      const newBudget: SavedBudget = {
        id: editingId || crypto.randomUUID(),
        budgetNumber: editingBudgetNumber || `FB-${currentCorrelativeNumber}`,
        status: 'pendiente',
        date: fechaSalida || format(new Date(), 'yyyy-MM-dd'),
        client: cliente || "Sin Cliente",
        time: horaSalida || "--:--",
        destination: destino || "Sin Destino",
        km: calculations.totalKm,
        cost: calculations.subtotal,
        profit: calculations.profitAmount,
        finalPrice: calculations.finalTotal,
        contact: contacto || "-",
        phone: telefono || "-",
        tripType: tripType,
        passengers: passengers || 0,
        timestamp: Date.now(),
        // Extra fields for PDF export
        mail: mail || "",
        origen: origen || "",
        regresoA: regresoA || "",
        fechaRegreso: fechaRegreso || "",
        horaRegreso: horaRegreso || "",
        descripcion: descripcion || "",
        subtotal: calculations.subtotal,
        ivaAmount: calculations.ivaAmount,
        carCost: calculations.carCost,
        depreciationCost: calculations.depreciationCost,
        totalDriverCost: calculations.totalDriverCost,
        dirtRoadCost: calculations.dirtRoadCost,
        
        // Full state fields
        kmProductivos,
        kmDestino,
        kmImproductivos,
        unitType,
        dieselPrice,
        driverCount,
        busCount,
        driverServiceType,
        driverShift,
        driverViatico,
        driverTomeDeje,
        driverExtraHour,
        driverBed,
        natBreakfast,
        natLunch,
        natSnack,
        natDinner,
        natBed,
        dirtRoadPercent,
        profitMultiplier,
      };

      const existingBudgetsStr = localStorage.getItem(`savedBudgets_${currentUser}`);
      let existingBudgets: SavedBudget[] = existingBudgetsStr ? JSON.parse(existingBudgetsStr) : [];
      
      if (editingId) {
        // Update existing budget
        existingBudgets = existingBudgets.map(b => b.id === editingId ? newBudget : b);
        localStorage.setItem(`savedBudgets_${currentUser}`, JSON.stringify(existingBudgets));
        setSavedBudgets(existingBudgets);
        setToastMessage({ title: 'Cotización actualizada exitosamente.', type: 'success' });
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        // Create new budget
        const updatedBudgets = [newBudget, ...existingBudgets];
        localStorage.setItem(`savedBudgets_${currentUser}`, JSON.stringify(updatedBudgets));
        setSavedBudgets(updatedBudgets);
        
        // Increment correlative number since we used it
        const currentNumber = parseInt(localStorage.getItem('correlativeNumber') || '1', 10);
        localStorage.setItem('correlativeNumber', (currentNumber + 1).toString());
        
        // Save to database
        try {
          await fetch('/api/trips', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              distance: calculations.totalKm,
              passengers: passengers,
              location: destino,
              type: 'medium', // Assuming medium for now, could be calculated based on km
              scope: tripType,
              date: new Date().toISOString()
            }),
          });
        } catch (dbError) {
          console.error('Failed to save trip to database:', dbError);
          // Don't alert user here, local storage save was successful
        }

        setEditingId(newBudget.id);
        setEditingBudgetNumber(newBudget.budgetNumber);
        setToastMessage({ title: 'Cotización guardada exitosamente.', type: 'success' });
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error saving budget:', error);
      setToastMessage({ title: 'Hubo un error al guardar la cotización.', type: 'error' });
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleLoadBudget = (budget: SavedBudget) => {
    setEditingId(budget.id);
    setEditingBudgetNumber(budget.budgetNumber);
    
    setCliente(budget.client || "");
    setContacto(budget.contact || "");
    setTelefono(budget.phone || "");
    setMail(budget.mail || "");
    setOrigen(budget.origen || "");
    setDestino(budget.destination || "");
    setRegresoA(budget.regresoA || "");
    setFechaSalida(budget.date || "");
    setHoraSalida(budget.time || "");
    setFechaRegreso(budget.fechaRegreso || "");
    setHoraRegreso(budget.horaRegreso || "");
    setDescripcion(budget.descripcion || "");
    setTripType(budget.tripType || "provincial");
    setPassengers(budget.passengers || 0);

    setKmProductivos(budget.kmProductivos || budget.km || 0);
    setKmDestino(budget.kmDestino || 0);
    setKmImproductivos(budget.kmImproductivos || 0);
    setUnitType((budget.unitType as UnitType) || "19");
    setDieselPrice(budget.dieselPrice || 1000);
    setDriverCount(budget.driverCount || 1);
    setBusCount(budget.busCount || 1);
    setDriverServiceType((budget.driverServiceType as DriverServiceType) || "provincial");
    
    if (budget.driverShift) setDriverShift(budget.driverShift);
    if (budget.driverViatico) setDriverViatico(budget.driverViatico);
    if (budget.driverTomeDeje) setDriverTomeDeje(budget.driverTomeDeje);
    if (budget.driverExtraHour) setDriverExtraHour(budget.driverExtraHour);
    if (budget.driverBed) setDriverBed(budget.driverBed);
    
    if (budget.natBreakfast) setNatBreakfast(budget.natBreakfast);
    if (budget.natLunch) setNatLunch(budget.natLunch);
    if (budget.natSnack) setNatSnack(budget.natSnack);
    if (budget.natDinner) setNatDinner(budget.natDinner);
    if (budget.natBed) setNatBed(budget.natBed);
    
    setDirtRoadPercent(budget.dirtRoadPercent || 0);
    setProfitMultiplier(budget.profitMultiplier || 1.3);

    setShowLoadModal(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-[#0f1117] min-h-full text-white space-y-6 font-sans relative">
      <PdfExportTemplate 
        ref={pdfRef}
        correlativeNumber={`FB-${currentCorrelativeNumber}`}
        cliente={cliente}
        contacto={contacto}
        telefono={telefono}
        mail={mail}
        origen={origen}
        destino={destino}
        regresoA={regresoA}
        fechaSalida={fechaSalida}
        horaSalida={horaSalida}
        fechaRegreso={fechaRegreso}
        horaRegreso={horaRegreso}
        descripcion={descripcion}
        passengers={passengers}
        subtotal={calculations.subtotal}
        ivaAmount={calculations.ivaAmount}
        finalTotal={calculations.finalTotal}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Cotizador de Viajes</h1>
          <p className="text-slate-400 mt-1">Calcular costos y ganancia.</p>
        </div>
        <div className="flex flex-wrap gap-3 print:hidden">
          <button 
            onClick={handleClearForm} 
            className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-medium py-2 px-4 rounded-xl transition-all"
            title="Limpiar Formulario"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Limpiar</span>
          </button>
          <button 
            onClick={() => setShowLoadModal(true)} 
            className="flex items-center gap-2 bg-[#161920] border border-[#222631] hover:bg-[#1a1d24] hover:border-slate-700 text-white font-medium py-2 px-4 rounded-xl transition-all"
          >
            <Download className="w-4 h-4" />
            Cargar Cotización
          </button>
          <button 
            onClick={handleExportPdf} 
            disabled={isExporting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-xl transition-colors disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {isExporting ? 'Generando...' : 'Exportar PDF'}
          </button>
        </div>
      </div>

      {/* Load Budget Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#161920] border border-[#222631] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-[#222631]">
              <h2 className="text-xl font-bold text-white">Cargar Cotización Anterior</h2>
              <button 
                onClick={() => setShowLoadModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {savedBudgets.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No hay cotizaciones guardadas.
                </div>
              ) : (
                <div className="space-y-3">
                  {savedBudgets.map((budget) => (
                    <div 
                      key={budget.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-[#222631] hover:border-blue-500/50 hover:bg-[#1a1d24] transition-all cursor-pointer bg-[#0f1117]"
                      onClick={() => handleLoadBudget(budget)}
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-bold text-blue-400 font-mono">{budget.budgetNumber}</span>
                          <span className="text-sm text-slate-500">{budget.date}</span>
                        </div>
                        <div className="text-sm font-medium text-white">{budget.client}</div>
                        <div className="text-xs text-slate-400 mt-1">{budget.destination}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">{formatCurrency(budget.finalPrice)}</div>
                        <button 
                          className="mt-2 text-sm text-blue-400 font-medium hover:text-blue-300"
                        >
                          Cargar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Formularios */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Datos del Cliente y Viaje */}
          <div className="bg-[#161920] p-6 rounded-2xl border border-[#222631] shadow-sm">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm">1</span>
              Datos del Cliente y del Viaje
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <TextInputField label="Cliente" value={cliente} onChange={setCliente} />
              <TextInputField label="Nombre Contacto" value={contacto} onChange={setContacto} />
              <TextInputField label="Teléfono" value={telefono} onChange={setTelefono} />
              <TextInputField label="Mail" value={mail} onChange={setMail} type="email" />
              <div className="col-span-1 md:col-span-2 h-px bg-[#222631] my-2"></div>
              <TextInputField label="Origen" value={origen} onChange={setOrigen} />
              <TextInputField label="Destino" value={destino} onChange={setDestino} />
              <TextInputField label="Regreso a:" value={regresoA} onChange={setRegresoA} />
              <div className="col-span-1 md:col-span-2 h-px bg-[#222631] my-2"></div>
              <TextInputField label="Fecha de Salida" value={fechaSalida} onChange={setFechaSalida} type="date" />
              <TextInputField label="Horario de Salida" value={horaSalida} onChange={setHoraSalida} type="time" />
              <TextInputField label="Fecha de Regreso" value={fechaRegreso} onChange={setFechaRegreso} type="date" />
              <TextInputField label="Horario de Regreso" value={horaRegreso} onChange={setHoraRegreso} type="time" />
              <div className="md:col-span-2 flex flex-col gap-1.5 mt-2">
                <label className="text-sm font-medium text-slate-300">Descripción del servicio</label>
                <textarea 
                  className="px-4 py-3 bg-[#0f1117] border border-[#222631] rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 text-sm text-white placeholder-slate-500 min-h-[100px] transition-all"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ingrese descripción detallada del servicio..."
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
            {/* Parámetros del Viaje */}
            <div className="bg-[#161920] p-6 rounded-2xl border border-[#222631] flex flex-col shadow-sm">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm">2</span>
                Parámetros del Viaje
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 flex-1">
                <InputField label="Km Productivos" value={kmProductivos} onChange={setKmProductivos} />
                <InputField label="Km en Destino" value={kmDestino} onChange={setKmDestino} />
                <InputField label="Km Improductivos" value={kmImproductivos} onChange={setKmImproductivos} />
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-300 whitespace-nowrap truncate" title="Tipo de Unidad">Tipo de Unidad</label>
                  <select 
                    className="px-4 py-2.5 bg-[#0f1117] border border-[#222631] rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 text-sm text-white transition-all"
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value as UnitType)}
                  >
                    <option value="19">19 Asientos</option>
                    <option value="24">24 Asientos</option>
                    <option value="44">44 Asientos</option>
                    <option value="46">46 Asientos</option>
                    <option value="60">60 Asientos</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-300 whitespace-nowrap truncate" title="Tipo de Viaje">Tipo de Viaje</label>
                  <select 
                    className="px-4 py-2.5 bg-[#0f1117] border border-[#222631] rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 text-sm text-white transition-all"
                    value={tripType}
                    onChange={(e) => setTripType(e.target.value as TripType)}
                  >
                    <option value="provincial">Provincial</option>
                    <option value="nacional">Nacional</option>
                    <option value="internacional">Internacional</option>
                  </select>
                </div>
                
                <InputField label="Cant. Pasajeros" value={passengers} onChange={setPassengers} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-300 whitespace-nowrap truncate" title="Precio Gasoil ($/L)">Precio Gasoil ($/L)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                    <input 
                      type="number" 
                      step="1"
                      className="w-full pl-8 pr-4 py-2.5 bg-[#0f1117] border border-[#222631] rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 font-mono text-sm text-white placeholder-slate-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield] transition-all"
                      value={dieselPrice || ""}
                      onChange={(e) => setDieselPrice(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                </div>
                
                <InputField label="Cant. Colectivos" value={busCount} onChange={setBusCount} />
              </div>
              <div className="mt-6 p-4 bg-[#0f1117] border border-[#222631] rounded-xl text-sm flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Consumo Estimado:</span>
                  <span className="font-mono text-white">{UNIT_SPECS[unitType].consumption} km/l</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Depreciación:</span>
                  <span className="font-mono text-white">{formatCurrency(UNIT_SPECS[unitType].depreciation)}/km</span>
                </div>
              </div>
            </div>

            {/* Costo Conductor */}
            <div className="bg-[#161920] p-6 rounded-2xl border border-[#222631] flex flex-col shadow-sm">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center text-sm">3</span>
                Costo Conductor
              </h2>
              <div className="flex flex-col gap-5 flex-1">
                <div className="flex flex-col gap-4 mb-2 border-b border-[#222631] pb-5">
                  <div className="flex justify-between items-center gap-4">
                    <label className="text-sm font-medium text-slate-300">Cantidad de Conductores:</label>
                    <div className="flex items-center bg-[#0f1117] rounded-lg border border-[#222631] overflow-hidden h-9">
                      <button 
                        type="button"
                        className="px-3 h-full flex items-center justify-center text-slate-400 hover:text-blue-400 hover:bg-[#222631] transition-colors border-r border-[#222631]"
                        onClick={() => setDriverCount(Math.max(1, driverCount - 1))}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center font-mono text-sm font-medium text-white">{driverCount}</span>
                      <button 
                        type="button"
                        className="px-3 h-full flex items-center justify-center text-slate-400 hover:text-blue-400 hover:bg-[#222631] transition-colors border-l border-[#222631]"
                        onClick={() => setDriverCount(driverCount + 1)}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex bg-[#0f1117] p-1 rounded-xl border border-[#222631] w-full">
                    <button 
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${driverServiceType === 'provincial' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300 hover:bg-[#1a1d24]'}`}
                      onClick={() => setDriverServiceType('provincial')}
                    >
                      Provincial
                    </button>
                    <button 
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${driverServiceType === 'nacional' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300 hover:bg-[#1a1d24]'}`}
                      onClick={() => setDriverServiceType('nacional')}
                    >
                      Nacional
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr_1fr] md:grid-cols-[1.5fr_auto_1.5fr_1fr] gap-2 md:gap-3 mb-2 px-2">
                  <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wider">Concepto</span>
                  <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[50px] md:w-[60px] text-center">Cant.</span>
                  <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Valor Unit.</span>
                  <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Total</span>
                </div>

                {driverServiceType === 'provincial' ? (
                  <div className="grid grid-cols-1 gap-4 flex-1">
                    <CostItemField label="Jornada" value={driverShift} onChange={setDriverShift} />
                    <CostItemField label="Viático" value={driverViatico} onChange={setDriverViatico} />
                    <CostItemField label="Tome y Deje" value={driverTomeDeje} onChange={setDriverTomeDeje} />
                    <CostItemField label="Hora Extra" value={driverExtraHour} onChange={setDriverExtraHour} />
                    <CostItemField label="Cama" value={driverBed} onChange={setDriverBed} />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 flex-1">
                    <CostItemField label="Desayuno" value={natBreakfast} onChange={setNatBreakfast} />
                    <CostItemField label="Almuerzo" value={natLunch} onChange={setNatLunch} />
                    <CostItemField label="Merienda" value={natSnack} onChange={setNatSnack} />
                    <CostItemField label="Cena" value={natDinner} onChange={setNatDinner} />
                    <CostItemField label="Cama" value={natBed} onChange={setNatBed} />
                  </div>
                )}

                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-400">Total Conductores:</span>
                  <span className="text-xl font-bold font-mono text-blue-400">{formatCurrency(calculations.totalDriverCost)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Resumen */}
        <div className="xl:col-span-1">
          <div className="bg-[#161920] text-white p-6 rounded-2xl border border-[#222631] sticky top-8 shadow-xl">
            <h2 className="text-xl font-bold mb-6 border-b border-[#222631] pb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center text-sm">4</span>
              Resumen del Viaje
            </h2>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center p-2 hover:bg-[#1a1d24] rounded-lg transition-colors">
                <span className="text-slate-400">Kilómetros Totales</span>
                <span className="font-mono font-medium text-white">{calculations.totalKm} km</span>
              </div>
              
              <div className="flex justify-between items-center p-2 hover:bg-[#1a1d24] rounded-lg transition-colors">
                <span className="text-slate-400">Costo por Coche (Gasoil)</span>
                <span className="font-mono font-medium text-white">{formatCurrency(calculations.carCost)}</span>
              </div>
              
              <div className="flex justify-between items-center p-2 hover:bg-[#1a1d24] rounded-lg transition-colors">
                <span className="text-slate-400">Depreciación Unidad</span>
                <span className="font-mono font-medium text-white">{formatCurrency(calculations.depreciationCost)}</span>
              </div>
              
              <div className="flex justify-between items-center p-2 hover:bg-[#1a1d24] rounded-lg transition-colors">
                <span className="text-slate-400">Costo Conductores</span>
                <span className="font-mono font-medium text-white">{formatCurrency(calculations.totalDriverCost)}</span>
              </div>

              {/* Configuraciones Extra (Sliders) */}
              <div className="pt-6 pb-4 border-t border-[#222631] space-y-8 print:hidden">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Adicional Por Ruta No Asfaltada</label>
                    <span className="text-amber-500 font-mono text-sm font-bold bg-amber-500/10 px-2 py-0.5 rounded-md">{dirtRoadPercent}%</span>
                  </div>
                  <div className="relative flex items-center h-6">
                    <input 
                      type="range" 
                      min="0" max="100" step="1"
                      value={dirtRoadPercent} 
                      onChange={(e) => setDirtRoadPercent(Number(e.target.value))}
                      className="w-full h-2 bg-[#0a0b0f] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-transparent"
                      style={{
                        background: `linear-gradient(to right, #f59e0b ${dirtRoadPercent}%, #0a0b0f ${dirtRoadPercent}%)`
                      }}
                    />
                    <div 
                      className="absolute pointer-events-none flex items-center justify-center w-6 h-6"
                      style={{ 
                        left: `calc(${dirtRoadPercent}% + ${12 - dirtRoadPercent * 0.24}px)`, 
                        transform: 'translateX(-50%)' 
                      }}
                    >
                      <Mountain className="w-5 h-5 text-amber-500 drop-shadow-md" fill="currentColor" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Multiplicador Ganancia</label>
                    <span className="text-emerald-500 font-mono text-sm font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">x{profitMultiplier.toFixed(2)}</span>
                  </div>
                  <div className="relative flex items-center h-6">
                    <input 
                      type="range" 
                      min="1" max="10" step="0.05"
                      value={profitMultiplier} 
                      onChange={(e) => setProfitMultiplier(Number(e.target.value))}
                      className="w-full h-2 bg-[#0a0b0f] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-transparent"
                      style={{
                        background: `linear-gradient(to right, #10b981 ${((profitMultiplier - 1) / 9) * 100}%, #0a0b0f ${((profitMultiplier - 1) / 9) * 100}%)`
                      }}
                    />
                    <div 
                      className="absolute pointer-events-none flex items-center justify-center w-6 h-6"
                      style={{ 
                        left: `calc(${((profitMultiplier - 1) / 9) * 100}% + ${12 - (((profitMultiplier - 1) / 9) * 100) * 0.24}px)`, 
                        transform: 'translateX(-50%)' 
                      }}
                    >
                      <Flame className="w-5 h-5 text-emerald-500 drop-shadow-md" fill="currentColor" />
                    </div>
                  </div>
                </div>
              </div>

              {calculations.dirtRoadCost > 0 && (
                <div className="flex justify-between items-center text-amber-400 p-2 bg-amber-500/5 rounded-lg">
                  <span>Extra Ruta No Asfaltada ({dirtRoadPercent}%)</span>
                  <span className="font-mono font-medium">+{formatCurrency(calculations.dirtRoadCost)}</span>
                </div>
              )}

              <div className="pt-4 border-t border-[#222631] flex justify-between items-center p-2">
                <span className="text-slate-300 font-medium">Subtotal Costos</span>
                <span className="font-mono font-medium text-white">{formatCurrency(calculations.subtotal)}</span>
              </div>

              <div className="flex justify-between items-center text-emerald-400 p-2 bg-emerald-500/5 rounded-lg">
                <span>Ganancia ({(profitMultiplier * 100).toFixed(2)}%)</span>
                <span className="font-mono font-medium">+{formatCurrency(calculations.profitAmount)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-400 p-2">
                <span>IVA (10.5%)</span>
                <span className="font-mono font-medium">+{formatCurrency(calculations.ivaAmount)}</span>
              </div>

              <div className="pt-6 mt-4 border-t border-[#222631]">
                <div className="flex justify-between items-end bg-blue-600/10 p-4 rounded-xl border border-blue-500/20">
                  <span className="text-lg font-bold text-white">Total Final</span>
                  <span className="text-3xl font-bold font-mono text-blue-400">{formatCurrency(calculations.finalTotal)}</span>
                </div>
                {calculations.totalKm > 0 && (
                  <div className="flex justify-between items-center mt-3 px-2 text-sm text-slate-400">
                    <span>Relación $/km</span>
                    <span className="font-mono bg-[#0f1117] px-2 py-1 rounded-md border border-[#222631]">{formatCurrency(calculations.finalTotal / calculations.totalKm)}/km</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 space-y-3 print:hidden">
              <button 
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 bg-[#1a1d24] hover:bg-[#222631] border border-[#222631] text-slate-300 font-medium py-3.5 px-4 rounded-xl transition-colors"
              >
                {isCopied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                {isCopied ? '¡Copiado!' : 'Copiar Resumen'}
              </button>
              <button 
                onClick={handleSaveBudget}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
              >
                <Save className="w-5 h-5" />
                {editingId ? 'Actualizar Cotización' : 'Guardar Cotización'}
              </button>
              {editingId && (
                <button 
                  onClick={() => {
                    setEditingId(null);
                    setEditingBudgetNumber(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[#1a1d24] hover:bg-[#222631] border border-[#222631] text-slate-300 font-medium py-3.5 px-4 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                  Cancelar Edición (Nueva Cotización)
                </button>
              )}
            </div>
          </div>
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

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d24] rounded-2xl border border-[#222631] w-full max-w-md p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">Confirmar limpieza</h2>
            <p className="text-slate-300 mb-6">
              ¿Estás seguro de que deseas limpiar todo el formulario? Se perderán todos los datos ingresados.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelClearForm}
                className="px-4 py-2 rounded-xl font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmClearForm}
                className="px-4 py-2 rounded-xl font-medium bg-red-600 hover:bg-red-500 text-white transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InputField({ 
  label, 
  value, 
  onChange, 
  step = "1" 
}: { 
  label: string; 
  value: number; 
  onChange: (val: number) => void;
  step?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-300 whitespace-nowrap truncate" title={label}>{label}</label>
      <input 
        type="number" 
        step={step}
        className="px-4 py-2.5 bg-[#0f1117] border border-[#222631] rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 font-mono text-sm text-white placeholder-slate-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield] transition-all"
        value={value || ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        placeholder="0"
      />
    </div>
  );
}

function TextInputField({ 
  label, 
  value, 
  onChange, 
  type = "text" 
}: { 
  label: string; 
  value: string; 
  onChange: (val: string) => void;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      <input 
        type={type}
        className="px-4 py-2.5 bg-[#0f1117] border border-[#222631] rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 text-sm text-white placeholder-slate-500 transition-all"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Ingrese ${label.toLowerCase()}`}
      />
    </div>
  );
}

function CostItemField({ 
  label, 
  value, 
  onChange 
}: { 
  label: string; 
  value: CostItem; 
  onChange: (val: CostItem) => void;
}) {
  const total = value.count * value.value;
  return (
    <div className="grid grid-cols-[1fr_auto_1fr_1fr] md:grid-cols-[1.5fr_auto_1.5fr_1fr] gap-2 md:gap-3 items-center group">
      <label className="text-xs md:text-sm font-medium text-slate-300 truncate group-hover:text-white transition-colors" title={label}>{label}</label>
      
      <div className="flex items-center bg-[#0f1117] rounded-lg border border-[#222631] overflow-hidden w-[50px] md:w-[60px] h-[32px] md:h-[36px] focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
        <span className="flex-1 text-center font-mono text-xs md:text-sm font-medium text-white">{value.count}</span>
        <div className="flex flex-col border-l border-[#222631] h-full bg-[#1a1d24]">
          <button 
            type="button"
            className="px-1 md:px-1.5 h-1/2 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:bg-[#222631] transition-colors border-b border-[#222631]"
            onClick={() => onChange({ ...value, count: value.count + 1 })}
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button 
            type="button"
            className="px-1 md:px-1.5 h-1/2 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:bg-[#222631] transition-colors"
            onClick={() => onChange({ ...value, count: Math.max(0, value.count - 1) })}
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      <div className="relative">
        <span className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-xs md:text-sm">$</span>
        <input 
          type="number" 
          className="w-full pl-5 md:pl-7 pr-2 md:pr-3 py-1.5 md:py-2 bg-[#0f1117] border border-[#222631] rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 font-mono text-xs md:text-sm text-white placeholder-slate-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield] transition-all"
          value={value.value || ""}
          onChange={(e) => onChange({ ...value, value: parseFloat(e.target.value) || 0 })}
          placeholder="0"
        />
      </div>

      <div className="text-right font-mono text-xs md:text-sm font-medium text-slate-300 truncate min-w-[60px] md:min-w-[80px] group-hover:text-white transition-colors">
        {formatCurrency(total)}
      </div>
    </div>
  );
}

