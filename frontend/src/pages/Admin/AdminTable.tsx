import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit2, Save, X, Search } from 'lucide-react';
import { BilingualText } from '../../components/BilingualText';

interface AdminContext {
  grievances: any[];
  onOverride: (id: number, newDept: string) => void;
}

const DEPARTMENTS = ['Roads', 'Water', 'Garbage', 'Electricity', 'Traffic'];

export function AdminTable() {
  const { grievances, onOverride } = useOutletContext<AdminContext>();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleEditClick = (id: number, currentDept: string) => {
    setEditingId(id);
    setSelectedDept(currentDept);
  };

  const handleSave = (id: number) => {
    onOverride(id, selectedDept);
    setEditingId(null);
  };

  const filteredData = grievances.map((g, i) => ({...g, id: i})).filter(g => 
    (g.original_text || g.visual_issue || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-headline-md font-bold text-on-surface"><BilingualText text="The Override Table" /></h1>
          <p className="text-on-surface-variant"><BilingualText text="Global view of all issues. Manually reassign misclassified items here." /></p>
        </div>
        
        <div className="flex gap-4 items-center">
          <button 
            onClick={async () => {
              const res = await fetch('http://localhost:8000/grievances/run-sla-escalation', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
              });
              const data = await res.json();
              if (res.ok) {
                alert(data.message);
                window.location.reload(); // Quick refresh to show new severities
              } else {
                alert(data.detail || "Error running SLA check");
              }
            }}
            className="px-4 py-2 bg-warning/10 text-warning border border-warning/30 rounded-xl font-bold text-sm hover:bg-warning/20 transition-colors"
          >
            <BilingualText text="Run SLA Check (Batch Escalate)" />
          </button>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
            <input 
              type="text" 
              placeholder="Search issues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary w-64"
            />
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden border border-outline-variant/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container/50 text-on-surface-variant text-sm uppercase tracking-wider">
                <th className="p-4 font-bold"><BilingualText text="ID" /></th>
                <th className="p-4 font-bold"><BilingualText text="Description" /></th>
                <th className="p-4 font-bold"><BilingualText text="AI Tag" /></th>
                <th className="p-4 font-bold"><BilingualText text="Severity" /></th>
                <th className="p-4 font-bold"><BilingualText text="Status" /></th>
                <th className="p-4 font-bold"><BilingualText text="Department" /></th>
                <th className="p-4 font-bold text-right"><BilingualText text="Actions" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-on-surface-variant"><BilingualText text="No grievances found." /></td>
                </tr>
              ) : filteredData.map((g, i) => (
                <motion.tr 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  key={g.id} className="hover:bg-surface-container-lowest/50 transition-colors group"
                >
                  <td className="p-4 font-mono text-sm text-on-surface-variant">#{g.id}</td>
                  <td className="p-4">
                    <p className="line-clamp-1 max-w-xs">{g.original_text || g.translated_text || 'No description'}</p>
                  </td>
                  <td className="p-4 text-primary font-medium">{g.visual_issue || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      g.severity === 'High' ? 'bg-error/10 text-error' : 
                      g.severity === 'Medium' ? 'bg-warning/10 text-warning' : 'bg-surface-container text-on-surface-variant'
                    }`}>
                      {g.severity || 'Low'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-bold text-on-surface-variant">{g.status || 'Pending'}</span>
                  </td>
                  <td className="p-4">
                    {editingId === g.id ? (
                      <select 
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        className="bg-white border border-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-1"
                      >
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    ) : (
                      <span className="font-bold">{g.department}</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {editingId === g.id ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingId(null)} className="p-1 text-on-surface-variant hover:text-error transition-colors"><X size={18} /></button>
                        <button onClick={() => handleSave(g.id)} className="p-1 text-primary hover:text-primary-dark transition-colors"><Save size={18} /></button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleEditClick(g.id, g.department)}
                        className="p-2 text-on-surface-variant opacity-0 group-hover:opacity-100 hover:text-primary transition-all bg-surface-container-high rounded-lg"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
