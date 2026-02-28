import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Save,
  RotateCw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  User,
  Upload,
  ImageIcon,
  Trash2,
  Undo2,
} from 'lucide-react';
import templateApi, { type IdCardLayoutItem } from '../api/templates';

/* ==========================================================================
   DEFAULT LAYOUTS
   ========================================================================== */

const DEFAULT_FRONT: IdCardLayoutItem[] = [
  { id: 'photo',      label: 'Photo',      top: 47,   left: 6.5,  fontSize: 0,   maxWidth: 27.5, maxHeight: 43.5 },
  { id: 'fullName',   label: 'Full Name',   top: 52,   left: 64.5, fontSize: 2.8, maxWidth: null },
  { id: 'disability', label: 'Disability',   top: 66,   left: 64.5, fontSize: 2.4, maxWidth: null },
  { id: 'pwdNumber',  label: 'PWD Number',   top: 91.5, left: 20.5, fontSize: 2.1, maxWidth: null },
];

const DEFAULT_BACK: IdCardLayoutItem[] = [
  { id: 'address',    label: 'Address',         top: 13.5, left: 21.5, fontSize: 1.8, maxWidth: 73 },
  { id: 'dob',        label: 'Date of Birth',   top: 19.5, left: 32,   fontSize: 1.8, maxWidth: null },
  { id: 'sex',        label: 'Sex',             top: 19.5, left: 78,   fontSize: 1.8, maxWidth: null },
  { id: 'dateIssued', label: 'Date Issued',     top: 25.5, left: 32,   fontSize: 1.8, maxWidth: null },
  { id: 'bloodType',  label: 'Blood Type',      top: 25.5, left: 78,   fontSize: 2.0, maxWidth: null },
  { id: 'guardian',   label: 'Parent/Guardian',  top: 44.5, left: 45,   fontSize: 1.8, maxWidth: 50 },
  { id: 'contactNo',  label: 'Contact No.',     top: 51,   left: 28,   fontSize: 1.8, maxWidth: null },
];

const SAMPLE_DATA: Record<string, string> = {
  fullName: 'JUAN A. DELA CRUZ JR.',
  disability: 'Physical Disability',
  pwdNumber: 'PWD-2025-00001',
  address: '123 Rizal St., Brgy. San Isidro',
  dob: '1990-01-15',
  sex: 'Male',
  dateIssued: '2025-01-01',
  bloodType: 'O+',
  guardian: 'Maria Dela Cruz',
  contactNo: '0917-123-4567',
};

function cloneLayout(items: IdCardLayoutItem[]): IdCardLayoutItem[] {
  return items.map(i => ({ ...i }));
}

/* ==========================================================================
   DRAGGABLE + RESIZABLE FIELD
   ========================================================================== */

interface DraggableFieldProps {
  item: IdCardLayoutItem;
  value: string;
  containerRef: React.RefObject<HTMLDivElement>;
  onChange: (id: string, updates: Partial<IdCardLayoutItem>) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
  isPhoto?: boolean;
}

