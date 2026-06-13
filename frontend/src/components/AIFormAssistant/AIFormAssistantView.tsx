import { ChatInterface } from './ChatInterface';
import { Building } from 'lucide-react';

interface AIFormAssistantViewProps {
  language: string;
}

export function AIFormAssistantView({ language }: AIFormAssistantViewProps) {
  const displayLanguage = language === 'kn' ? 'Kannada' : language === 'hi' ? 'Hindi' : 'English';

  return (
    <div className="w-full max-w-5xl mx-auto bg-surface rounded-2xl shadow-lg border border-outline-variant/30 overflow-hidden mb-8">
        <div className="p-4 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between">
            <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Building size={18} />
                </span>
                Civic Assistant
            </h2>
            <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold">Online</span>
        </div>
        <div style={{ height: '600px', backgroundColor: '#fff', position: 'relative' }}>
            <ChatInterface language={displayLanguage} setLanguage={() => {}} />
        </div>
    </div>
  );
}
