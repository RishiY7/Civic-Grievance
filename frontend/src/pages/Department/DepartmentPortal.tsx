import { Outlet } from 'react-router-dom';

interface DepartmentPortalProps {
  grievances: any[];
  onUpdateStatus: (id: number, status: string, proofUrl?: string) => void;
}

export function DepartmentPortal({ grievances, onUpdateStatus }: DepartmentPortalProps) {
  // Pass the filtered grievances and the update function down to the outlet
  return (
    <div className="w-full">
      <Outlet context={{ grievances, onUpdateStatus }} />
    </div>
  );
}
