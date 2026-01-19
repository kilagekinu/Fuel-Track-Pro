
import React from 'react';
import { Tank } from '../types';
import { FUEL_GRADIENTS } from '../constants';

interface StockVisualizerProps {
  tanks: Tank[];
}

const StockVisualizer: React.FC<StockVisualizerProps> = ({ tanks }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {tanks.map((tank) => {
        const percentage = (tank.currentVolume / tank.capacity) * 100;
        return (
          <div key={tank.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between mb-4">
              <h4 className="font-bold text-slate-700">{tank.name}</h4>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{tank.fuelType}</span>
            </div>
            <div className="relative h-48 w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
              <div 
                className={`absolute bottom-0 w-full bg-gradient-to-t ${FUEL_GRADIENTS[tank.fuelType]} transition-all duration-1000 ease-in-out`}
                style={{ height: `${percentage}%` }}
              >
                <div className="absolute top-2 w-full text-center text-white text-[10px] font-bold opacity-30">
                  WAVE_PATTERN_SVG_HERE
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-black text-slate-800 drop-shadow-sm">
                  {percentage.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="mt-4 flex justify-between text-sm">
              <span className="text-slate-500">Current: <b className="text-slate-800">{tank.currentVolume.toLocaleString()} L</b></span>
              <span className="text-slate-500">Cap: {tank.capacity.toLocaleString()} L</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StockVisualizer;
