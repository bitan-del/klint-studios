import React from 'react';
import { KLogo } from '../shared/KLogo';

export const LandingPage: React.FC = () => {
  return (
    <div className="bg-zinc-950 text-zinc-300 min-h-screen font-sans">
      <header className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KLogo size={24} className="text-emerald-400" />
          <h1 className="text-lg font-bold text-zinc-100">Klint Studios</h1>
        </div>
        <div>
          <a href="./login.html" className="text-sm font-semibold text-zinc-300 hover:text-white mr-4">Sign In</a>
          <a href="./signup.html" className="text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md transition-colors">Sign Up</a>
        </div>
      </header>
      <main className="flex flex-col items-center justify-center text-center p-8 pt-24">
        <h2 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-400">
          The End of the Photoshoot.
        </h2>
        <p className="max-w-2xl mt-4 text-lg text-zinc-400">
          Generate an infinite variety of world-class, commercially-ready visuals—on-model, on-product, and on-demand—at a fraction of the cost and time.
        </p>
        <div className="mt-8 flex gap-4">
          <a href="./signup.html" className="text-base font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg transition-colors">
            Get Started for Free
          </a>
          <a href="./index.html" className="text-base font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-6 py-3 rounded-lg transition-colors border border-zinc-700">
            Open Studio
          </a>
        </div>
      </main>
    </div>
  );
};
