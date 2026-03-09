import { useState, useMemo, useRef, useEffect } from "react";
import { Save, FileText, Loader2, Download, X } from "lucide-react";
import jsPDF from "jspdf";
import * as htmlToImage from "html-to-image";
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
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Error reading from localStorage", e);
  }
  return defaultValue;
};

export default function Cotizador() {
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
  const [dieselPrice, setDieselPrice] = useState<number>(1000);
  const [driverCount, setDriverCount] = useState<number>(1);
  const [busCount, setBusCount] = useState<number>(1);

  // Costo conductor
  const [driverServiceType, setDriverServiceType] = useState<DriverServiceType>("provincial");
  
  // Tipo de viaje
  const [tripType, setTripType] = useState<TripType>("provincial");
  
  // Costo conductor provincial
  const [driverShift, setDriverShift] = useState<CostItem>(() => getSavedCost('driverShift', { value: 63199, count: 1 }));
  const [driverViatico, setDriverViatico] = useState<CostItem>(() => getSavedCost('driverViatico', { value: 13574, count: 1 }));
  const [driverTomeDeje, setDriverTomeDeje] = useState<CostItem>(() => getSavedCost('driverTomeDeje', { value: 4597, count: 1 }));
  const [driverExtraHour, setDriverExtraHour] = useState<CostItem>(() => getSavedCost('driverExtraHour', { value: 9196, count: 1 }));
  const [driverBed, setDriverBed] = useState<CostItem>(() => getSavedCost('driverBed', { value: 21591, count: 1 }));

  // Viáticos nacional
  const [natBreakfast, setNatBreakfast] = useState<CostItem>(() => getSavedCost('natBreakfast', { value: 3624, count: 1 }));
  const [natLunch, setNatLunch] = useState<CostItem>(() => getSavedCost('natLunch', { value: 13337, count: 1 }));
  const [natSnack, setNatSnack] = useState<CostItem>(() => getSavedCost('natSnack', { value: 3624, count: 1 }));
  const [natDinner, setNatDinner] = useState<CostItem>(() => getSavedCost('natDinner', { value: 13337, count: 1 }));
  const [natBed, setNatBed] = useState<CostItem>(() => getSavedCost('natBed', { value: 21591, count: 1 }));

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

  // Configuraciones extra
  const [dirtRoadPercent, setDirtRoadPercent] = useState<number>(0);
  const [profitMultiplier, setProfitMultiplier] = useState<number>(1.3);
  const [isExporting, setIsExporting] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBudgetNumber, setEditingBudgetNumber] = useState<string | null>(null);
  const [savedBudgets, setSavedBudgets] = useState<SavedBudget[]>([]);
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const existingBudgetsStr = localStorage.getItem('savedBudgets');
    if (existingBudgetsStr) {
      setSavedBudgets(JSON.parse(existingBudgetsStr));
    }
  }, []);

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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
  };

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
      
      // Increment correlative number
      localStorage.setItem('correlativeNumber', (currentNumber + 1).toString());
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Hubo un error al generar el PDF.');
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

      const existingBudgetsStr = localStorage.getItem('savedBudgets');
      let existingBudgets: SavedBudget[] = existingBudgetsStr ? JSON.parse(existingBudgetsStr) : [];
      
      if (editingId) {
        // Update existing budget
        existingBudgets = existingBudgets.map(b => b.id === editingId ? newBudget : b);
        localStorage.setItem('savedBudgets', JSON.stringify(existingBudgets));
        setSavedBudgets(existingBudgets);
        alert('Cotización actualizada exitosamente en el Historial.');
      } else {
        // Create new budget
        const updatedBudgets = [newBudget, ...existingBudgets];
        localStorage.setItem('savedBudgets', JSON.stringify(updatedBudgets));
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

        alert('Cotización guardada exitosamente en el Historial.');
      }
    } catch (error) {
      console.error('Error saving budget:', error);
      alert('Hubo un error al guardar la cotización.');
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

    setKmProductivos(budget.kmProductivos || 0);
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
  };

  return (
    <div className="space-y-6 pb-12 relative">
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

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cotizador de Viajes</h1>
          <p className="text-slate-500 mt-1">Calcular costos y ganancia.</p>
        </div>
        <div className="flex gap-3 print:hidden">
          <button 
            onClick={() => setShowLoadModal(true)} 
            className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium py-2 px-4 rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            Cargar Cotización
          </button>
          <button 
            onClick={handleExportPdf} 
            disabled={isExporting}
            className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium py-2 px-4 rounded-xl transition-colors disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {isExporting ? 'Generando...' : 'Exportar PDF'}
          </button>
        </div>
      </div>

      {/* Load Budget Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Cargar Cotización Anterior</h2>
              <button 
                onClick={() => setShowLoadModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
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
                      className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-green-500 hover:shadow-sm transition-all cursor-pointer bg-slate-50 hover:bg-white"
                      onClick={() => handleLoadBudget(budget)}
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-bold text-slate-800">{budget.budgetNumber}</span>
                          <span className="text-sm text-slate-500">{budget.date}</span>
                        </div>
                        <div className="text-sm font-medium text-slate-700">{budget.client}</div>
                        <div className="text-xs text-slate-500 mt-1">{budget.destination}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{formatCurrency(budget.finalPrice)}</div>
                        <button 
                          className="mt-2 text-sm text-green-600 font-medium hover:text-green-700"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formularios */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Datos del Cliente y Viaje */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Datos del Cliente y del Viaje</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInputField label="Cliente" value={cliente} onChange={setCliente} />
              <TextInputField label="Nombre Contacto" value={contacto} onChange={setContacto} />
              <TextInputField label="Teléfono" value={telefono} onChange={setTelefono} />
              <TextInputField label="Mail" value={mail} onChange={setMail} type="email" />
              <TextInputField label="Origen" value={origen} onChange={setOrigen} />
              <TextInputField label="Destino" value={destino} onChange={setDestino} />
              <TextInputField label="Regreso a:" value={regresoA} onChange={setRegresoA} />
              <TextInputField label="Fecha de Salida" value={fechaSalida} onChange={setFechaSalida} type="date" />
              <TextInputField label="Horario de Salida" value={horaSalida} onChange={setHoraSalida} type="time" />
              <TextInputField label="Fecha de Regreso" value={fechaRegreso} onChange={setFechaRegreso} type="date" />
              <TextInputField label="Horario de Regreso" value={horaRegreso} onChange={setHoraRegreso} type="time" />
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Descripción del servicio</label>
                <textarea 
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[80px]"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Parámetros del Viaje */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Parámetros del Viaje</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="Km Productivos" value={kmProductivos} onChange={setKmProductivos} />
              <InputField label="Km en Destino" value={kmDestino} onChange={setKmDestino} />
              <InputField label="Km Improductivos" value={kmImproductivos} onChange={setKmImproductivos} />
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Tipo de Unidad</label>
                <select 
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                <label className="text-sm font-medium text-slate-700">Tipo de Viaje</label>
                <select 
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={tripType}
                  onChange={(e) => setTripType(e.target.value as TripType)}
                >
                  <option value="provincial">Provincial</option>
                  <option value="nacional">Nacional</option>
                  <option value="internacional">Internacional</option>
                </select>
              </div>
              
              <InputField label="Cant. Pasajeros" value={passengers} onChange={setPassengers} />
              <InputField label="Precio Gasoil ($/L)" value={dieselPrice} onChange={setDieselPrice} />
              
              <InputField label="Cant. Choferes" value={driverCount} onChange={setDriverCount} />
              <InputField label="Cant. Colectivos" value={busCount} onChange={setBusCount} />
            </div>
            <div className="mt-4 p-3 bg-green-50 text-green-800 rounded-lg text-sm">
              <p><strong>Configuración Unidad:</strong> Consumo: {UNIT_SPECS[unitType].consumption} km/l | Depreciación: {formatCurrency(UNIT_SPECS[unitType].depreciation)}/km</p>
            </div>
          </div>

          {/* Costo Conductor */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-lg font-semibold text-slate-800">Costo Conductor</h2>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${driverServiceType === 'provincial' ? 'bg-white shadow-sm text-green-700' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setDriverServiceType('provincial')}
                >
                  Provincial
                </button>
                <button 
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${driverServiceType === 'nacional' ? 'bg-white shadow-sm text-green-700' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setDriverServiceType('nacional')}
                >
                  Nacional
                </button>
              </div>
            </div>

            {driverServiceType === 'provincial' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <CostItemField label="Jornada Chofer" value={driverShift} onChange={setDriverShift} />
                <CostItemField label="Viático" value={driverViatico} onChange={setDriverViatico} />
                <CostItemField label="Tome y Deje" value={driverTomeDeje} onChange={setDriverTomeDeje} />
                <CostItemField label="Hora Extra" value={driverExtraHour} onChange={setDriverExtraHour} />
                <CostItemField label="Cama" value={driverBed} onChange={setDriverBed} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <CostItemField label="Desayuno" value={natBreakfast} onChange={setNatBreakfast} />
                <CostItemField label="Almuerzo" value={natLunch} onChange={setNatLunch} />
                <CostItemField label="Merienda" value={natSnack} onChange={setNatSnack} />
                <CostItemField label="Cena" value={natDinner} onChange={setNatDinner} />
                <CostItemField label="Cama" value={natBed} onChange={setNatBed} />
              </div>
            )}
          </div>

        </div>

        {/* Resumen */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg sticky top-8">
            <h2 className="text-xl font-bold mb-6 border-b border-slate-700 pb-4">Resumen del Viaje</h2>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Kilómetros Totales</span>
                <span className="font-mono font-medium">{calculations.totalKm} km</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Costo por Coche (Gasoil)</span>
                <span className="font-mono font-medium">{formatCurrency(calculations.carCost)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Depreciación Unidad</span>
                <span className="font-mono font-medium">{formatCurrency(calculations.depreciationCost)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Costo Conductores</span>
                <span className="font-mono font-medium">{formatCurrency(calculations.totalDriverCost)}</span>
              </div>

              {/* Configuraciones Extra (Sliders) */}
              <div className="pt-4 pb-2 border-t border-slate-700 space-y-4 print:hidden">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-slate-300 text-xs font-medium uppercase tracking-wider">Adicional Por Ruta No Asfaltada</label>
                    <span className="text-amber-400 font-mono text-xs">{dirtRoadPercent}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="100" step="1"
                    value={dirtRoadPercent} 
                    onChange={(e) => setDirtRoadPercent(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-slate-300 text-xs font-medium uppercase tracking-wider">Multiplicador Ganancia</label>
                    <span className="text-emerald-400 font-mono text-xs">x{profitMultiplier.toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" max="10" step="0.05"
                    value={profitMultiplier} 
                    onChange={(e) => setProfitMultiplier(Number(e.target.value))}
                    className="fire-slider"
                  />
                </div>
              </div>

              {calculations.dirtRoadCost > 0 && (
                <div className="flex justify-between items-center text-amber-400">
                  <span>Extra Ruta No Asfaltada ({dirtRoadPercent}%)</span>
                  <span className="font-mono font-medium">+{formatCurrency(calculations.dirtRoadCost)}</span>
                </div>
              )}

              <div className="pt-4 border-t border-slate-700 flex justify-between items-center">
                <span className="text-slate-300 font-medium">Subtotal Costos</span>
                <span className="font-mono font-medium">{formatCurrency(calculations.subtotal)}</span>
              </div>

              <div className="flex justify-between items-center text-emerald-400">
                <span>Ganancia ({(profitMultiplier * 100).toFixed(2)}%)</span>
                <span className="font-mono font-medium">+{formatCurrency(calculations.profitAmount)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-400">
                <span>IVA (10.5%)</span>
                <span className="font-mono font-medium">+{formatCurrency(calculations.ivaAmount)}</span>
              </div>

              <div className="pt-6 mt-2 border-t border-slate-700">
                <div className="flex justify-between items-end">
                  <span className="text-lg font-bold">Total Final</span>
                  <span className="text-2xl font-bold font-mono text-green-400">{formatCurrency(calculations.finalTotal)}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-3 print:hidden">
              <button 
                onClick={handleSaveBudget}
                className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-xl transition-colors"
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
                  className="w-full flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-3 px-4 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                  Cancelar Edición (Nueva Cotización)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
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
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input 
        type="number" 
        step={step}
        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
        value={value || ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
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
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input 
        type={type}
        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg border border-slate-200 p-1">
          <button 
            type="button"
            className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 hover:text-green-600 transition-colors"
            onClick={() => onChange({ ...value, count: Math.max(1, value.count - 1) })}
          >-</button>
          <span className="w-6 text-center font-mono text-sm font-medium">{value.count}</span>
          <button 
            type="button"
            className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 hover:text-green-600 transition-colors"
            onClick={() => onChange({ ...value, count: value.count + 1 })}
          >+</button>
        </div>
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
          <input 
            type="number" 
            className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
            value={value.value || ""}
            onChange={(e) => onChange({ ...value, value: parseFloat(e.target.value) || 0 })}
            placeholder="Valor"
          />
        </div>
      </div>
    </div>
  );
}

