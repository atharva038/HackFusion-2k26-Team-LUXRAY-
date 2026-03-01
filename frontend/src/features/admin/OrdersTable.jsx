import React from 'react';
import { Package, Clock, CheckCircle2, XCircle, Download } from 'lucide-react';

const OrdersTable = () => {
  const orders = [
    { id: 'ORD-8921', patient: 'Michael T.', medicine: 'Metformin 500mg', status: 'pending', time: '10 mins ago' },
    { id: 'ORD-8920', patient: 'Sarah J.', medicine: 'Ibuprofen 400mg', status: 'approved', time: '25 mins ago' },
    { id: 'ORD-8919', patient: 'Robert W.', medicine: 'Oxycodone 10mg', status: 'rejected', time: '1 hour ago' },
  ];

  const handleExportOrders = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/orders/export', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'orders.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export orders');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="flex items-center text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-full text-xs font-medium border border-amber-100 dark:border-amber-800"><Clock className="w-3 h-3 mr-1" /> Pending AI Review</span>;
      case 'approved':
        return <span className="flex items-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2.5 py-1 rounded-full text-xs font-medium border border-green-100 dark:border-green-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved & Created</span>;
      case 'rejected':
        return <span className="flex items-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2.5 py-1 rounded-full text-xs font-medium border border-red-100 dark:border-red-800"><XCircle className="w-3 h-3 mr-1" /> Prescription Denied</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 shadow-sm p-4 bg-beige-50 dark:bg-dark-50 rounded-xl border border-beige-200 dark:border-dark-200 transition-colors duration-300">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Recent Orders</h2>
        <button 
           onClick={handleExportOrders}
           className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Excel
        </button>
      </div>
      
      <div className="space-y-4">
        {orders.map((order) => (
        <div key={order.id} className="bg-beige-50 dark:bg-dark-50 p-5 rounded-xl border border-beige-200 dark:border-dark-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-beige-100 dark:bg-dark-100 flex items-center justify-center mr-4 transition-colors duration-300">
              <Package className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">{order.id}</h3>
                <span className="text-xs text-slate-400 dark:text-slate-500">&bull; {order.time}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">{order.patient} &mdash; <strong className="text-slate-800 dark:text-slate-200">{order.medicine}</strong></p>
            </div>
          </div>
          <div>
            {getStatusBadge(order.status)}
          </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersTable;
