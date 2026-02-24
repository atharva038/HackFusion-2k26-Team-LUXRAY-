import React from 'react';

const InventoryTable = () => {
  const inventory = [
    { id: 1, name: 'Amlodipine 5mg', dosage: '5mg', stock: 20, reqPrescription: true },
    { id: 2, name: 'Lisinopril 10mg', dosage: '10mg', stock: 45, reqPrescription: true },
    { id: 3, name: 'Ibuprofen 400mg', dosage: '400mg', stock: 120, reqPrescription: false },
    { id: 4, name: 'Metformin 500mg', dosage: '500mg', stock: 5, reqPrescription: true }
  ];

  return (
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
  );
};

export default InventoryTable;
