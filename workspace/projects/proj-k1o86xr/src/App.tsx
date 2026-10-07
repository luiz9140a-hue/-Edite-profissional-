import React, { useState } from 'react';

export default function App() {
  const [cart, setCart] = useState<Array<{ name: string; price: number }>>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (name: string, price: number) => {
    setCart(prev => [...prev, { name, price }]);
  };

  const total = cart.reduce((acc, item) => acc + item.price, 0);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans">
      <header className="border-b border-stone-800 p-6 flex justify-between items-center">
        <h1 className="text-2xl font-black text-orange-500">Burger House</h1>
        <button onClick={() => setIsCartOpen(true)} className="bg-orange-600 px-4 py-2 rounded-xl text-white font-bold">
          Carrinho ({cart.length})
        </button>
      </header>
      <main className="max-w-5xl mx-auto p-6">
        <h2 className="text-4xl font-extrabold mb-4">Burgers Artesanais no Fogo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-stone-900 p-6 rounded-2xl border border-stone-800">
            <h3 className="text-xl font-bold">Monster Bacon Burger</h3>
            <p className="text-stone-400 text-sm my-2">180g blend Angus, cheddar e bacon crocante.</p>
            <button onClick={() => addToCart('Monster Bacon', 38.90)} className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold">
              Pedir R$ 38,90
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}