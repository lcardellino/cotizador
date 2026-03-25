import { useState, useEffect } from "react";
import { Bus, Plus, Search, Edit2, Trash2, X, CheckCircle, AlertTriangle, XCircle, Wrench } from "lucide-react";
import { Vehicle, VehicleStatus } from "../types";
import { api } from "../lib/api";

const INITIAL_VEHICLES: Vehicle[] = [
  { id: '1', plate: 'AF 123 CD', internalNumber: '101', unitType: '19', brand: 'Mercedes-Benz', model: 'Sprinter', status: 'activo' },
  { id: '2', plate: 'AE 456 FG', internalNumber: '102', unitType: '60', brand: 'Volvo', model: 'Marcopolo Paradiso', status: 'mantenimiento' },
  { id: '3', plate: 'AD 789 HI', internalNumber: '103', unitType: '46', brand: 'Scania', model: 'K310', status: 'activo' },
  { id: '4', plate: 'AC 012 JK', internalNumber: '104', unitType: '24', brand: 'Iveco', model: 'Daily', status: 'inactivo' },
];

export default function Vehiculos() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form state
  const [plate, setPlate] = useState("");
  const [internalNumber, setInternalNumber] = useState("");
  const [unitType, setUnitType] = useState("19");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [status, setStatus] = useState<VehicleStatus>("activo");
  const [rtoNacional, setRtoNacional] = useState("");
  const [rtoProvincial, setRtoProvincial] = useState("");

  useEffect(() => {
    const loadVehicles = async () => {
      const data = await api.getVehicles();
      if (data && data.length > 0) {
        setVehicles(data);
      } else {
        setVehicles(INITIAL_VEHICLES);
        api.syncVehicles(INITIAL_VEHICLES);
      }
    };
    loadVehicles();
  }, []);

  const saveVehicles = async (newVehicles: Vehicle[]) => {
    setVehicles(newVehicles);
    await api.syncVehicles(newVehicles);
  };

  const handleOpenModal = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setPlate(vehicle.plate);
      setInternalNumber(vehicle.internalNumber || "");
      setUnitType(vehicle.unitType);
      setBrand(vehicle.brand);
      setModel(vehicle.model);
      setStatus(vehicle.status);
      setRtoNacional(vehicle.rtoNacional || "");
      setRtoProvincial(vehicle.rtoProvincial || "");
    } else {
      setEditingVehicle(null);
      setPlate("");
      setInternalNumber("");
      setUnitType("19");
      setBrand("");
      setModel("");
      setStatus("activo");
      setRtoNacional("");
      setRtoProvincial("");
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVehicle(null);
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newVehicle: Vehicle = {
      id: editingVehicle ? editingVehicle.id : Date.now().toString(),
      plate: plate.toUpperCase(),
      internalNumber,
      unitType,
      brand,
      model,
      status,
      rtoNacional,
      rtoProvincial
    };

    if (editingVehicle) {
      saveVehicles(vehicles.map(v => v.id === editingVehicle.id ? newVehicle : v));
    } else {
      saveVehicles([...vehicles, newVehicle]);
    }
    handleCloseModal();
  };

  const handleDeleteVehicle = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      saveVehicles(vehicles.filter(v => v.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const filteredVehicles = vehicles.filter(v => 
    v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUnitName = (type: string) => {
    if (type === '19') return 'Minibús 19';
    if (type === '24') return 'Minibús 24';
    if (type === '44') return 'Bus 44';
    if (type === '46') return 'Bus 46';
    if (type === '60') return 'Bus 60';
    return type;
  };

  const getStatusBadge = (status: VehicleStatus) => {
    switch (status) {
      case 'activo':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle className="w-3.5 h-3.5" /> Activo</span>;
      case 'mantenimiento':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20"><Wrench className="w-3.5 h-3.5" /> Mantenimiento</span>;
      case 'inactivo':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20"><XCircle className="w-3.5 h-3.5" /> Inactivo</span>;
    }
  };

  // KPIs
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.status === 'activo').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'mantenimiento').length;

  return (
    <div className="-m-4 md:-m-8 p-4 md:p-8 bg-[#0f1117] min-h-full text-white space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="flex items-center gap-3">
          <Bus className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold">Flota de Vehículos</h1>
            <p className="text-slate-400 text-sm mt-1">Gestión de unidades y mantenimiento</p>
          </div>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-xl transition-colors whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Agregar Vehículo
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#161920] p-6 rounded-2xl border border-[#222631] flex flex-col relative">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
              <Bus className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-white mb-1">{totalVehicles}</p>
            <p className="text-sm font-medium text-slate-400">Unidades Totales</p>
          </div>
        </div>
        <div className="bg-[#161920] p-6 rounded-2xl border border-[#222631] flex flex-col relative">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-white mb-1">{activeVehicles}</p>
            <p className="text-sm font-medium text-slate-400">Unidades Activas</p>
          </div>
        </div>
        <div className="bg-[#161920] p-6 rounded-2xl border border-[#222631] flex flex-col relative">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-white mb-1">{maintenanceVehicles}</p>
            <p className="text-sm font-medium text-slate-400">En Mantenimiento</p>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[#161920] rounded-2xl border border-[#222631] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#222631] flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por patente, marca o modelo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0f1117] border border-[#222631] rounded-xl focus:outline-none focus:border-blue-500 text-sm text-white placeholder-slate-500"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 border-b border-[#222631] bg-[#1a1d24] uppercase">
              <tr>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Nro Interno</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Patente</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Capacidad</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Marca / Modelo</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">RTO Nac.</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">RTO Prov.</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Estado</th>
                <th className="px-6 py-4 font-medium text-right whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222631]">
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-[#1a1d24] transition-colors group">
                    <td className="px-6 py-4 font-bold text-blue-400 whitespace-nowrap">
                      {vehicle.internalNumber || '-'}
                    </td>
                    <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                      {vehicle.plate}
                    </td>
                    <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                      {getUnitName(vehicle.unitType)}
                    </td>
                    <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                      {vehicle.brand} {vehicle.model}
                    </td>
                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                      {vehicle.rtoNacional ? new Date(`${vehicle.rtoNacional}T00:00:00`).toLocaleDateString('es-AR') : '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                      {vehicle.rtoProvincial ? new Date(`${vehicle.rtoProvincial}T00:00:00`).toLocaleDateString('es-AR') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(vehicle.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenModal(vehicle)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Editar Vehículo"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteVehicle(vehicle.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Eliminar Vehículo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    <Bus className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    No se encontraron vehículos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Agregar/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#161920] border border-[#222631] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-[#222631]">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Bus className="w-5 h-5 text-blue-400" />
                {editingVehicle ? 'Editar Vehículo' : 'Agregar Vehículo'}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-[#222631]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveVehicle} className="flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-300">Nro Interno *</label>
                    <input 
                      type="text" 
                      required
                      value={internalNumber}
                      onChange={(e) => setInternalNumber(e.target.value)}
                      className="px-3 py-2 bg-[#0f1117] border border-[#222631] rounded-xl focus:outline-none focus:border-blue-500 text-sm text-white placeholder-slate-500"
                      placeholder="Ej: 101"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-300">Patente *</label>
                    <input 
                      type="text" 
                      required
                      value={plate}
                      onChange={(e) => setPlate(e.target.value)}
                      className="px-3 py-2 bg-[#0f1117] border border-[#222631] rounded-xl focus:outline-none focus:border-blue-500 text-sm text-white placeholder-slate-500 uppercase"
                      placeholder="Ej: AB 123 CD"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-300">Capacidad *</label>
                    <select 
                      required
                      value={unitType}
                      onChange={(e) => setUnitType(e.target.value)}
                      className="px-3 py-2 bg-[#0f1117] border border-[#222631] rounded-xl focus:outline-none focus:border-blue-500 text-sm text-white"
                    >
                      <option value="19">19 Asientos</option>
                      <option value="24">24 Asientos</option>
                      <option value="44">44 Asientos</option>
                      <option value="46">46 Asientos</option>
                      <option value="60">60 Asientos</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-300">Marca *</label>
                    <input 
                      type="text" 
                      required
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="px-3 py-2 bg-[#0f1117] border border-[#222631] rounded-xl focus:outline-none focus:border-blue-500 text-sm text-white placeholder-slate-500"
                      placeholder="Ej: Mercedes-Benz"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-300">Modelo *</label>
                    <input 
                      type="text" 
                      required
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="px-3 py-2 bg-[#0f1117] border border-[#222631] rounded-xl focus:outline-none focus:border-blue-500 text-sm text-white placeholder-slate-500"
                      placeholder="Ej: Sprinter"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-300">Estado *</label>
                    <select 
                      required
                      value={status}
                      onChange={(e) => setStatus(e.target.value as VehicleStatus)}
                      className="px-3 py-2 bg-[#0f1117] border border-[#222631] rounded-xl focus:outline-none focus:border-blue-500 text-sm text-white"
                    >
                      <option value="activo">Activo</option>
                      <option value="mantenimiento">En Mantenimiento</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-300">RTO Nacional (Vencimiento)</label>
                    <input 
                      type="date" 
                      value={rtoNacional}
                      onChange={(e) => setRtoNacional(e.target.value)}
                      className="px-3 py-2 bg-[#0f1117] border border-[#222631] rounded-xl focus:outline-none focus:border-blue-500 text-sm text-white placeholder-slate-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-300">RTO Provincial (Vencimiento)</label>
                    <input 
                      type="date" 
                      value={rtoProvincial}
                      onChange={(e) => setRtoProvincial(e.target.value)}
                      className="px-3 py-2 bg-[#0f1117] border border-[#222631] rounded-xl focus:outline-none focus:border-blue-500 text-sm text-white placeholder-slate-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-[#222631] bg-[#1a1d24] flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-transparent hover:bg-[#222631] text-slate-300 font-medium rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors"
                >
                  {editingVehicle ? 'Guardar Cambios' : 'Agregar Vehículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d24] rounded-2xl border border-[#222631] w-full max-w-md p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">Confirmar eliminación</h2>
            <p className="text-slate-300 mb-6">
              ¿Estás seguro de que deseas eliminar este vehículo? Esta acción no se puede deshacer.
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
