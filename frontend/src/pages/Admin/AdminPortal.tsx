import { Outlet } from 'react-router-dom';

interface AdminPortalProps {
  grievances: any[];
  onOverride: (id: number, newDept: string) => void;
}

export function AdminPortal({ grievances, onOverride }: AdminPortalProps) {
  // Pass the global grievances and the override function down to the outlet
  return (
    <div className="w-full">
      <Outlet context={{ grievances, onOverride }} />
    </div>
  );
}
