import React, { useRef, useState } from 'react';
import { Upload, Download } from 'lucide-react';

const InventoryTable = () => {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const inventory = [
    { id: 1, name: 'Amlodipine 5mg', dosage: '5mg', stock: 20, reqPrescription: true },
    { id: 2, name: 'Lisinopril 10mg', dosage: '10mg', stock: 45, reqPrescription: true },
    { id: 3, name: 'Ibuprofen 400mg', dosage: '400mg', stock: 120, reqPrescription: false },
    { id: 4, name: 'Metformin 500mg', dosage: '500mg', stock: 5, reqPrescription: true }
  ];

  const handleExportMedicines = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/medicines/export', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'medicines_inventory.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export medicines');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/api/admin/medicines/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Import failed');

      alert(`Import successful! ${result.message}`);
      // Usually you would trigger a fetch to refresh the inventory list here
    } catch (error) {
      console.error('Import error:', error);
      alert(`Failed to import medicines: ${error.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex justify-between items-center bg-beige-50 dark:bg-dark-50 p-4 rounded-xl border border-beige-200 dark:border-dark-200 shadow-sm transition-colors duration-300">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Medicine Inventory</h2>
        <div className="flex items-center gap-3">
          
          {/* Hidden file input */}
          <input 
             type="file" 
             ref={fileInputRef} 
             onChange={handleFileUpload} 
             accept=".xlsx, .xls"
             className="hidden" 
          />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-200 dark:border-slate-700 disabled:opacity-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Import Excel'}
          </button>
          
          <button 
             onClick={handleExportMedicines}
             className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </button>
        </div>
      </div>

      <div className="bg-beige-50 dark:bg-dark-50 rounded-xl border border-beige-200 dark:border-dark-200 overflow-hidden shadow-sm transition-colors duration-300">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-beige-100 dark:bg-dark-100 border-b border-beige-200 dark:border-dark-200 text-slate-500 dark:text-slate-400 transition-colors duration-300">
          <tr>
            <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Medicine Name</th>
            <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Dosage</th>
            <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Stock Level</th>
            <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Prescription Req.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-beige-100 dark:divide-dark-200">
          {inventory.map((item) => (
            <tr key={item.id} className="hover:bg-beige-100 dark:hover:bg-dark-100 transition-colors">
              <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{item.name}</td>
              <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{item.dosage}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${item.stock > 10 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'}`}>
                  {item.stock} units
                </span>
              </td>
              <td className="px-6 py-4">
                {item.reqPrescription ? (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800/50">
                    Required
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-800/50">
                    Not Required
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default InventoryTable;
