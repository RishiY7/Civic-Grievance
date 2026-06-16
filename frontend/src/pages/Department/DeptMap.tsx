import { useOutletContext } from 'react-router-dom';
import { MapComponent } from '../../components/MapComponent';
import { BilingualText } from '../../components/BilingualText';

interface DeptContext {
  grievances: any[];
}

export function DeptMap() {
  const { grievances } = useOutletContext<DeptContext>();

  // Filter out resolved issues for the active route planning map
  const activeGrievances = grievances.filter(g => g.status !== 'Resolved');

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline-md font-bold text-on-surface"><BilingualText text="Route Planning Map" /></h1>
          <p className="text-on-surface-variant text-sm"><BilingualText text="Active and pending issues for your department." /></p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-bold">
          {activeGrievances.length} <BilingualText text="Active Points" />
        </div>
      </div>
      
      <div className="flex-1 rounded-[2rem] overflow-hidden border border-outline-variant/30 shadow-sm relative">
        <MapComponent 
          currentLocation={{ lat: 12.9716, lng: 77.5946 }}
          onLocationSelect={() => {}} // Disabled picking new locations
          grievances={activeGrievances}
        />
        <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-outline-variant/20">
          <h3 className="font-bold text-sm mb-2"><BilingualText text="Map Legend" /></h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-error"></div> <BilingualText text="Critical Severity" />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-[#f97316]"></div> <BilingualText text="High Severity" />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-warning"></div> <BilingualText text="Medium Severity" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
