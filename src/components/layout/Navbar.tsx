export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full p-6 flex justify-between items-center z-50">
      <div className="text-2xl font-bold tracking-tight">ENGRENAGEM<span className="text-blue-500">AI</span></div>
      <div className="space-x-4">
        <button className="text-sm" onClick={() => window.location.href = '#how-it-works'}>Ver como funciona</button>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm" onClick={() => window.location.href = '/workspace'}>Construir com BUD</button>
      </div>
    </nav>
  );
}
