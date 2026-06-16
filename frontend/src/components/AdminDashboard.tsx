import React, { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface Grievance {
  latitude: number;
  longitude: number;
  severity: string;
  department: string;
}

interface AdminDashboardProps {
  grievances: Grievance[];
  userDept: string | null;
  onFilterChange: (dept: string, severity: string) => void;
}

export function AdminDashboard({ grievances, userDept, onFilterChange }: AdminDashboardProps) {
  const [deptFilter, setDeptFilter] = React.useState(userDept || 'All');
  const [sevFilter, setSevFilter] = React.useState('All');

  // Notify parent on filter change
  React.useEffect(() => {
    onFilterChange(deptFilter, sevFilter);
  }, [deptFilter, sevFilter, onFilterChange]);

  const { deptCounts, sevCounts, total, resolved } = useMemo(() => {
    const dCounts: Record<string, number> = { 'Roads': 0, 'Water': 0, 'Sanitation': 0, 'Electricity': 0 };
    const sCounts: Record<string, number> = { 'Critical': 0, 'High': 0, 'Medium': 0, 'Low': 0 };
    
    // In a real app we'd have a status field. We'll fake 'resolved' for stat cards.
    let res = 0;

    grievances.forEach(g => {
      if (g.department in dCounts) dCounts[g.department]++;
      else dCounts[g.department] = 1;

      if (g.severity in sCounts) sCounts[g.severity]++;
      else sCounts[g.severity] = 1;
      
      // Random fake logic for "resolved" to populate stat cards since it's not in the data model yet
      if (Math.random() > 0.7) res++;
    });

    return { deptCounts: dCounts, sevCounts: sCounts, total: grievances.length, resolved: res };
  }, [grievances]);

  const pieData = {
    labels: Object.keys(deptCounts),
    datasets: [{
      data: Object.values(deptCounts),
      backgroundColor: ['#0058bc', '#006a66', '#7f5ddf', '#ba1a1a'],
      borderWidth: 0,
    }]
  };

  const barData = {
    labels: Object.keys(sevCounts),
    datasets: [{
      data: Object.values(sevCounts),
      backgroundColor: ['#ba1a1a', '#f97316', '#eab308', '#0058bc'],
      borderRadius: 6,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' as const, labels: { color: '#414755', font: { family: 'Inter' } } }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1, color: '#717786' }, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { ticks: { color: '#717786' }, grid: { display: false } }
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Stat Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-[2rem] hover-lift relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-primary" style={{ fontFamily: 'Material Symbols Outlined' }}>campaign</span>
          </div>
          <p className="text-label-lg font-bold text-primary mb-4 uppercase tracking-wide">Total Grievances</p>
          <div className="flex items-baseline gap-2">
            <span className="text-headline-xl font-extrabold text-on-surface">{total}</span>
          </div>
          <div className="mt-6 w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-secondary w-full"></div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-[2rem] hover-lift relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-secondary" style={{ fontFamily: 'Material Symbols Outlined' }}>verified</span>
          </div>
          <p className="text-label-lg font-bold text-secondary mb-4 uppercase tracking-wide">Resolved (Est)</p>
          <div className="flex items-baseline gap-2">
            <span className="text-headline-xl font-extrabold text-on-surface">{resolved}</span>
          </div>
          <div className="mt-6 w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-secondary" style={{ width: `${total ? (resolved/total)*100 : 0}%` }}></div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-[2rem] flex flex-col justify-between hover-lift relative overflow-hidden">
          <div>
            <h3 className="font-bold text-label-lg text-on-surface-variant mb-2">Quick Filters</h3>
            <div className="flex gap-2">
              <select 
                value={deptFilter} 
                onChange={e => setDeptFilter(e.target.value)}
                disabled={!!userDept}
                className="w-1/2 text-sm p-2 bg-surface-container-highest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary disabled:opacity-50"
              >
                <option value="All">All Depts</option>
                <option value="Roads">Roads</option>
                <option value="Water">Water</option>
                <option value="Sanitation">Sanitation</option>
                <option value="Electricity">Electricity</option>
              </select>
              <select 
                value={sevFilter} 
                onChange={e => setSevFilter(e.target.value)}
                className="w-1/2 text-sm p-2 bg-surface-container-highest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary"
              >
                <option value="All">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
          <div className="mt-4 text-xs text-on-surface-variant opacity-70">
            Applying these filters updates the map below in real-time.
          </div>
        </motion.div>
      </section>

      {/* Analytics Charts */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-[2rem]">
          <h3 className="font-headline-md text-headline-md mb-4">Department Breakdown</h3>
          <div className="h-64">
            <Pie data={pieData} options={chartOptions} />
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-[2rem]">
          <h3 className="font-headline-md text-headline-md mb-4">Severity Distribution</h3>
          <div className="h-64">
            <Bar data={barData} options={barOptions} />
          </div>
        </motion.div>
      </section>
    </motion.div>
  );
}
