'use client';

interface ProgressBarProps {
  current: number;
  goal: number;
}

export default function ProgressBar({ current, goal }: ProgressBarProps) {
  const percentage = Math.min((current / goal) * 100, 100);
  
  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Recaudado: <span className="text-indigo-600 font-bold">${current.toLocaleString()}</span>
        </span>
        <span className="text-sm font-medium text-gray-700">
          Meta: <span className="text-pink-600 font-bold">${goal.toLocaleString()}</span>
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-1000 ease-out gradient-bg"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-center mt-2 text-lg font-semibold text-gray-800">
        {percentage.toFixed(1)}% completado
      </p>
    </div>
  );
}
