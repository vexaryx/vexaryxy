import React, { useState } from 'react';
import { useAuth, COUNTRIES, CountryInfo } from '../auth';
import { CountrySelector } from '../../vyx/CountrySelector';
import { ArrowLeft, Lock, Mail, User, Phone, CheckCircle2, AlertCircle, Loader2, KeyRound } from 'lucide-react';

export const LoginPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { login, register, user, isAdmin, logout } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(COUNTRIES[0]); // Spain default or Argentina
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setError('Por favor ingresa tu correo electrónico y contraseña');
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      setSuccessMsg(`¡Bienvenido de nuevo, ${loggedUser.name}!`);
      setTimeout(() => {
        if (loggedUser.role === 'admin') {
          onNavigate('admin');
        } else {
          onNavigate('dash');
        }
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!name.trim() || !email.trim() || !password || !phone.trim()) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const newUser = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        countryCode: selectedCountry.code,
        countryName: selectedCountry.name,
        dialCode: selectedCountry.dialCode
      });
      setSuccessMsg(`¡Cuenta creada con éxito! Bienvenido a VEXARYX, ${newUser.name}.`);
      setTimeout(() => {
        onNavigate('dash');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Error al registrar la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-slate-100 flex flex-col justify-between selection:bg-[#ff5500] selection:text-white">
      {/* Top Header */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <button
          onClick={() => onNavigate('dash')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la Plataforma VEXARYX</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#ff5500] flex items-center justify-center font-bold text-white text-[11px]">
            VX
          </div>
          <span className="font-extrabold text-sm text-white tracking-wider">VEXARYX</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Active User Card if already authenticated */}
          {user && (
            <div className="mb-6 p-5 rounded-2xl bg-[#0f0f16] border border-slate-800 text-center space-y-3 shadow-xl">
              <div className="w-12 h-12 rounded-full bg-[#ff5500]/20 border border-[#ff5500]/40 text-[#ff5500] flex items-center justify-center mx-auto">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{user.name}</h3>
                <p className="text-xs text-slate-400 font-mono">{user.email}</p>
                <div className="mt-1 flex items-center justify-center gap-2 text-xs">
                  <span className="text-[11px] font-mono text-[#ff7722]">{user.dialCode} {user.phone}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-[11px] font-mono text-slate-400">{user.countryName}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                {isAdmin ? (
                  <button
                    onClick={() => onNavigate('admin')}
                    className="w-full py-2.5 rounded-xl bg-[#ff5500] hover:bg-[#ff6a1a] text-white text-xs font-bold transition-colors shadow-lg shadow-orange-500/20"
                  >
                    Ingresar al Panel de Administrador
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate('dash')}
                    className="w-full py-2.5 rounded-xl bg-[#ff5500] hover:bg-[#ff6a1a] text-white text-xs font-bold transition-colors"
                  >
                    Ir al Dashboard Principal
                  </button>
                )}
                <button
                  onClick={logout}
                  className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-400 text-xs transition-colors"
                >
                  Cerrar Sesión Actual
                </button>
              </div>
            </div>
          )}

          {/* Form Container */}
          <div className="rounded-2xl bg-[#0e0e14] border border-slate-800/90 shadow-2xl overflow-hidden p-6 sm:p-8">
            {/* Mode Switcher Tabs */}
            <div className="flex border-b border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 pb-3 text-xs font-bold transition-all relative ${
                  mode === 'login' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span>Iniciar Sesión</span>
                {mode === 'login' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff5500] shadow-[0_0_8px_#ff5500]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 pb-3 text-xs font-bold transition-all relative ${
                  mode === 'register' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span>Registrar Cuenta</span>
                {mode === 'register' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff5500] shadow-[0_0_8px_#ff5500]" />
                )}
              </button>
            </div>

            {/* Notification messages */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/80 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* ================= LOGIN FORM ================= */}
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="tu.correo@ejemplo.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-[#14141c] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#ff5500] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">Contraseña</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-[#14141c] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#ff5500] transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#ff5500] hover:bg-[#ff6a1a] disabled:opacity-50 text-white text-xs font-bold tracking-wide transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  <span>Entrar a VEXARYX</span>
                </button>

                {/* Helpful Admin Access Tip Box */}
                <div className="mt-6 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#ff5500]" />
                    <span>Acceso Oficial de Administrador</span>
                  </div>
                  <p>
                    Correo: <code className="text-orange-300 font-mono font-medium">fedezyljx@gmail.com</code>
                  </p>
                  <p>
                    Clave Inicial: <code className="text-slate-300 font-mono">Vexaryx2025!Admin#</code>
                  </p>
                </div>
              </form>
            ) : (
              /* ================= REGISTER FORM ================= */
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Ej. Lucas Fernández"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-[#14141c] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#ff5500] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="correo@ejemplo.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-[#14141c] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#ff5500] transition-colors"
                    />
                  </div>
                </div>

                {/* Country and Phone input */}
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    País y Número de Teléfono
                  </label>
                  <div className="flex gap-2">
                    <CountrySelector
                      selectedCountry={selectedCountry}
                      onSelect={country => setSelectedCountry(country)}
                    />
                    <div className="relative flex-1">
                      <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3.5" />
                      <input
                        type="tel"
                        required
                        placeholder="Ej. 11 4567 8900"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full pl-8 pr-3 py-2.5 bg-[#14141c] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#ff5500] transition-colors font-mono"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    País seleccionado: {selectedCountry.name} ({selectedCountry.dialCode})
                  </span>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    Contraseña Segura
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-[#14141c] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#ff5500] transition-colors"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-normal">
                  Al registrarte, accedes como Miembro VEXARYX con privilegios de usuario estándar verificados por servidor.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#ff5500] hover:bg-[#ff6a1a] disabled:opacity-50 text-white text-xs font-bold tracking-wide transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Registrar Mi Cuenta</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-xs text-slate-500 font-mono border-t border-slate-900">
        VEXARYX Security · Protocolo de Autenticación Criptográfica Verificada
      </div>
    </div>
  );
};
