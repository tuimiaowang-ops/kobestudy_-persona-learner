
import React, { useState, useEffect, useRef } from 'react';
import { Character, DialoguePage, WordReading } from '../types';

interface Props {
  character?: Character;
  pages: DialoguePage[];
  vocabulary: WordReading[];
  onFinish?: () => void;
}

const DialogueBox: React.FC<Props> = ({ character, pages, vocabulary, onFinish }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [activeWords, setActiveWords] = useState<Set<string>>(new Set());
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentPage(0);
    setActiveWords(new Set());
  }, [pages]);

  const currentPageData = pages[currentPage];
  const isLastPage = currentPage === pages.length - 1;

  const handleBoxClick = (e: React.MouseEvent) => {
    // Check if user is currently selecting text
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      // If text is selected, don't advance the dialogue
      return;
    }

    if (isLastPage) {
      onFinish?.();
    } else {
      setCurrentPage(prev => prev + 1);
      setActiveWords(new Set());
    }
  };

  const handleJumpToPage = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setCurrentPage(index);
    setActiveWords(new Set());
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
      setActiveWords(new Set());
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLastPage) {
      onFinish?.();
    } else {
      setCurrentPage(prev => prev + 1);
      setActiveWords(new Set());
    }
  };

  const toggleWordHint = (e: React.MouseEvent, uniqueId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If user is trying to select, don't toggle
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;

    setActiveWords(prev => {
      const next = new Set(prev);
      if (next.has(uniqueId)) {
        next.delete(uniqueId);
      } else {
        next.add(uniqueId);
      }
      return next;
    });
  };

  const renderTextWithFurigana = (text: string) => {
    if (!vocabulary || vocabulary.length === 0) return <span>{text}</span>;

    const sortedVocab = [...vocabulary].sort((a, b) => b.word.length - a.word.length);
    const pattern = sortedVocab.map(v => v.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    if (!pattern) return <span>{text}</span>;
    
    const regex = new RegExp(`(${pattern})`, 'g');
    const parts = text.split(regex);

    return parts.map((part, i) => {
      const vocabItem = vocabulary.find(v => v.word === part);
      if (vocabItem) {
        const uniqueId = `${vocabItem.word}-${i}`;
        const isActive = activeWords.has(uniqueId);
        return (
          <span 
            key={i} 
            className="relative inline-block mx-1"
          >
            <span 
              className={`transition-all duration-300 border-b-2 py-0.5 px-0.5 rounded-sm cursor-help ${isActive ? 'text-yellow-400 border-yellow-400 bg-yellow-400/10 font-bold' : 'border-dotted border-white/40 hover:text-yellow-300 hover:border-yellow-300 hover:bg-white/5'}`}
              onClick={(e) => toggleWordHint(e, uniqueId)}
            >
              {part}
            </span>
            {isActive && (
              <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-base px-4 py-2 rounded border-2 border-yellow-500 shadow-[0_0_20px_rgba(250,204,21,0.8)] whitespace-nowrap z-[200] animate-in fade-in slide-in-from-bottom-2 duration-200 font-black pointer-events-none">
                {vocabItem.reading}
              </span>
            )}
          </span>
        );
      }
      return <span key={i} className="relative">{part}</span>;
    });
  };

  if (!currentPageData) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mb-6 relative z-50 px-4 select-text">
      {/* Speaker Tag */}
      {character && currentPageData.type === 'speech' && (
        <div 
          className={`absolute -top-6 left-12 z-[60] px-10 py-2 transform -skew-x-12 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.6)] ${character.color}`}
        >
          <span className="block transform skew-x-12 text-white font-black text-xl tracking-tighter pointer-events-none">
            {character.name}
          </span>
        </div>
      )}

      {/* Main Dialogue Box */}
      <div 
        ref={boxRef}
        className={`relative bg-slate-900/95 backdrop-blur-xl border-2 p-8 md:p-10 min-h-[180px] max-h-[40vh] overflow-y-auto shadow-2xl transition-all duration-500 clip-message ${
            currentPageData.type === 'action' ? 'border-indigo-500/60' : 'border-white/30'
        }`}
        onClick={handleBoxClick}
      >
        <div className={`absolute top-4 left-4 w-3 h-3 rounded-full animate-pulse z-20 pointer-events-none ${currentPageData.type === 'action' ? 'bg-indigo-400' : 'bg-yellow-400'}`} />

        <div 
          className={`relative h-full pr-8 font-medium text-xl md:text-2xl leading-relaxed tracking-wide z-20 ${
            currentPageData.type === 'action' ? 'italic text-indigo-200 opacity-80' : 'text-white'
          }`}
          style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
        >
          {renderTextWithFurigana(currentPageData.text)}
        </div>

        {/* Page Dots (Clickable) */}
        <div className="absolute top-4 right-8 flex space-x-2 z-20">
            {pages.map((_, i) => (
                <div 
                  key={i} 
                  onClick={(e) => handleJumpToPage(e, i)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 cursor-pointer border border-transparent hover:border-white/50 ${i === currentPage ? 'bg-yellow-400 scale-125 shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 'bg-white/20 hover:bg-white/40'}`}
                  title={`Jump to page ${i + 1}`}
                ></div>
            ))}
        </div>

        {/* Navigation Prompt */}
        <div className="absolute bottom-4 right-6 z-30 flex items-center gap-3">
          
          {/* Previous Button */}
          <div 
            onClick={handlePrev}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all cursor-pointer ${currentPage > 0 ? 'bg-white/5 border-white/20 hover:bg-white/10 text-white' : 'opacity-0 pointer-events-none'}`}
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-widest">Prev</span>
          </div>

          {/* Next Button */}
          <div 
            onClick={handleNext}
            className="flex items-center gap-2 bg-yellow-500/10 px-6 py-2 rounded-full border border-yellow-500/40 transition-all cursor-pointer group hover:bg-yellow-500/20"
          >
            <span className="text-xs font-black uppercase tracking-[0.2em] text-yellow-500">
                {isLastPage ? "Finish" : "Next"}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* Help Hint */}
        <div className="absolute bottom-4 left-8 text-[10px] text-white/30 font-bold tracking-widest pointer-events-none italic">
          ※ 点击词语看读音 | 划词右键翻译与收藏
        </div>
      </div>
    </div>
  );
};

export default DialogueBox;
