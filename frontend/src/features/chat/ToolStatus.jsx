import React from 'react';
import { Search, CheckCircle2, AlertTriangle, PackageCheck, Loader2 } from 'lucide-react';

const ToolStatus = ({ toolCall }) => {
  const { name, status, result } = toolCall;

  const getToolConfig = () => {
    if (status === 'fetching') {
      return {
        icon: Loader2,
        iconClass: 'text-blue-500 dark:text-blue-400 animate-spin',
        bgClass: 'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800',
        textClass: 'text-blue-700 dark:text-blue-300',
        label: `Executing: ${name}...`
      };
    }

    if (name === 'check_inventory') {
      return {
        icon: Search,
        iconClass: 'text-slate-500 dark:text-slate-400',
        bgClass: 'bg-beige-100 dark:bg-dark-100 border-beige-200 dark:border-dark-200',
        textClass: 'text-slate-700 dark:text-slate-300',
        label: 'Tool Call: check_inventory',
        resultClass: 'text-green-600 dark:text-green-400'
      };
    }

    if (name === 'validate_prescription') {
      return {
        icon: status === 'warning' ? AlertTriangle : CheckCircle2,
        iconClass: status === 'warning' ? 'text-amber-500 dark:text-amber-400' : 'text-green-500 dark:text-green-400',
        bgClass: status === 'warning' ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800' : 'bg-green-50 dark:bg-green-900/30 border-green-100 dark:border-green-800',
        textClass: status === 'warning' ? 'text-amber-700 dark:text-amber-300' : 'text-green-700 dark:text-green-300',
        label: 'Tool Call: validate_prescription',
        resultClass: status === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'
      };
    }

    return {
      icon: PackageCheck,
      iconClass: 'text-green-500 dark:text-green-400',
      bgClass: 'bg-beige-100 dark:bg-dark-100 border-beige-200 dark:border-dark-200',
      textClass: 'text-slate-700 dark:text-slate-300',
      label: `Tool Call: ${name}`,
      resultClass: 'text-slate-600 dark:text-slate-400'
    };
  };

  const config = getToolConfig();
  const Icon = config.icon;

  return (
    <div className={`flex flex-col p-3 rounded-lg border ${config.bgClass} text-xs w-full max-w-sm transition-colors duration-300`}>
      <div className="flex items-center font-medium mb-1">
        <Icon className={`w-3.5 h-3.5 mr-2 ${config.iconClass}`} />
        <span className={config.textClass}>{config.label}</span>
      </div>
      {result && (
        <div className={`ml-5 mt-0.5 font-medium ${config.resultClass}`}>
          Result: {result}
        </div>
      )}
    </div>
  );
};

export default ToolStatus;
