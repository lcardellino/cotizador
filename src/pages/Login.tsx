import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User } from "lucide-react";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "lucas" && password === "asd123") {
      onLogin();
      navigate("/");
    } else {
      setError("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md bg-[#161920] border border-[#222631] rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 text-center border-b border-[#222631] bg-[#1a1d24]">
          <div className="bg-white w-24 h-24 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg">
            <img src="/logo.png" alt="Grupo Fono Bus" className="max-h-16 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Bienvenido</h1>
          <p className="text-slate-400">Ingresa tus credenciales para acceder</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 block">Usuario</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0f1117] border border-[#222631] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#2dd4bf] focus:border-transparent transition-all"
                  placeholder="Ingresa tu usuario"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 block">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0f1117] border border-[#222631] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#2dd4bf] focus:border-transparent transition-all"
                  placeholder="Ingresa tu contraseña"
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full bg-[#2dd4bf] hover:bg-[#14b8a6] text-[#0f1117] font-bold py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
            >
              Iniciar Sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
