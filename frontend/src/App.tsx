import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { MapComponent } from './components/MapComponent';
import { GrievanceForm } from './components/GrievanceForm';
import { AIFormAssistantView } from './components/AIFormAssistant/AIFormAssistantView';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { CitizenPortal } from './pages/Citizen/CitizenPortal';
import { CitizenDashboard } from './pages/Citizen/CitizenDashboard';
import { IssueDetail as CitizenIssueDetail } from './pages/Citizen/IssueDetail';
import { DepartmentPortal } from './pages/Department/DepartmentPortal';
import { DeptDashboard } from './pages/Department/DeptDashboard';
import { DeptMap } from './pages/Department/DeptMap';
import { ResolveIssue } from './pages/Department/ResolveIssue';
import { AdminPortal } from './pages/Admin/AdminPortal';
import { AdminAnalytics } from './pages/Admin/AdminAnalytics';
import { AdminTable } from './pages/Admin/AdminTable';
import { AdminUsers } from './pages/Admin/AdminUsers';
import { ProtectedRoute } from './components/ProtectedRoute';

const uiTranslations: Record<string, Record<string, string>> = {
  'en': {
      title: "Report an Issue",
      subtitle: "Provide details and set the location on the map.",
      emailLabel: "Email Address (For Status Updates)",
      uploadLabel: "Upload Image",
      descLabel: "Describe the Issue (Text or Voice)",
      placeholder: "Describe the issue in Kannada, Hindi, English...",
      submitBtn: "Submit Grievance",
      locationLabel: "Issue Location",
      getLocationBtn: "Get My Location",
      locationHint: "Click on the map or use the button to set your location.",
      locating: "Locating...",
      locationCaptured: "Location Captured!",
      recordBtn: "Record Audio",
      stopRecording: "Stop Recording",
      recordingStatus: "Recording..."
  },
  'kn': {
      title: "ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿ (Report an Issue)",
      subtitle: "ವಿವರಗಳನ್ನು ಒದಗಿಸಿ ಮತ್ತು ನಕ್ಷೆಯಲ್ಲಿ ಸ್ಥಳವನ್ನು ಹೊಂದಿಸಿ. (Provide details and set the location on the map.)",
      emailLabel: "ಇಮೇಲ್ ವಿಳಾಸ (Email Address)",
      uploadLabel: "ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ (Upload Image)",
      descLabel: "ಸಮಸ್ಯೆಯನ್ನು ವಿವರಿಸಿ (ಪಠ್ಯ ಅಥವಾ ಧ್ವನಿ) (Describe the Issue (Text or Voice))",
      placeholder: "ಸಮಸ್ಯೆಯನ್ನು ಕನ್ನಡದಲ್ಲಿ ವಿವರಿಸಿ... (Describe the issue in Kannada...)",
      submitBtn: "ದೂರು ಸಲ್ಲಿಸಿ (Submit Grievance)",
      locationLabel: "ಸಮಸ್ಯೆಯ ಸ್ಥಳ (Issue Location)",
      getLocationBtn: "ನನ್ನ ಸ್ಥಳವನ್ನು ಪಡೆಯಿರಿ (Get My Location)",
      locationHint: "ನಕ್ಷೆಯ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ ಅಥವಾ ಸ್ಥಳವನ್ನು ಹೊಂದಿಸಲು ಬಟನ್ ಬಳಸಿ. (Click on the map or use the button to set your location.)",
      locating: "ಹುಡುಕಲಾಗುತ್ತಿದೆ... (Locating...)",
      locationCaptured: "ಸ್ಥಳವನ್ನು ಸೆರೆಹಿಡಿಯಲಾಗಿದೆ! (Location Captured!)",
      recordBtn: "ಆಡಿಯೋ ರೆಕಾರ್ಡ್ ಮಾಡಿ (Record Audio)",
      stopRecording: "ರೆಕಾರ್ಡಿಂಗ್ ನಿಲ್ಲಿಸಿ (Stop Recording)",
      recordingStatus: "ರೆಕಾರ್ಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ... (Recording...)"
  },
  'hi': {
      title: "समस्या की रिपोर्ट करें (Report an Issue)",
      subtitle: "विवरण प्रदान करें और मानचित्र पर स्थान सेट करें। (Provide details and set the location on the map.)",
      emailLabel: "ईमेल पता (Email Address)",
      uploadLabel: "छवि अपलोड करें (Upload Image)",
      descLabel: "समस्या का वर्णन करें (पाठ या ध्वनि) (Describe the Issue (Text or Voice))",
      placeholder: "समस्या का वर्णन हिंदी में करें... (Describe the issue in Hindi...)",
      submitBtn: "शिकायत दर्ज करें (Submit Grievance)",
      locationLabel: "समस्या का स्थान (Issue Location)",
      getLocationBtn: "मेरा स्थान प्राप्त करें (Get My Location)",
      locationHint: "मानचित्र पर क्लिक करें या अपना स्थान सेट करने के लिए बटन का उपयोग करें। (Click on the map or use the button to set your location.)",
      locating: "स्थान खोजा जा रहा है... (Locating...)",
      locationCaptured: "स्थान कैप्चर किया गया! (Location Captured!)",
      recordBtn: "ऑडियो रिकॉर्ड करें (Record Audio)",
      stopRecording: "रिकॉर्डिंग रोकें (Stop Recording)",
      recordingStatus: "रिकॉर्डिंग हो रही है... (Recording...)"
  }
};