const DraggableField: React.FC<DraggableFieldProps> = ({
  item, value, containerRef, onChange, isSelected, onSelect, isPhoto,
}) => {
  const [mode, setMode] = useState<'idle' | 'dragging' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br' | 'resizing'>('idle');
  const startRef = useRef({ x: 0, y: 0, top: 0, left: 0, fontSize: 0, maxWidth: 0, maxHeight: 0 });

  const isCentering = item.id === 'fullName' || item.id === 'disability';

  /* ---- DRAG (move) ---- */
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(item.id);
    setMode('dragging');
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY, top: item.top, left: item.left, fontSize: item.fontSize, maxWidth: item.maxWidth || 100, maxHeight: item.maxHeight || 43.5 };
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!containerRef.current || mode === 'idle') return;
    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - startRef.current.x) / rect.width) * 100;
    const deltaY = ((e.clientY - startRef.current.y) / rect.height) * 100;

    if (mode === 'dragging') {
      onChange(item.id, {
        left: Math.round(Math.max(-5, Math.min(105, startRef.current.left + deltaX)) * 10) / 10,
        top: Math.round(Math.max(-5, Math.min(105, startRef.current.top + deltaY)) * 10) / 10,
      });
    } else if (mode.startsWith('resize-') && isPhoto) {
      // Free transform for photo: each corner controls width + height
      const updates: Partial<IdCardLayoutItem> = {};

      if (mode === 'resize-br') {
        updates.maxWidth = Math.round(Math.max(10, Math.min(60, startRef.current.maxWidth + deltaX)) * 10) / 10;
        updates.maxHeight = Math.round(Math.max(10, Math.min(80, startRef.current.maxHeight + deltaY)) * 10) / 10;
      } else if (mode === 'resize-bl') {
        const newW = Math.round(Math.max(10, Math.min(60, startRef.current.maxWidth - deltaX)) * 10) / 10;
        updates.maxWidth = newW;
        updates.maxHeight = Math.round(Math.max(10, Math.min(80, startRef.current.maxHeight + deltaY)) * 10) / 10;
        updates.left = Math.round((startRef.current.left + (startRef.current.maxWidth - newW)) * 10) / 10;
      } else if (mode === 'resize-tr') {
        updates.maxWidth = Math.round(Math.max(10, Math.min(60, startRef.current.maxWidth + deltaX)) * 10) / 10;
        const newH = Math.round(Math.max(10, Math.min(80, startRef.current.maxHeight - deltaY)) * 10) / 10;
        updates.maxHeight = newH;
        updates.top = Math.round((startRef.current.top + (startRef.current.maxHeight - newH)) * 10) / 10;
      } else if (mode === 'resize-tl') {
        const newW = Math.round(Math.max(10, Math.min(60, startRef.current.maxWidth - deltaX)) * 10) / 10;
        const newH = Math.round(Math.max(10, Math.min(80, startRef.current.maxHeight - deltaY)) * 10) / 10;
        updates.maxWidth = newW;
        updates.maxHeight = newH;
        updates.left = Math.round((startRef.current.left + (startRef.current.maxWidth - newW)) * 10) / 10;
        updates.top = Math.round((startRef.current.top + (startRef.current.maxHeight - newH)) * 10) / 10;
      }

      onChange(item.id, updates);
    } else if (mode === 'resizing') {
      // Text field: horizontal movement changes fontSize
      const deltaScale = (e.clientX - startRef.current.x) / 80;
      onChange(item.id, {
        fontSize: Math.round(Math.max(0.5, Math.min(6, startRef.current.fontSize + deltaScale * 0.3)) * 10) / 10,
      });
    }
  }, [mode, item.id, containerRef, onChange, isPhoto]);

  const handlePointerUp = useCallback(() => setMode('idle'), []);

  /* ---- RESIZE handle (for text) ---- */
  const handleResizeDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(item.id);
    setMode('resizing');
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY, top: item.top, left: item.left, fontSize: item.fontSize, maxWidth: item.maxWidth || 27.5, maxHeight: item.maxHeight || 43.5 };
  };

  /* ---- PHOTO corner resize handles ---- */
  const handleCornerDown = (corner: 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br') => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(item.id);
    setMode(corner);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY, top: item.top, left: item.left, fontSize: item.fontSize, maxWidth: item.maxWidth || 27.5, maxHeight: item.maxHeight || 43.5 };
  };

  const photoW = isPhoto ? (item.maxWidth || 27.5) : 0;
  const photoH = isPhoto ? (item.maxHeight || 43.5) : 0;

  /* --- PHOTO --- */
  if (isPhoto) {
    return (
      <div
        className={`absolute select-none touch-none ${mode === 'dragging' ? 'cursor-grabbing z-50' : 'cursor-grab z-10'} ${isSelected ? 'ring-2 ring-blue-500 z-30' : ''}`}
        style={{ top: `${item.top}%`, left: `${item.left}%`, width: `${photoW}%`, height: `${photoH}%` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="w-full h-full bg-slate-200 border border-black/40 flex items-center justify-center overflow-hidden">
          <div className="flex flex-col items-center gap-0.5 opacity-60">
            <User className="text-slate-400" size={18} />
            <span className="text-[5px] font-bold uppercase text-slate-400">Photo</span>
          </div>
        </div>
        {/* Label */}
        <div className={`absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[7px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap z-50 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`}>
          Photo
        </div>
        {/* Free transform: 4 corner resize handles */}
        {isSelected && (
          <>
            <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-nw-resize z-50"
              onPointerDown={handleCornerDown('resize-tl')} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} />
            <div className="absolute -right-1.5 -top-1.5 w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-ne-resize z-50"
              onPointerDown={handleCornerDown('resize-tr')} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} />
            <div className="absolute -left-1.5 -bottom-1.5 w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-sw-resize z-50"
              onPointerDown={handleCornerDown('resize-bl')} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} />
            <div className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-se-resize z-50"
              onPointerDown={handleCornerDown('resize-br')} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} />
          </>
        )}
      </div>
    );
  }

  /* --- TEXT FIELD --- */
  const isBloodType = item.id === 'bloodType';

  return (
    <div
      className={`absolute select-none touch-none group ${mode === 'dragging' ? 'cursor-grabbing z-50' : 'cursor-grab z-10'} ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-500/10 z-30' : 'hover:ring-1 hover:ring-blue-400/40'
      }`}
      style={{
        top: `${item.top}%`,
        left: `${item.left}%`,
        transform: isCentering ? 'translateX(-50%)' : 'none',
        maxWidth: item.maxWidth ? `${item.maxWidth}%` : undefined,
        padding: '1px 3px',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <p
        className={`leading-tight whitespace-nowrap ${
          isCentering ? 'font-black uppercase tracking-wide font-serif text-center' : 'font-bold font-sans text-left'
        } ${isBloodType ? 'text-rose-600 font-black' : 'text-slate-900'} ${item.maxWidth ? 'truncate' : ''}`}
        style={{ fontSize: `${item.fontSize}cqw`, lineHeight: 1.15 }}
      >
        {value || '\u00A0'}
      </p>
      {/* Label tooltip */}
      <div className={`absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[7px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap z-50 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'}`}>
        {item.label} ({item.fontSize}cqw)
      </div>
      {/* Resize handle (bottom-right corner) */}
      {isSelected && (
        <div
          className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-se-resize z-50"
          onPointerDown={handleResizeDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      )}
    </div>
  );
};

/* ==========================================================================
   IMAGE UPLOAD CARD
   ========================================================================== */

interface ImageUploadProps {
  side: 'front' | 'back';
  currentUrl: string | null;
  defaultUrl: string;
  onUploaded: (url: string) => void;
  onReverted: () => void;
}

const ImageUploadCard: React.FC<ImageUploadProps> = ({ side, currentUrl, defaultUrl, onUploaded, onReverted }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError('');
    try {
      const result = await templateApi.uploadImage(side, file);
      onUploaded(result.image_url);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRevert = async () => {
    setIsReverting(true);
    setError('');
    try {
      await templateApi.revertImage(side);
      onReverted();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Revert failed.');
    } finally {
      setIsReverting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = '';
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <ImageIcon size={14} className="text-blue-500" />
          {side === 'front' ? 'Front' : 'Back'} Template Image
        </span>
        <div className="flex items-center gap-1.5">
          {currentUrl && (
            <button
              onClick={handleRevert}
              disabled={isReverting || isUploading}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg text-[10px] font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 disabled:opacity-50 transition-colors"
            >
              {isReverting ? <Loader2 size={10} className="animate-spin" /> : <Undo2 size={10} />}
              {isReverting ? 'Reverting...' : 'Revert to Default'}
            </button>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={isUploading || isReverting}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
          >
            {isUploading ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />}
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
      </div>
      <div className="aspect-[85.6/53.98] rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
        <img
          src={currentUrl || defaultUrl}
          alt={`${side} template`}
          className="w-full h-full object-fill"
        />
      </div>
      {currentUrl && (
        <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">Custom image active</p>
      )}
      {error && <p className="text-[9px] text-red-500 font-medium">{error}</p>}
    </div>
  );
};

/* ==========================================================================
   MAIN: ID LAYOUT EDITOR
   ========================================================================== */

const IdLayoutEditor: React.FC = () => {
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [frontLayout, setFrontLayout] = useState<IdCardLayoutItem[]>(cloneLayout(DEFAULT_FRONT));
  const [backLayout, setBackLayout] = useState<IdCardLayoutItem[]>(cloneLayout(DEFAULT_BACK));
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [frontImageUrl, setFrontImageUrl] = useState<string | null>(null);
  const [backImageUrl, setBackImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  /* ---- Load template from DB ---- */
  useEffect(() => {
    (async () => {
      try {
        const data = await templateApi.getActive();
        if (data.front?.length) setFrontLayout(data.front.map(f => ({ ...f })));
        if (data.back?.length) setBackLayout(data.back.map(b => ({ ...b })));
        if (data.front_image) setFrontImageUrl(data.front_image);
        if (data.back_image) setBackImageUrl(data.back_image);
      } catch (err) {
        console.warn('No saved template found, using defaults.', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  /* ---- Update a field ---- */
  const updateField = useCallback(
    (id: string, updates: Partial<IdCardLayoutItem>) => {
      if (activeSide === 'front') {
        setFrontLayout(prev => prev.map(item => (item.id === id ? { ...item, ...updates } : item)));
      } else {
        setBackLayout(prev => prev.map(item => (item.id === id ? { ...item, ...updates } : item)));
      }
    },
    [activeSide]
  );

  /* ---- Save ---- */
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMsg('');
    try {
      await templateApi.saveBoth(frontLayout, backLayout);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      setSaveStatus('error');
      setErrorMsg(err?.response?.data?.message || 'Failed to save template.');
    } finally {
      setIsSaving(false);
    }
  };

  /* ---- Reset ---- */
  const handleReset = () => {
    if (activeSide === 'front') setFrontLayout(cloneLayout(DEFAULT_FRONT));
    else setBackLayout(cloneLayout(DEFAULT_BACK));
  };

  /* ---- Deselect on background click ---- */
  const handleCardClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'IMG') {
      setSelectedField(null);
    }
  };

  const currentLayout = activeSide === 'front' ? frontLayout : backLayout;
  const currentBgImage = activeSide === 'front'
    ? (frontImageUrl || '/pdao-id-front.jpg')
    : (backImageUrl || '/pdao-id-back.jpg');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <CreditCard size={24} className="text-blue-600" />
            ID Card Layout Editor
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Drag fields to move. Drag the <span className="text-blue-500 font-semibold">blue corner handle</span> to resize. Changes apply to <strong>all users</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-500 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-300 dark:hover:bg-amber-900/20 dark:hover:text-amber-400 transition-all"
          >
            <RotateCw size={12} />
            Reset {activeSide === 'front' ? 'Front' : 'Back'}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:bg-blue-400 shadow-lg shadow-blue-600/20 transition-all"
          >
            {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            {isSaving ? 'Saving...' : 'Save Layout'}
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {saveStatus === 'success' && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Layout saved! All users will see the updated positions.</p>
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-600" />
          <p className="text-xs font-bold text-red-700 dark:text-red-300">{errorMsg}</p>
        </div>
      )}

      {/* Side Tabs */}
      <div className="flex justify-center">
        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          {(['front', 'back'] as const).map(side => (
            <button
              key={side}
              onClick={() => { setActiveSide(side); setSelectedField(null); }}
              className={`px-8 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                activeSide === side
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              {side}
            </button>
          ))}
        </div>
      </div>

      {/* Card Preview — matches Generate ID Modal size for consistency */}
      <div className="flex justify-center">
        <div
          ref={cardRef}
          className="relative w-full max-w-[540px] aspect-[85.6/53.98] shadow-2xl rounded-2xl overflow-hidden bg-white cursor-default"
          style={{ containerType: 'inline-size' }}
          onClick={handleCardClick}
        >
          {/* eslint-disable-next-line */}
          <img
            src={currentBgImage}
            alt={`PDAO ID ${activeSide}`}
            className="absolute inset-0 w-full h-full object-fill pointer-events-none"
          />
          <div className="relative z-10 w-full h-full font-sans text-slate-900">
            {currentLayout.map(item => (
              <DraggableField
                key={item.id}
                item={item}
                value={SAMPLE_DATA[item.id] || ''}
                containerRef={cardRef as React.RefObject<HTMLDivElement>}
                onChange={updateField}
                isSelected={selectedField === item.id}
                onSelect={setSelectedField}
                isPhoto={item.id === 'photo'}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Template Image Upload Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <ImageIcon size={16} className="text-blue-600" />
          Change ID Card Design
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Upload new template images when the ID card design changes. Accepted formats: JPG, PNG, WebP. Max 5 MB.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ImageUploadCard
            side="front"
            currentUrl={frontImageUrl}
            defaultUrl="/pdao-id-front.jpg"
            onUploaded={(url) => setFrontImageUrl(url)}
            onReverted={() => setFrontImageUrl(null)}
          />
          <ImageUploadCard
            side="back"
            currentUrl={backImageUrl}
            defaultUrl="/pdao-id-back.jpg"
            onUploaded={(url) => setBackImageUrl(url)}
            onReverted={() => setBackImageUrl(null)}
          />
        </div>
      </div>
    </div>
  );
};

export default IdLayoutEditor;
