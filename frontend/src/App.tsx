import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { MapComponent } from './components/MapComponent';
import { GrievanceForm } from './components/GrievanceForm';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';

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
  const [userRole, setUserRole] = useState<string | null>(localStorage.getItem('userRole'));
  const [userDept, setUserDept] = useState<string | null>(localStorage.getItem('userDept'));
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [language, setLanguage] = useState('en');
  
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
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userDept');
    setUserRole(null);
    setUserDept(null);
    setAllGrievances([]);
    setFilteredGrievances([]);
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
    setLocationCaptured(false); // Reset to allow them to capture GPS again if they want
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
    // Let AdminDashboard's effect re-trigger applyFilters by preserving state, but if user we just set it
    if (!userRole || userRole === 'user') setFilteredGrievances(updated);
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
      onLoginClick={() => setShowAuthModal(true)}
      onLogout={handleLogout}
      language={language}
      onLanguageChange={setLanguage}
    >
      {userRole === 'admin' || userRole === 'department' ? (
        <AdminDashboard 
          grievances={allGrievances} 
          userDept={userDept} 
          onFilterChange={(dept, sev) => applyFilters(allGrievances, dept, sev)}
        />
      ) : (
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight mb-2">
              <span className="gradient-text">Civic Grievance</span>
            </h1>
            <p className="text-body-lg text-on-surface-variant max-w-xl">
              Report issues in your neighborhood directly to the responsible departments.
            </p>
          </div>
          {!userRole && (
            <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold border border-primary/20 text-sm">
              Please login to submit a verified grievance.
            </div>
          )}
        </section>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {(!userRole || userRole === 'user') && (
          <GrievanceForm 
            currentLocation={currentLocation}
            onGetLocation={handleGetLocation}
            isLocating={isLocating}
            locationCaptured={locationCaptured}
            onSuccess={handleGrievanceSuccess}
            translations={uiTranslations[language]}
          />
        )}
        
        <MapComponent 
          currentLocation={currentLocation}
          onLocationSelect={handleLocationSelect}
          grievances={filteredGrievances}
        />
      </div>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} onLoginSuccess={handleLoginSuccess} />
      )}
    </Layout>
  );
}
