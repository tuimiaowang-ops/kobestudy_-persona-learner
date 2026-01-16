import React, { useState } from 'react';
import { Character } from '../types';

interface Props {
  character: Character;
  isSpeaking: boolean;
  className?: string;
}

const CharacterSprite: React.FC<Props> = ({ character, isSpeaking, className = "" }) => {
  const [hasError, setHasError] = useState(false);

  // 如果没有 URL 或已经报错，显示占位符
  if (!character.avatarUrl || hasError) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${className} ${character.color} bg-opacity-20 border-4 border-white/10 rounded-[2rem]`}>
        <span className="text-4xl font-black text-white/20">{character.name.slice(0, 1)}</span>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full flex items-center justify-center p-2 ${className}`}>
      <div className={`relative w-full h-full overflow-hidden rounded-[2rem] border-4 border-white/20 shadow-2xl transition-all duration-500 ${isSpeaking ? 'ring-4 ring-yellow-400/50' : ''}`}>
        
        {/* ⚠️ 关键修改：添加 key={character.avatarUrl}
            这样每当 URL 变化（表情变化）时，React 会强制重新渲染，
            避免卡在旧图上。
        */}
        <img 
          key={character.avatarUrl}
          src={character.avatarUrl} 
          alt={character.name}
          
          // ✅ 保持 async，防止卡顿
          decoding="async"
          
          className="w-full h-full object-cover transition-opacity duration-300"
          style={{ 
            filter: isSpeaking ? 'brightness(1.05) contrast(1.05)' : 'brightness(0.95)',
          }}
          onError={(e) => {
            console.error("Image Dead:", character.name, e.currentTarget.src);
            setHasError(true);
          }}
        />
      </div>
    </div>
  );
};

export default CharacterSprite;
