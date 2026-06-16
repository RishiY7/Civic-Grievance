import { useLanguage } from '../context/LanguageContext';
import { translations } from '../locales';

interface Props {
  text: string; // The English base text
}

export function BilingualText({ text }: Props) {
  const { language } = useLanguage();

  if (language === 'English') {
    return <span>{text}</span>;
  }

  const translatedText = translations[language]?.[text];

  if (translatedText) {
    return (
      <span className="inline-flex items-baseline flex-wrap gap-1">
        {translatedText}
      </span>
    );
  }

  // Fallback to just English if you forgot to add the translation to the dictionary
  return <span>{text}</span>; 
}
