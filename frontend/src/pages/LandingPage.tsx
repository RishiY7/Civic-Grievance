import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapComponent } from '../components/MapComponent';
import { BilingualText } from '../components/BilingualText';
import { PageTransition } from '../components/Effects/PageTransition';
import { GlassCard } from '../components/Effects/GlassCard';

// Mock data for the heatmap of resolved issues
const mockResolvedGrievances = [
  { latitude: 12.9716, longitude: 77.5946, department: 'Roads', severity: 'High' },
  { latitude: 12.9650, longitude: 77.6000, department: 'Water', severity: 'Medium' },
  { latitude: 12.9800, longitude: 77.5800, department: 'Sanitation', severity: 'Low' },
  { latitude: 12.9750, longitude: 77.6100, department: 'Electricity', severity: 'Critical' },
  { latitude: 12.9600, longitude: 77.5900, department: 'Roads', severity: 'High' },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <PageTransition className="flex flex-col gap-12 max-w-7xl mx-auto px-4 py-8">
      <motion.section 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-8 mt-8"
      >
        <div className="flex-1 space-y-6">
          <h1 className="font-headline-xl text-headline-xl md:text-5xl lg:text-6xl text-on-surface tracking-tight mb-4">
            <BilingualText text="Transforming City Management through" /> <span className="gradient-text drop-shadow-md">Civic Grievance</span>
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-2xl text-lg md:text-xl">
            <BilingualText text="A transparent, AI-driven platform to report issues in your neighborhood directly to the responsible departments and track their resolution in real-time." />
          </p>
          
          <div className="flex gap-4 pt-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              <BilingualText text="Get Started / Login" />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-surface-container-high text-on-surface px-8 py-4 rounded-xl font-bold text-lg border border-outline-variant/30 hover:bg-surface-container transition-all"
              onClick={() => document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <BilingualText text="View City Heatmap" />
            </motion.button>
          </div>
        </div>
        <div className="hidden md:block w-[400px]">
          {/* Reserved space for future elements */}
        </div>
      </motion.section>

      <motion.section 
        id="map-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-12"
      >
        <GlassCard delay={0.2} className="p-8">
          <div className="mb-6">
            <h2 className="text-3xl font-headline-md font-bold mb-2"><BilingualText text="City Activity Heatmap" /></h2>
            <p className="text-on-surface-variant text-lg"><BilingualText text="Live map of successfully resolved issues across the city. Transparency builds trust." /></p>
          </div>
          <div className="h-[500px] w-full rounded-2xl overflow-hidden border border-outline-variant/30 relative">
            <MapComponent 
              currentLocation={{ lat: 12.9716, lng: 77.5946 }}
              onLocationSelect={() => {}} // Disabled for landing page
              grievances={mockResolvedGrievances}
            />
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg z-[400]">
              <h4 className="font-bold text-sm mb-2 text-on-surface"><BilingualText text="Resolved Today" /></h4>
              <div className="text-2xl font-extrabold text-primary">142</div>
            </div>
          </div>
        </GlassCard>
      </motion.section>
    </PageTransition>
  );
}
