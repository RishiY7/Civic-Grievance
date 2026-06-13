import React, { useState, useRef } from 'react';
import { Mic, Square, MapPin, Upload, Loader2, Send, CheckCircle2 } from 'lucide-react';

interface GrievanceFormProps {
  currentLocation: { lat: number; lng: number };
  onGetLocation: () => void;
  isLocating: boolean;
  locationCaptured: boolean;
  onSuccess: (data: any) => void;
  translations: Record<string, string>;
}

export function GrievanceForm({
  currentLocation,
  onGetLocation,
  isLocating,
  locationCaptured,
  onSuccess,
  translations
}: GrievanceFormProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  const toggleRecording = async () => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setAudioBlob(null);
      setAudioUrl('');
    } catch (err: any) {
      alert("Error accessing microphone: " + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;
    
    setIsSubmitting(true);
    setErrorMsg('');
    setResult(null);

    const formData = new FormData(formRef.current);
    formData.append('lat', currentLocation.lat.toString());
    formData.append('lng', currentLocation.lng.toString());
    
    if (audioBlob) {
      formData.append('audio', audioBlob, 'recording.webm');
    }

    try {
      const token = localStorage.getItem('adminToken');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Since the backend is Python, we proxy requests in vite.config.ts or use absolute URL
      const response = await fetch('http://localhost:8000/submit-grievance', {
        method: 'POST',
        body: formData,
        headers: headers
      });

      if (!response.ok) {
        const errData = await response.text();
        throw new Error(`Server error: ${response.status} - ${errData}`);
      }

      const data = await response.json();
      setResult(data.ai_analysis);
      onSuccess(data);
      
      // Reset form
      formRef.current.reset();
      setAudioBlob(null);
      setAudioUrl('');
      
    } catch (error: any) {
      console.error("Submission failed:", error);
      setErrorMsg('Error submitting grievance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-3xl flex flex-col xl:col-span-1 shadow-lg relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Send size={100} className="text-primary" />
      </div>
      
      <h2 className="text-2xl font-headline-md font-bold text-on-surface mb-2 relative z-10">
        {translations.title || "Report an Issue"}
      </h2>
      <p className="text-body-md text-on-surface-variant opacity-80 mb-6 border-b border-outline-variant/30 pb-4 relative z-10">
        {translations.subtitle || "Provide details and set the location on the map."}
      </p>

      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col space-y-5 flex-1 relative z-10">
        <div>
          <label htmlFor="image" className="block text-label-lg font-bold text-on-surface mb-1">
            {translations.uploadLabel || "Upload Image"}
          </label>
          <div className="relative border-2 border-dashed border-outline-variant/50 rounded-xl p-4 hover:bg-surface-container-low transition-colors text-center cursor-pointer">
            <input 
              type="file" 
              id="image" 
              name="file" 
              accept="image/*" 
              required
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center text-on-surface-variant">
              <Upload size={24} className="mb-2 text-primary" />
              <span className="text-sm">Click to upload or drag and drop</span>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-label-lg font-bold text-on-surface mb-1">
            {translations.emailLabel || "Email Address"}
          </label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            className="w-full px-4 py-3 bg-surface-container-highest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface" 
            placeholder="name@example.com"
          />
        </div>

        <div>
          <label htmlFor="text" className="block text-label-lg font-bold text-on-surface mb-1">
            {translations.descLabel || "Describe the Issue (Text or Voice)"}
          </label>
          <textarea 
            id="text" 
            name="text" 
            rows={3}
            className="w-full px-4 py-3 bg-surface-container-highest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface resize-none"
            placeholder={translations.placeholder || "Describe the issue..."}
          ></textarea>
          
          <div className="mt-3 flex items-center space-x-3">
            <button 
              type="button" 
              onClick={toggleRecording} 
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all shadow-sm ${
                isRecording 
                  ? 'bg-error text-white hover:bg-error/90 animate-pulse' 
                  : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'
              }`}
            >
              {isRecording ? <Square size={16} /> : <Mic size={16} />}
              <span>{isRecording ? (translations.stopRecording || "Stop") : (translations.recordBtn || "Record Audio")}</span>
            </button>
            
            {audioUrl && !isRecording && (
              <audio src={audioUrl} controls className="h-8 max-w-[200px]" />
            )}
          </div>
        </div>

        <div>
          <label className="block text-label-lg font-bold text-on-surface mb-2">
            {translations.locationLabel || "Issue Location"}
          </label>
          <button 
            type="button" 
            onClick={onGetLocation}
            disabled={isLocating}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all shadow-md ${
              locationCaptured 
                ? 'bg-secondary text-white hover:bg-secondary/90' 
                : 'bg-white text-on-surface border border-outline-variant/50 hover:bg-surface-container-low'
            }`}
          >
            {isLocating ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
            <span>
              {isLocating 
                ? (translations.locating || "Locating...") 
                : locationCaptured 
                  ? (translations.locationCaptured || "Location Captured!") 
                  : (translations.getLocationBtn || "Get My Location")}
            </span>
          </button>
          <p className="text-xs text-on-surface-variant opacity-70 mt-2 text-center">
            {translations.locationHint || "Click on the map or use the button to set your location."}
          </p>
        </div>

        <div className="mt-auto pt-4">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:hover:transform-none"
          >
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            <span>{translations.submitBtn || "Submit Grievance"}</span>
          </button>
        </div>
        
        {errorMsg && (
          <div className="mt-2 text-sm text-center font-bold text-error bg-error/10 p-3 rounded-xl border border-error/20">
            {errorMsg}
          </div>
        )}
      </form>

      {/* Result Details Overlay/Modal */}
      {result && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-20 flex flex-col p-6 overflow-y-auto">
          <div className="flex items-center gap-3 text-secondary mb-4 pb-4 border-b border-outline-variant/20">
            <CheckCircle2 size={32} />
            <h2 className="text-xl font-bold text-on-surface">Submission Successful</h2>
          </div>
          
          <h3 className="font-bold text-label-lg text-primary uppercase tracking-wider mb-4">AI Analysis Result</h3>
          
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold text-on-surface-variant">Severity:</span>
              <span className="col-span-2 font-bold text-on-surface">{result.severity}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold text-on-surface-variant">Department:</span>
              <span className="col-span-2 text-on-surface">{result.department}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold text-on-surface-variant">Visual Issue:</span>
              <span className="col-span-2 text-on-surface">{result.visual_issue}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold text-on-surface-variant">Original:</span>
              <span className="col-span-2 text-on-surface">{result.original_text}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold text-on-surface-variant">Translated:</span>
              <span className="col-span-2 text-on-surface italic">{result.translated_text}</span>
            </div>
          </div>
          
          <button 
            onClick={() => setResult(null)}
            className="mt-auto w-full py-3 bg-surface-container-high text-on-surface font-bold rounded-xl hover:bg-surface-container transition-colors"
          >
            Submit Another
          </button>
        </div>
      )}
    </div>
  );
}
