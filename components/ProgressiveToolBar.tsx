import React, { useState } from 'react';
import { 
  Type, Images, Wand2, Settings, Trash2, Check, 
  RotateCcw, Maximize, Loader2, Aperture, RefreshCw
} from 'lucide-react';
import { VintageRollInput } from './VintageRollInput';
import { ImageGallery } from './ImageGallery';
import { FontOption, OrderItem, DesignState, LogoItem, StoreConfig } from '../types';
import { removeBackground } from '../utils/imageUtils';

interface ProgressiveToolBarProps {
  view: 'FRONT' | 'BACK';
  activeTool: 'TEXT1' | 'TEXT2' | 'IMAGES' | 'MAGIC' | 'SETTINGS' | null;
  setActiveTool: (tool: 'TEXT1' | 'TEXT2' | 'IMAGES' | 'MAGIC' | 'SETTINGS' | null) => void;
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
  
  // Text state
  frontText: string;
  frontText2: string;
  backText: string;
  backText2: string;
  setFrontText: (text: string) => void;
  setFrontText2: (text: string) => void;
  setBackText: (text: string) => void;
  setBackText2: (text: string) => void;
  
  // Font state
  frontFontId: number;
  frontFontId2: number;
  backFontId: number;
  backFontId2: number;
  setFrontFontId: (id: number) => void;
  setFrontFontId2: (id: number) => void;
  setBackFontId: (id: number) => void;
  setBackFontId2: (id: number) => void;
  
  // Design state
  frontDesign: DesignState;
  frontDesign2: DesignState;
  backDesign: DesignState;
  backDesign2: DesignState;
  setFrontDesign: (state: DesignState) => void;
  setFrontDesign2: (state: DesignState) => void;
  setBackDesign: (state: DesignState) => void;
  setBackDesign2: (state: DesignState) => void;
  
  // Logos state
  frontLogos: LogoItem[];
  backLogos: LogoItem[];
  setFrontLogos: (logos: LogoItem[]) => void;
  setBackLogos: (logos: LogoItem[]) => void;
  
  // UI state
  isProcessing: boolean;
  isRemovingBackground: boolean;
  selectedLogoId: string | null;
  setIsProcessing: (processing: boolean) => void;
  setIsRemovingBackground: (removing: boolean) => void;
  
  // Callbacks
  handleRemoveBackground: () => Promise<void>;
  processImage: (logoId: string, filterType: 'REMOVE_WHITE' | 'REMOVE_BLACK' | 'MAKE_WHITE_REMOVE_BLACK') => Promise<void>;
  resetImage: (logoId: string) => void;
  deleteLogo: (id: string) => void;
  handleDeleteSelected: () => void;
  handleResetSelected: () => void;
  openFontModal: (target: 'text1' | 'text2') => void;
  handleFontSelect: (fontId: number) => void;
  
  // Product state
  isClientItem: boolean;
  setIsClientItem: (isClientItem: boolean) => void;
  clientItemBrand: string;
  clientItemColor: string;
  setClientItemBrand: (brand: string) => void;
  setClientItemColor: (color: string) => void;
  userUploadedImage: string | null;
  setUserUploadedImage: (image: string | null) => void;
  
  // Theme
  isDarkMode: boolean;
  storeConfig: StoreConfig;
}

