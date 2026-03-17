import { Users } from "lucide-react";

export default function Clientes() {
  return (
    <div className="text-white space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-8 h-8 text-blue-500" />
        <h1 className="text-2xl font-bold">Clientes</h1>
      </div>
      <div className="bg-[#161920] p-6 rounded-2xl border border-[#222631]">
        <p className="text-slate-400">Módulo de gestión de clientes en desarrollo.</p>
      </div>
    </div>
  );
}
