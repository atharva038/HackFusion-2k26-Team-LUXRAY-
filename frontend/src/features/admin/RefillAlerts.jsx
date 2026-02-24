import React from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';

const RefillAlerts = () => {
  const alerts = [
    { id: 1, patient: 'James Wilson', medicine: 'Atorvastatin 20mg', daysLeft: 2, severity: 'high' },
    { id: 2, patient: 'Emma Thompson', medicine: 'Levothyroxine 50mcg', daysLeft: 5, severity: 'medium' },
    { id: 3, patient: 'William Davis', medicine: 'Amlodipine 5mg', daysLeft: 0, severity: 'critical' }
  ];

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <div key={alert.id} className={`bg-beige-50 dark:bg-dark-50 p-5 rounded-xl border-l-4 shadow-sm flex items-center justify-between transition-colors duration-300
          ${alert.severity === 'critical' ? 'border-l-red-500 border-y-red-100 border-r-red-100 dark:border-y-red-900/50 dark:border-r-red-900/50 bg-red-50/50 dark:bg-red-900/10' :
            alert.severity === 'high' ? 'border-l-amber-500 border-y-amber-100 border-r-amber-100 dark:border-y-amber-900/50 dark:border-r-amber-900/50' :
              'border-l-blue-500 border-y-beige-200 border-r-beige-200 dark:border-y-dark-200 dark:border-r-dark-200'}
        `}>
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 transition-colors duration-300
              ${alert.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' :
                alert.severity === 'high' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' :
                  'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'}`}>
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">{alert.patient}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">Running low on <strong className="text-slate-800 dark:text-slate-200">{alert.medicine}</strong></p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-sm font-bold ${alert.severity === 'critical' ? 'text-red-600 dark:text-red-400' :
                alert.severity === 'high' ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'
              }`}>
              {alert.daysLeft === 0 ? 'Out Today' : `${alert.daysLeft} days left`}
            </span>
            <button className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center transition-colors">
              Propose Refill <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RefillAlerts;
