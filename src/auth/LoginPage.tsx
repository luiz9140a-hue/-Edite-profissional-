import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Github, Chrome, LockKeyhole, Sparkles } from 'lucide-react';
import { useAuth } from './AuthContext';

function loginError(err: any): string {
  return err?.message || 'Não foi possível entrar. Verifique seus dados e tente novamente.';
}

export default function LoginPage() {
  const { user, loading, signInGoogle, signInGithub, signInEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const destination = (location.state as { from?: string } | null)?.from || '/';

  if (!loading && user) {
    navigate(destination, { replace: true });
    return null;
  }

  const run = async (action: () => Promise<void>) => {
    setBusy(true); setError('');
    try { await action(); navigate(destination, { replace: true }); }
    catch (err: any) { setError(loginError(err)); }
    finally { setBusy(false); }
  };

  const submit = (event: FormEvent) => { event.preventDefault(); return run(() => signInEmail(email, password)); };

  return <main className="min-h-screen bg-[#07090E] text-white flex items-center justify-center p-4"><section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl"><div className="text-center"><div className="mx-auto w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center"><Sparkles /></div><h1 className="text-2xl font-black mt-4">Entrar no Engrenagem AI</h1><p className="text-sm text-slate-400 mt-2">Modo local temporário — seus dados ficam neste navegador.</p></div><div className="grid grid-cols-2 gap-3 mt-7"><button disabled={busy} onClick={() => run(signInGoogle)} className="rounded-xl border border-slate-700 px-3 py-3 font-bold text-sm hover:bg-slate-800 flex items-center justify-center gap-2"><Chrome className="w-4 h-4" /> Google local</button><button disabled={busy} onClick={() => run(signInGithub)} className="rounded-xl border border-slate-700 px-3 py-3 font-bold text-sm hover:bg-slate-800 flex items-center justify-center gap-2"><Github className="w-4 h-4" /> GitHub local</button></div><div className="flex items-center gap-3 my-6 text-xs text-slate-500"><span className="h-px bg-slate-800 flex-1" />ou e-mail<span className="h-px bg-slate-800 flex-1" /></div><form onSubmit={submit} className="space-y-3"><input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail" className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 outline-none focus:border-blue-500" /><input required minLength={6} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha (mínimo 6 caracteres)" className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 outline-none focus:border-blue-500" /><button disabled={busy} className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-3 font-black flex items-center justify-center gap-2"><LockKeyhole className="w-4 h-4" />{busy ? 'Entrando...' : 'Entrar na conta'}</button></form>{error && <p className="mt-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 p-3 text-xs">{error}</p>}<p className="text-[11px] text-slate-500 mt-6 text-center">A autenticação externa poderá ser adicionada depois, sem depender dela para usar o BUD agora.</p></section></main>;
}
