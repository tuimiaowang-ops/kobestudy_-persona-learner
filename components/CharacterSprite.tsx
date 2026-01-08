
import React, { useState, useEffect } from 'react';
import { Character, CharacterId } from '../types';

interface Props {
  character: Character;
  isSpeaking: boolean;
  className?: string;
  onClick?: () => void;
}

const CharacterSprite: React.FC<Props> = ({ character, isSpeaking, className, onClick }) => {
  const [imgError, setImgError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Reset error state when url changes (e.g. user uploads new image)
  useEffect(() => {
    setImgError(false);
    setRetryCount(0);
  }, [character.avatarUrl]);

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgError(false);
    setRetryCount(prev => prev + 1);
  };

  return (
    <div 
      className={`relative cursor-pointer group transition-all duration-500 ${className} ${isSpeaking ? 'z-20 scale-105' : 'z-10 scale-100 opacity-90 hover:opacity-100 hover:scale-105'}`}
      onClick={onClick}
    >
      {/* Aura/Glow effect */}
      <div className={`absolute inset-0 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-700 ${character.color}`}></div>
      
      {/* Character Image Container */}
      <div className="relative live2d-breathe w-full h-full flex items-center justify-center p-2">
        {!imgError && character.avatarUrl ? (
            <div className={`relative w-full h-full overflow-hidden rounded-[2rem] border-4 border-white/20 shadow-2xl transition-all duration-500 ${isSpeaking ? 'ring-4 ring-yellow-400/50' : ''}`}>
                <img 
                  // Append retry count to URL to bypass simple browser caching on retry
                  src={`${character.avatarUrl}&retry=${retryCount}`} 
                  alt={character.name}
                  className="w-full h-full object-cover"
                  style={{ filter: isSpeaking ? 'brightness(1.05) contrast(1.05)' : 'brightness(0.95)' }}
                  onError={() => {
                      console.warn(`Failed to load image for ${character.name}`);
                      setImgError(true);
                  }}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
                {/* Shine effect on card */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50 pointer-events-none"></div>
            </div>
        ) : (
            // Fallback: CSS-Only "Anime Card" Style
            // This ensures we always have a beautiful graphic even if external images fail
            <div className={`w-full h-full flex flex-col items-center justify-center relative overflow-hidden rounded-[2rem] border-4 border-white/30 shadow-2xl bg-gradient-to-br ${character.color} from-gray-900`}>
                 
                 {/* Decorative Circle Behind */}
                 <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white/10 blur-xl"></div>
                 
                 {/* Silhouette Placeholder using correct Character IDs */}
                 <div className="text-9xl opacity-80 filter drop-shadow-lg transform scale-150 mb-8 grayscale">
                    {character.id === CharacterId.ASUKA && '👧🏼'}
                    {character.id === CharacterId.HIKARI && '👩🏻'}
                    {character.id === CharacterId.REI && '👩🏻‍🦰'}
                    {character.id === CharacterId.REN && '🦹🏻‍♂️'}
                    {character.id === CharacterId.HAKU && '🤴🏻'}
                 </div>

                 {/* Vertical Japanese Text */}
                 <div className="absolute right-4 top-4 flex flex-col space-y-2 opacity-80 writing-vertical-rl text-white font-black text-2xl tracking-widest border-l-2 border-white/20 pl-2">
                     {character.name.split('').map((char, i) => <span key={i}>{char}</span>)}
                 </div>

                 <div className="absolute bottom-10 px-4 py-1 bg-black/50 backdrop-blur rounded text-white text-xs font-mono uppercase tracking-widest border border-white/20">
                    Image Not Loaded
                 </div>

                 {/* Retry Button */}
                 <button 
                    onClick={handleRetry}
                    className="absolute top-2 right-2 bg-white/20 hover:bg-white/40 p-2 rounded-full backdrop-blur-md transition-colors z-50 group-hover:opacity-100"
                    title="Retry Loading Image"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                 </button>
            </div>
        )}
      </div>

      {/* Name Tag (Only show if image loaded, otherwise the card has the name) */}
      {!imgError && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-6 py-1 rounded-sm border-l-4 border-r-4 shadow-lg transform -skew-x-12 whitespace-nowrap z-30">
            <span className={`block transform skew-x-12 font-bold text-lg uppercase tracking-widest text-gray-800`}>
            {character.name}
            </span>
        </div>
      )}
    </div>
  );
};

export default CharacterSprite;
