import { useOutletContext, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ChevronRight, Clock, Wrench, CheckCircle } from 'lucide-react';
import { BilingualText } from '../../components/BilingualText';

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
            <span className="text-xs flex items-center gap-1 text-on-surface-variant">
              <MapPin size={12} />
              {item.latitude.toFixed(3)}, {item.longitude.toFixed(3)}
            </span>
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

  const pending = boardData.filter(g => g.status === 'Pending');
  const inProgress = boardData.filter(g => g.status === 'In-Progress');
  const resolved = boardData.filter(g => g.status === 'Resolved');



  return (
    <div className="h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-headline-md font-bold text-on-surface mb-2"><BilingualText text="Workflow Board" /></h1>
        <p className="text-on-surface-variant"><BilingualText text="Manage and resolve active issues assigned to your department." /></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KanbanColumn title="Pending Assignment" items={pending} icon={Clock} colorClass="text-on-surface-variant" navigate={navigate} />
        <KanbanColumn title="In Progress" items={inProgress} icon={Wrench} colorClass="text-warning" navigate={navigate} />
        <KanbanColumn title="Resolved" items={resolved} icon={CheckCircle} colorClass="text-secondary" navigate={navigate} />
      </div>
    </div>
  );
}
