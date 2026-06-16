import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AdminContext {
  grievances: any[];
}

export function AdminAnalytics() {
  const { grievances } = useOutletContext<AdminContext>();

  // Fake data if empty
  const data = grievances.length > 0 ? grievances : [
    { department: 'Roads', visual_issue: 'Pothole', status: 'Pending' },
    { department: 'Water', visual_issue: 'Water Logging', status: 'Resolved' },
    { department: 'Garbage', visual_issue: 'Garbage Dump', status: 'In-Progress' },
    { department: 'Roads', visual_issue: 'Pothole', status: 'Resolved' },
  ];

  // Process Pie Chart Data (Grievance Types)
  const pieDataMap = data.reduce((acc, curr) => {
    const type = curr.visual_issue || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const pieData = Object.keys(pieDataMap).map(key => ({ name: key, value: pieDataMap[key] }));
  const COLORS = ['#0058bc', '#10b981', '#f97316', '#ef4444', '#8b5cf6'];

  // Process Bar Chart Data (Department Speeds / Counts)
  const barDataMap = data.reduce((acc, curr) => {
    const dept = curr.department || 'Unknown';
    if (!acc[dept]) acc[dept] = { name: dept, Resolved: 0, Active: 0 };
    if (curr.status === 'Resolved') acc[dept].Resolved += 1;
    else acc[dept].Active += 1;
    return acc;
  }, {} as Record<string, any>);

  const barData = Object.values(barDataMap);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-headline-md font-bold text-on-surface">Global Analytics</h1>
        <p className="text-on-surface-variant">City-wide overview of grievance reports and departmental performance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-8 rounded-[2.5rem]"
        >
          <h2 className="text-xl font-bold mb-6 text-on-surface">Most Common Issues</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Bar Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-panel p-8 rounded-[2.5rem]"
        >
          <h2 className="text-xl font-bold mb-6 text-on-surface">Department Workload</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey="Resolved" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Active" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
