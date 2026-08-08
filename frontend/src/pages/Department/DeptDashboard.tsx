import { useOutletContext, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ChevronRight, Clock, Wrench, CheckCircle, ExternalLink, Activity } from 'lucide-react';
import { BilingualText } from '../../components/BilingualText';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface DeptContext {
  grievances: any[];
  onUpdateStatus: (id: number, status: string, proofUrl?: string) => void;
}

const KanbanColumn = ({ title, items, icon: Icon, colorClass, navigate }: any) => (
  <div className="flex flex-col bg-surface-container-lowest rounded-3xl p-4 border border-outline-variant/30 min-h-[600px]">
    <div className="flex items-center justify-between mb-4 px-2">
      <h3 className="font-bold flex items-center gap-2 text-on-surface">
        <Icon className={colorClass} size={20} />
        {typeof title === 'string' ? <BilingualText text={title} /> : title}
      </h3>
      <span className="bg-surface-container-high px-2 py-1 rounded-full text-xs font-bold text-on-surface-variant">
        {items.length}
      </span>
    </div>
    
    <div className="flex flex-col gap-3">
      {items.map((item: any) => (
        <motion.div 
          key={item.id}
          whileHover={{ scale: 1.02, y: -2 }}
          onClick={() => navigate(`/department/issue/${item.id}`)}
          className="bg-white/80 dark:bg-surface-container/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-outline-variant/50 cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-2">
            <span className={`text-xs px-2 py-1 rounded-md font-bold bg-error/10 text-error`}>
              {item.severity}
            </span>
            <span className="text-xs text-on-surface-variant">ID: #{item.id}</span>
          </div>
          <p className="font-bold text-on-surface text-sm mb-3 line-clamp-2">
            {item.original_text || item.translated_text || item.visual_issue}
          </p>
          <div className="flex items-center justify-between mt-auto">
            {item.latitude != null && item.longitude != null ? (
              <a
                href={`https://maps.google.com/?q=${item.latitude},${item.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs flex items-center gap-1 text-primary hover:underline font-medium py-1 px-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                title="Navigate in Google Maps"
              >
                <MapPin size={12} className="text-primary" />
                {Number(item.latitude).toFixed(3)}, {Number(item.longitude).toFixed(3)}
                <ExternalLink size={10} className="opacity-70" />
              </a>
            ) : (
              <span className="text-xs flex items-center gap-1 text-on-surface-variant">
                <MapPin size={12} />
                Location N/A
              </span>
            )}
            <ChevronRight size={16} className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </motion.div>
      ))}
      {items.length === 0 && (
        <div className="text-center p-8 text-on-surface-variant opacity-50 border-2 border-dashed border-outline-variant/30 rounded-2xl">
          <BilingualText text="No issues" />
        </div>
      )}
    </div>
  </div>
);

export function DeptDashboard() {
  const { grievances } = useOutletContext<DeptContext>();
  const navigate = useNavigate();

  const boardData = grievances.map(g => ({
    ...g,
    status: g.status || 'Pending'
  }));

  const pending = boardData.filter(g => g.status === 'Pending' || g.status === 'Open');
  const inProgress = boardData.filter(g => g.status === 'In-Progress');
  const resolved = boardData.filter(g => g.status === 'Resolved');

  const total = boardData.length;
  const progressData = [
    { name: 'Resolved', value: resolved.length, color: '#38A169' },
    { name: 'In Progress', value: inProgress.length, color: '#D69E2E' },
    { name: 'Pending', value: pending.length, color: '#718096' }
  ];
  
  const resolvedPercent = total > 0 ? Math.round((resolved.length / total) * 100) : 0;

  return (
    <div className="h-full space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-headline-md font-bold text-on-surface mb-2"><BilingualText text="Workflow Board" /></h1>
          <p className="text-on-surface-variant"><BilingualText text="Manage and resolve active issues assigned to your department." /></p>
        </div>
      </div>

      {/* Progress Analytics Widget */}
      {total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 glass-panel p-6 rounded-[2rem] flex flex-col items-center justify-center relative">
            <h3 className="absolute top-6 left-6 font-bold text-on-surface flex items-center gap-2"><Activity size={18} className="text-primary"/> <BilingualText text="Task Progress" /></h3>
            <div className="h-40 w-full mt-8">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={progressData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {progressData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-10">
              <span className="text-2xl font-bold text-on-surface">{resolvedPercent}%</span>
            </div>
          </div>
          
          <div className="col-span-1 md:col-span-2 grid grid-cols-3 gap-4">
            <div className="glass-panel p-6 rounded-[2rem] flex flex-col justify-center border-l-4 border-[#38A169]">
              <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">Resolved</p>
              <h2 className="text-3xl font-bold text-[#38A169]">{resolved.length}</h2>
            </div>
            <div className="glass-panel p-6 rounded-[2rem] flex flex-col justify-center border-l-4 border-[#D69E2E]">
              <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">In Progress</p>
              <h2 className="text-3xl font-bold text-[#D69E2E]">{inProgress.length}</h2>
            </div>
            <div className="glass-panel p-6 rounded-[2rem] flex flex-col justify-center border-l-4 border-[#718096]">
              <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">Pending</p>
              <h2 className="text-3xl font-bold text-[#718096]">{pending.length}</h2>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KanbanColumn title="Pending Assignment" items={pending} icon={Clock} colorClass="text-on-surface-variant" navigate={navigate} />
        <KanbanColumn title="In Progress" items={inProgress} icon={Wrench} colorClass="text-warning" navigate={navigate} />
        <KanbanColumn title="Resolved" items={resolved} icon={CheckCircle} colorClass="text-secondary" navigate={navigate} />
      </div>
    </div>
  );
}
