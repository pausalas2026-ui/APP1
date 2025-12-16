'use client';

import { useState, useEffect } from 'react';
import ProgressBar from '@/components/ProgressBar';
import DonationForm from '@/components/DonationForm';
import ShareButtons from '@/components/ShareButtons';
import DonorList from '@/components/DonorList';

interface Donor {
  id: number;
  name: string;
  amount: number;
  message: string;
  date: Date;
}

// Configuración de la campaña
const CAMPAIGN = {
  title: "Ayúdanos a hacer la diferencia",
  description: "Únete a nuestra causa y ayuda a transformar vidas. Cada donación cuenta y nos acerca más a nuestra meta.",
  goal: 10000,
  organizationName: "Tu Organización",
  image: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&auto=format&fit=crop&q=60",
};

// Donantes de ejemplo
const initialDonors: Donor[] = [
  { id: 1, name: "María García", amount: 100, message: "¡Mucho éxito con la campaña!", date: new Date(Date.now() - 3600000) },
  { id: 2, name: "Carlos López", amount: 50, message: "Feliz de poder ayudar", date: new Date(Date.now() - 7200000) },
  { id: 3, name: "Ana Martínez", amount: 25, message: "", date: new Date(Date.now() - 86400000) },
];

export default function Home() {
  const [donors, setDonors] = useState<Donor[]>(initialDonors);
  const [totalRaised, setTotalRaised] = useState<number>(0);
  const [showThankYou, setShowThankYou] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const initial = initialDonors.reduce((sum, d) => sum + d.amount, 0);
    setTotalRaised(initial);
  }, []);

  const handleDonate = (amount: number, name: string, message: string) => {
    const newDonor: Donor = {
      id: Date.now(),
      name,
      amount,
      message,
      date: new Date(),
    };

    setDonors(prev => [newDonor, ...prev]);
    setTotalRaised(prev => prev + amount);
    setShowThankYou(true);

    setTimeout(() => setShowThankYou(false), 5000);
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-bg text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-float mb-6">
            <span className="text-6xl">💝</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {CAMPAIGN.title}
          </h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto">
            {CAMPAIGN.description}
          </p>
          <div className="mt-8 flex items-center justify-center gap-4 text-sm">
            <span className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              {donors.length} donantes
            </span>
            <span className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {CAMPAIGN.organizationName}
            </span>
          </div>
        </div>
      </section>

      {/* Thank You Modal */}
      {showThankYou && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center animate-float">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Gracias por tu donación!</h2>
            <p className="text-gray-600 mb-6">Tu generosidad nos ayuda a alcanzar nuestra meta.</p>
            <button 
              onClick={() => setShowThankYou(false)}
              className="px-6 py-2 gradient-bg text-white rounded-full font-semibold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Progress & Info */}
          <div className="space-y-8">
            {/* Progress Card */}
            <div className="glass-card rounded-2xl p-6 shadow-xl">
              <ProgressBar current={totalRaised} goal={CAMPAIGN.goal} />
            </div>

            {/* Campaign Image */}
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <img 
                src={CAMPAIGN.image}
                alt="Imagen de la campaña"
                className="w-full h-64 object-cover"
              />
            </div>

            {/* Share Section */}
            <div className="glass-card rounded-2xl p-6 shadow-xl">
              <ShareButtons 
                url={shareUrl}
                title={CAMPAIGN.title + " - " + CAMPAIGN.organizationName}
                description={CAMPAIGN.description}
              />
            </div>

            {/* Donor List */}
            <div className="glass-card rounded-2xl p-6 shadow-xl">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">❤️</span> Donantes recientes
              </h3>
              <DonorList donors={donors} />
            </div>
          </div>

          {/* Right Column - Donation Form */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="glass-card rounded-2xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Haz tu donación
              </h2>
              <DonationForm onDonate={handleDonate} />
            </div>

            {/* Trust Badges */}
            <div className="mt-6 flex justify-center gap-6 text-gray-400">
              <div className="flex flex-col items-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-xs mt-1">Seguro</span>
              </div>
              <div className="flex flex-col items-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="text-xs mt-1">Encriptado</span>
              </div>
              <div className="flex flex-col items-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-xs mt-1">Confiable</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="gradient-bg text-white py-8 px-4 mt-12">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-lg font-semibold mb-2">{CAMPAIGN.organizationName}</p>
          <p className="opacity-80 text-sm">
            Gracias por tu apoyo. Juntos podemos hacer la diferencia.
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <a href="#" className="opacity-80 hover:opacity-100 transition-opacity">Términos</a>
            <a href="#" className="opacity-80 hover:opacity-100 transition-opacity">Privacidad</a>
            <a href="#" className="opacity-80 hover:opacity-100 transition-opacity">Contacto</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
