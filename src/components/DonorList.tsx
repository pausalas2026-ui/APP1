'use client';

interface Donor {
  id: number;
  name: string;
  amount: number;
  message: string;
  date: Date;
}

interface DonorListProps {
  donors: Donor[];
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Hace un momento';
  if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} horas`;
  return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
}

export default function DonorList({ donors }: DonorListProps) {
  if (donors.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <p>Sé el primero en donar y aparecer aquí</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {donors.map((donor) => (
        <div 
          key={donor.id}
          className="flex items-start gap-4 p-4 bg-gradient-to-r from-indigo-50 to-pink-50 rounded-xl border border-indigo-100 hover:shadow-md transition-all"
        >
          <div className="flex-shrink-0">
            <div className="w-12 h-12 gradient-bg rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
              {donor.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-gray-800 truncate">{donor.name}</h4>
              <span className="flex-shrink-0 text-sm font-bold text-indigo-600">
                ${donor.amount.toLocaleString()}
              </span>
            </div>
            {donor.message && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{donor.message}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">{timeAgo(donor.date)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
