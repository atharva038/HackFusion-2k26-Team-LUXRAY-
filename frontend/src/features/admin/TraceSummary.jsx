import React from 'react';
import { Network, ChevronRight } from 'lucide-react';

const TraceSummary = () => {
  const traces = [
    {
      id: 'TRC-1092',
      query: 'I need to refill my Amlodipine 5mg prescription.',
      extracted: 'Amlodipine 5mg',
      tools: ['check_inventory', 'validate_prescription'],
      decision: 'Approved & processing',
      time: 'Just now',
      status: 'success'
    },
    {
      id: 'TRC-1091',
      query: 'Can you give me something for my headache?',
      extracted: 'General inquiry / Painkiller',
      tools: ['check_OTC_recommendations'],
      decision: 'Recommended Ibuprofen 400mg OTC',
      time: '12 mins ago',
      status: 'neutral'
    },
    {
      id: 'TRC-1090',
      query: 'I want a refill of Oxycodone 10mg.',
      extracted: 'Oxycodone 10mg (Controlled)',
      tools: ['validate_prescription', 'check_controlled_substance_policy'],
      decision: 'Rejected - Requires direct physician authorization',
      time: '1 hour ago',
      status: 'failed'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-lg p-4 flex items-start transition-colors duration-300">
        <Network className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200">Live AI Reasoning Trace</h4>
          <p className="text-xs text-blue-700 dark:text-blue-300/80 mt-1">
            Monitoring the autonomous pharmacist's decision-making process, tool execution, and safety validations in real-time.
          </p>
        </div>
      </div>

      <div className="relative border-l-2 border-beige-200 dark:border-dark-200 ml-4 space-y-8 transition-colors duration-300">
        {traces.map((trace) => (
          <div key={trace.id} className="relative pl-6">
            {/* Timeline Dot */}
            <span className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-beige-100 dark:border-dark-100
              ${trace.status === 'success' ? 'bg-green-500' :
                trace.status === 'failed' ? 'bg-red-500' : 'bg-slate-400 dark:bg-slate-500'}`}>
            </span>

            <div className="bg-beige-50 dark:bg-dark-50 border border-beige-200 dark:border-dark-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-beige-100 dark:bg-dark-100 px-2 py-0.5 rounded transition-colors duration-300">{trace.id}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">{trace.time}</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-1">User Query</div>
                  <div className="text-sm text-slate-800 dark:text-slate-200 italic">"{trace.query}"</div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-beige-100 dark:border-dark-200 transition-colors duration-300">
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-1">Entity Extraction</div>
                    <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 inline-block px-2 py-1 rounded transition-colors duration-300">
                      {trace.extracted}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-1">Tools Executed</div>
                    <div className="flex flex-wrap gap-1">
                      {trace.tools.map(tool => (
                        <span key={tool} className="text-[10px] bg-beige-100 dark:bg-dark-100 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-beige-200 dark:border-dark-200 transition-colors duration-300">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-1">Final Decision</div>
                  <div className={`text-sm font-medium flex items-center
                    ${trace.status === 'success' ? 'text-green-700 dark:text-green-400' :
                      trace.status === 'failed' ? 'text-red-700 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    <ChevronRight className="w-4 h-4 mr-1" />
                    {trace.decision}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TraceSummary;
