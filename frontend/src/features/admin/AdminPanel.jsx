import React, { useState } from 'react';
import InventoryTable from './InventoryTable';
import OrdersTable from './OrdersTable';
import RefillAlerts from './RefillAlerts';
import TraceSummary from './TraceSummary';
import { Database, ShoppingCart, Bell, Activity } from 'lucide-react';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('inventory');

  const tabs = [
    { id: 'inventory', label: 'Inventory', icon: Database },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'alerts', label: 'Refill Alerts', icon: Bell },
    { id: 'trace', label: 'AI Trace', icon: Activity }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'inventory': return <InventoryTable />;
      case 'orders': return <OrdersTable />;
      case 'alerts': return <RefillAlerts />;
      case 'trace': return <TraceSummary />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-beige-100 dark:bg-dark-100 transition-colors duration-300 relative">
      {/* Header */}
      <div className="px-6 py-5 bg-beige-50 dark:bg-dark-50 border-b border-beige-200 dark:border-dark-200 transition-colors duration-300">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">System Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Live monitoring & administrative controls</p>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4 bg-beige-50 dark:bg-dark-50 border-b border-beige-200 dark:border-dark-200 transition-colors duration-300">
        <div className="flex space-x-6">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center pb-3 border-b-2 text-sm font-medium transition-all ${isActive
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-beige-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-dark-300'
                  }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminPanel;