export default function App() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(localStorage.getItem('userRole'));
  const [userDept, setUserDept] = useState<string | null>(localStorage.getItem('userDept'));
  const [language] = useState('en');
  
  const [allGrievances, setAllGrievances] = useState<any[]>([]);
  const [filteredGrievances, setFilteredGrievances] = useState<any[]>([]);
  
  const [currentLocation, setCurrentLocation] = useState({ lat: 12.9716, lng: 77.5946 });
  const [isLocating, setIsLocating] = useState(false);
  const [locationCaptured, setLocationCaptured] = useState(false);

  useEffect(() => {
    fetchGrievances();
  }, [userRole]);

  const fetchGrievances = async () => {
    const token = localStorage.getItem('adminToken');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch('http://localhost:8000/grievances', { headers });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      setAllGrievances(data);
      applyFilters(data, userDept || 'All', 'All');
    } catch (err) {
      console.error('Failed to load grievances', err);
    }
  };

  const handleLoginSuccess = (token: string, role: string, dept: string | null) => {
    localStorage.setItem('adminToken', token);
    localStorage.setItem('userRole', role);
    if (dept) localStorage.setItem('userDept', dept);
    
    setUserRole(role);
    setUserDept(dept);
    
    // Redirect based on role
    if (role === 'admin') navigate('/admin');
    else if (role === 'department') navigate('/department');
    else navigate('/citizen');
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userDept');
    setUserRole(null);
    setUserDept(null);
    setAllGrievances([]);
    setFilteredGrievances([]);
    navigate('/');
  };

  const handleGetLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(position => {
        setCurrentLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationCaptured(true);
        setIsLocating(false);
      }, () => {
        alert("Error detecting location");
        setIsLocating(false);
      });
    } else {
      alert("Geolocation not supported");
      setIsLocating(false);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setCurrentLocation({ lat, lng });
    setLocationCaptured(false);
  };

  const handleGrievanceSuccess = (data: any) => {
    const newGrievance = {
      latitude: data.coordinates.lat,
      longitude: data.coordinates.lng,
      severity: data.ai_analysis.severity,
      department: data.ai_analysis.department,
      visual_issue: data.ai_analysis.visual_issue,
      translated_text: data.ai_analysis.translated_text,
      original_text: data.ai_analysis.original_text,
      image_path: data.ai_analysis.image_path,
      image_description: data.ai_analysis.image_description
    };
    const updated = [...allGrievances, newGrievance];
    setAllGrievances(updated);
    if (!userRole || userRole === 'user') setFilteredGrievances(updated);
  };

  const handleUpdateGrievanceStatus = (id: number, newStatus: string, proofPhoto?: string) => {
    const updated = [...allGrievances];
    if (updated[id]) {
      updated[id] = { ...updated[id], status: newStatus, proofPhoto };
      setAllGrievances(updated);
      
      // Re-apply filters if department is viewing
      if (userRole === 'department') {
        applyFilters(updated, userDept || 'All', 'All');
      }
    }
  };

  const handleOverrideDepartment = (id: number, newDept: string) => {
    const updated = [...allGrievances];
    if (updated[id]) {
      updated[id] = { ...updated[id], department: newDept };
      setAllGrievances(updated);
      if (userRole === 'department') applyFilters(updated, userDept || 'All', 'All');
    }
  };

  const applyFilters = (grievances: any[], dept: string, sev: string) => {
    const filtered = grievances.filter(g => {
      const matchDept = dept === 'All' || g.department === dept;
      const matchSev = sev === 'All' || g.severity === sev;
      return matchDept && matchSev;
    });
    setFilteredGrievances(filtered);
  };

  return (
    <Layout 
      userRole={userRole} 
      userDept={userDept}
      onLoginClick={() => navigate('/auth')}
      onLogout={handleLogout}
    >
      <Routes>
        {/* PUBLIC GATEWAY */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage onLoginSuccess={handleLoginSuccess} />} />

        {/* PROTECTED ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={['user']} userRole={userRole} />}>
          <Route path="/citizen" element={<CitizenPortal grievances={allGrievances} />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<CitizenDashboard />} />
            <Route path="report" element={
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <GrievanceForm 
                  currentLocation={currentLocation}
                  onGetLocation={handleGetLocation}
                  isLocating={isLocating}
                  locationCaptured={locationCaptured}
                  onSuccess={handleGrievanceSuccess}
                  translations={uiTranslations[language]}
                />
                <div className="xl:col-span-2 flex flex-col gap-8">
                  <MapComponent 
                    currentLocation={currentLocation}
                    onLocationSelect={handleLocationSelect}
                    grievances={filteredGrievances}
                  />
                  <div className="bg-surface-container-lowest rounded-[2.5rem] shadow-sm border border-outline-variant/30 overflow-hidden">
                    <AIFormAssistantView language={language} />
                  </div>
                </div>
              </div>
            } />
            <Route path="issue/:id" element={<CitizenIssueDetail />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin']} userRole={userRole} />}>
          <Route path="/admin" element={
            <AdminPortal 
              grievances={allGrievances} 
              onOverride={handleOverrideDepartment} 
            />
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminAnalytics />} />
            <Route path="grievances" element={<AdminTable />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['department']} userRole={userRole} />}>
          <Route path="/department" element={
            <DepartmentPortal 
              grievances={filteredGrievances} 
              onUpdateStatus={handleUpdateGrievanceStatus} 
            />
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DeptDashboard />} />
            <Route path="map" element={<DeptMap />} />
            <Route path="issue/:id" element={<ResolveIssue />} />
          </Route>
        </Route>

        {/* CATCH ALL */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}