const ProgressiveToolBar: React.FC<ProgressiveToolBarProps> = ({
  view,
  activeTool,
  setActiveTool,
  selectedElementId,
  setSelectedElementId,
  frontText,
  frontText2,
  backText,
  backText2,
  setFrontText,
  setFrontText2,
  setBackText,
  setBackText2,
  frontFontId,
  frontFontId2,
  backFontId,
  backFontId2,
  setFrontFontId,
  setFrontFontId2,
  setBackFontId,
  setBackFontId2,
  frontDesign,
  frontDesign2,
  backDesign,
  backDesign2,
  setFrontDesign,
  setFrontDesign2,
  setBackDesign,
  setBackDesign2,
  frontLogos,
  backLogos,
  setFrontLogos,
  setBackLogos,
  isProcessing,
  isRemovingBackground,
  selectedLogoId,
  setIsProcessing,
  setIsRemovingBackground,
  handleRemoveBackground,
  processImage,
  resetImage,
  deleteLogo,
  handleDeleteSelected,
  handleResetSelected,
  openFontModal,
  handleFontSelect,
  isClientItem,
  setIsClientItem,
  clientItemBrand,
  clientItemColor,
  setClientItemBrand,
  setClientItemColor,
  userUploadedImage,
  setUserUploadedImage,
  isDarkMode,
  storeConfig
}) => {

  const getCurrentLogos = () => view === 'FRONT' ? frontLogos : backLogos;
  const getCurrentText1 = () => view === 'FRONT' ? frontText : backText;
  const getCurrentText2 = () => view === 'FRONT' ? frontText2 : backText2;
  const getCurrentFontId1 = () => view === 'FRONT' ? frontFontId : backFontId;
  const getCurrentFontId2 = () => view === 'FRONT' ? frontFontId2 : backFontId2;
  const getCurrentDesign1 = () => view === 'FRONT' ? frontDesign : backDesign;
  const getCurrentDesign2 = () => view === 'FRONT' ? frontDesign2 : backDesign2;
  const setCurrentText1 = (text: string) => {
    if (view === 'FRONT') setFrontText(text); else setBackText(text);
  };
  const setCurrentText2 = (text: string) => {
    if (view === 'FRONT') setFrontText2(text); else setBackText2(text);
  };
  const setCurrentFontId1 = (id: number) => {
    if (view === 'FRONT') setFrontFontId(id); else setBackFontId(id);
  };
  const setCurrentFontId2 = (id: number) => {
    if (view === 'FRONT') setFrontFontId2(id); else setBackFontId2(id);
  };
  const setCurrentDesign1 = (state: DesignState) => {
    if (view === 'FRONT') setFrontDesign(state); else setBackDesign(state);
  };
  const setCurrentDesign2 = (state: DesignState) => {
    if (view === 'FRONT') setFrontDesign2(state); else setBackDesign2(state);
  };
  const setCurrentLogos = (logos: LogoItem[]) => {
    if (view === 'FRONT') setFrontLogos(logos); else setBackLogos(logos);
  };
  const getCurrentFontId = (target: 'text1' | 'text2') => {
    return target === 'text1' ? getCurrentFontId1() : getCurrentFontId2();
  };
  const setCurrentFontId = (target: 'text1' | 'text2', id: number) => {
    if (target === 'text1') setCurrentFontId1(id); else setCurrentFontId2(id);
  };
  const getCurrentDesign = (id: string) => {
    if (id === 'text1') return getCurrentDesign1();
    if (id === 'text2') return getCurrentDesign2();
    return getCurrentLogos().find(l => l.id === id)?.state || { x: 50, y: 50, scale: 1, rotate: 0 };
  };
  const setCurrentDesign = (id: string, newState: DesignState) => {
    if (id === 'text1') { setCurrentDesign1(newState); }
    else if (id === 'text2') { setCurrentDesign2(newState); }
    else {
      setCurrentLogos(getCurrentLogos().map(l => 
        l.id === id ? { ...l, state: newState } : l
      ));
    }
  };

  const handleToolClick = (tool: 'TEXT1' | 'TEXT2' | 'IMAGES' | 'MAGIC' | 'SETTINGS') => {
    setSelectedElementId(
      tool === 'TEXT1' ? 'text1' :
      tool === 'TEXT2' ? 'text2' :
      null
    );
    setActiveTool(activeTool === tool ? null : tool);
  };

  return (
    <div className="pointer-events-auto flex flex-col items-center gap-3 md:gap-5 bg-zinc-950/95 backdrop-blur-md text-white p-2 md:p-4 rounded-2xl md:rounded-3xl shadow-2xl border border-zinc-800">
      {/* TEXT TOOL */}
      <button 
        onClick={() => handleToolClick('TEXT1')}
        className={`relative p-2 md:p-3 rounded-xl md:rounded-2xl transition-all active:scale-90 ${activeTool === 'TEXT1' ? 'bg-yellow-400 text-black shadow-lg scale-110' : 'hover:bg-zinc-800 text-white'}`}
      >
        <Type size={20} className="md:w-6 md:h-6" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-zinc-700 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-zinc-900">
          1
        </span>
      </button>
      
      <button 
        onClick={() => handleToolClick('TEXT2')}
        className={`relative p-2 md:p-3 rounded-xl md:rounded-2xl transition-all active:scale-90 ${activeTool === 'TEXT2' ? 'bg-yellow-400 text-black shadow-lg scale-110' : 'hover:bg-zinc-800 text-white'}`}
      >
        <Type size={16} className="md:w-5 md:h-5" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-zinc-700 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-zinc-900">
          2
        </span>
      </button>
      
      {/* IMAGES TOOL */}
      <button 
        onClick={() => handleToolClick('IMAGES')}
        className={`p-2 md:p-3 rounded-xl md:rounded-2xl transition-all active:scale-90 ${activeTool === 'IMAGES' ? 'bg-yellow-400 text-black shadow-lg scale-110' : 'hover:bg-zinc-800 text-white'}`}
      >
        <Images size={20} className="md:w-6 md:h-6" />
      </button>
      
      {/* MAGIC TOOL */}
      <button 
        onClick={() => handleToolClick('MAGIC')}
        disabled={!selectedLogoId}
        className={`p-2 md:p-3 rounded-xl md:rounded-2xl transition-all active:scale-90 ${activeTool === 'MAGIC' ? 'bg-yellow-400 text-black shadow-lg scale-110' : selectedLogoId ? 'hover:bg-zinc-800 text-white' : 'text-zinc-600 cursor-not-allowed opacity-50'}`}
      >
        <Wand2 size={20} className="md:w-6 md:h-6" />
      </button>
      
      <div className="w-8 h-px bg-zinc-800 my-0.5"></div>
      
      {/* DELETE TOOL */}
      <button 
        onClick={handleDeleteSelected}
        disabled={!selectedElementId}
        className={`p-2 md:p-3 rounded-xl md:rounded-2xl transition-all active:scale-90 ${selectedElementId ? 'text-red-500 hover:bg-red-500/20' : 'text-zinc-600 cursor-not-allowed'}`}
      >
        <Trash2 size={18} className="md:w-5 md:h-5" />
      </button>
      
      <div className="w-8 h-px bg-zinc-800 my-0.5"></div>
      
      {/* SETTINGS TOOL */}
      <button 
        onClick={() => handleToolClick('SETTINGS')}
        className={`p-2 md:p-3 rounded-xl md:rounded-2xl transition-all active:scale-90 ${activeTool === 'SETTINGS' ? 'bg-yellow-400 text-black shadow-lg scale-110' : 'hover:bg-zinc-800 text-white'}`}
      >
        <Settings size={18} className="md:w-6 md:h-6" />
      </button>
    </div>
  );
};

export default ProgressiveToolBar;