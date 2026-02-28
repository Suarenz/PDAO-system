import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Camera,
  Upload,
  Printer,
  RotateCcw,
  User,
  IdCard,
  Maximize2
} from 'lucide-react';
import { PwdProfileFull } from '../api/client';
import templateApi, { type IdCardLayoutItem } from '../api/templates';

interface GenerateIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  pwdData: PwdProfileFull | null;
}

interface LayoutItem {
  top: number;
  left: number;
  width?: number;
  height?: number;
  fontSize: number;
  label: string;
  value: string;
  id: string;
  zoom?: number;
  offsetX?: number;
  offsetY?: number;
}

/* ============================================================================
   HELPERS
   ============================================================================ */

/**
 * Auto-scaling font logic to fit text within a maximum width
 */
const getAutoScaledSize = (text: string, baseSize: number, maxWidthPx: number) => {
  if (typeof document === 'undefined') return baseSize;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return baseSize;
  
  let currentSize = baseSize;
  context.font = `bold ${currentSize}px "Arial"`;
  
  // Max width is usually about 40% of card width for these fields
  while (context.measureText(text).width > maxWidthPx && currentSize > 4) {
    currentSize -= 0.1; // Finer precision
    context.font = `bold ${currentSize}px "Arial"`;
  }
  return currentSize;
};

/* ============================================================================
   DRAGGABLE ITEM COMPONENT
   ============================================================================ */

interface DraggableItemProps {
  item: LayoutItem;
  containerRef: React.RefObject<HTMLDivElement>;
  onChange: (id: string, updates: Partial<LayoutItem>) => void;
  isPhoto?: boolean;
  photo?: string | null;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ item, containerRef, onChange, isPhoto, photo }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [resizeType, setResizeType] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const startPos = useRef({ x: 0, y: 0, top: 0, left: 0, width: 0, height: 0, fontSize: 0, offsetX: 0, offsetY: 0 });

  const handleMouseDown = (e: React.MouseEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (type === 'move') {
      if (e.ctrlKey && isPhoto) setIsPanning(true);
      else setIsDragging(true);
    }
    else setResizeType(type);

    startPos.current = {
      x: e.clientX,
      y: e.clientY,
      top: item.top,
      left: item.left,
      width: item.width || 0,
      height: item.height || 0,
      fontSize: item.fontSize,
      offsetX: item.offsetX || 0,
      offsetY: item.offsetY || 0
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging && !resizeType && !isPanning) return;
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const deltaX = ((e.clientX - startPos.current.x) / containerRect.width) * 100;
      const deltaY = ((e.clientY - startPos.current.y) / containerRect.height) * 100;

      if (isDragging) {
        onChange(item.id, {
          left: Math.max(-100, Math.min(200, startPos.current.left + deltaX)),
          top: Math.max(-100, Math.min(200, startPos.current.top + deltaY))
        });
      } else if (isPanning) {
        const panX = (e.clientX - startPos.current.x);
        const panY = (e.clientY - startPos.current.y);
        onChange(item.id, {
          offsetX: startPos.current.offsetX + panX,
          offsetY: startPos.current.offsetY + panY
        });
      } else if (resizeType) {
        const updates: Partial<LayoutItem> = {};
        if (isPhoto) {
          // Corner handles are resize-tl, resize-tr, resize-bl, resize-br
          const suffix = resizeType.replace('resize-', '');
          if (suffix.includes('r')) updates.width = Math.max(5, startPos.current.width + deltaX);
          if (suffix.includes('l')) {
            const added = -deltaX;
            updates.width = Math.max(5, startPos.current.width + added);
            updates.left = startPos.current.left - added;
          }
          if (suffix.includes('b')) updates.height = Math.max(5, startPos.current.height + deltaY);
          if (suffix.includes('t')) {
            const added = -deltaY;
            updates.height = Math.max(5, startPos.current.height + added);
            updates.top = startPos.current.top - added;
          }
          
          // Free-form resize: no aspect ratio constraint (matches ID Card Layout Editor behavior)
        } else {
          const newFontSize = Math.max(4, startPos.current.fontSize + (deltaX * 0.2));
          updates.fontSize = newFontSize;
        }
        onChange(item.id, updates);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsPanning(false);
      setResizeType(null);
    };

    if (isDragging || resizeType || isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, resizeType, isPanning, item, containerRef, onChange, isPhoto]);

  const handleWheel = (e: React.WheelEvent) => {
    if (isPhoto) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.95 : 1.05;
      const currentZoom = item.zoom || 1;
      const newZoom = Math.max(0.1, Math.min(5, currentZoom * delta));
      onChange(item.id, { zoom: newZoom });
    }
  };

  const isCenteringNeeded = item.id === 'fullName' || item.id === 'disability';
  const displayFontSize = isCenteringNeeded 
    ? getAutoScaledSize(item.value, item.fontSize, 280) // 280px is max width for name section
    : item.fontSize;

  return (
    <div
      style={{
        position: 'absolute',
        top: `${item.top}%`,
        left: `${item.left}%`,
        width: isPhoto ? `${item.width}%` : 'auto',
        height: isPhoto ? `${item.height}%` : 'auto',
        transform: isCenteringNeeded ? 'translateX(-50%)' : 'none',
        cursor: isDragging ? 'grabbing' : (isPanning ? 'move' : 'grab'),
        border: (isDragging || resizeType || isPanning) ? '1px dashed #3b82f6' : '1px solid transparent',
        backgroundColor: (isDragging || resizeType || isPanning) ? 'rgba(59,130,246,0.1)' : 'transparent',
        padding: isPhoto ? '0' : '1px 2px',
        zIndex: (isDragging || resizeType || isPanning) ? 50 : 10,
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCenteringNeeded ? 'center' : 'flex-start',
        whiteSpace: 'nowrap',
        fontFamily: isCenteringNeeded ? 'Georgia, "Times New Roman", serif' : 'Arial, sans-serif'
      }}
      onMouseDown={(e) => handleMouseDown(e, 'move')}
      onWheel={handleWheel}
      className="group hover:border-blue-400/50 hover:bg-blue-50/5 rounded transition-colors"
    >
      {isPhoto ? (
        <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-slate-100 border-2 border-black/50 shadow-inner">
          {photo ? (
            <img 
              src={photo} 
              alt="ID" 
              className="w-full h-full object-cover origin-center" 
              style={{
                transform: `scale(${item.zoom || 1}) translate(${(item.offsetX || 0) / (item.zoom || 1)}px, ${(item.offsetY || 0) / (item.zoom || 1)}px)`,
              }}
            />
          ) : (
            <div className="flex flex-col items-center gap-1 opacity-40">
              <User size={Math.min(32, (item.width || 0) * 1.5)} />
              <span className="text-[6px] font-bold uppercase">Photo Placeholder</span>
            </div>
          )}
          {isPhoto && photo && (
             <div className="absolute inset-x-0 bottom-0 bg-black/50 text-[8px] text-white text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
               Scroll to zoom • Ctrl+Drag to pan
             </div>
          )}
        </div>
      ) : (
        <span style={{ 
          fontSize: `${displayFontSize}px`, 
          fontWeight: (item.id === 'fullName' || item.id === 'disability') ? 800 : 700,
          color: item.id === 'bloodType' ? '#dc2626' : '#000000',
          textTransform: (item.id === 'fullName' || item.id === 'disability') ? 'uppercase' : 'none',
          lineHeight: 1,
          textAlign: isCenteringNeeded ? 'center' : 'left'
        }}>
          {item.value || ''}
        </span>
      )}

      {/* Resize Handles */}
      <div onMouseDown={(e) => handleMouseDown(e, 'resize-tl')} className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-600 rounded-full opacity-0 group-hover:opacity-100 cursor-nw-resize z-50 shadow-sm border border-white" />
      <div onMouseDown={(e) => handleMouseDown(e, 'resize-tr')} className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-600 rounded-full opacity-0 group-hover:opacity-100 cursor-ne-resize z-50 shadow-sm border border-white" />
      <div onMouseDown={(e) => handleMouseDown(e, 'resize-bl')} className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-blue-600 rounded-full opacity-0 group-hover:opacity-100 cursor-sw-resize z-50 shadow-sm border border-white" />
      <div onMouseDown={(e) => handleMouseDown(e, 'resize-br')} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-600 rounded-full opacity-0 group-hover:opacity-100 cursor-se-resize z-50 shadow-sm border border-white" />
    </div>
  );
};

const GenerateIdModal: React.FC<GenerateIdModalProps> = ({
  isOpen,
  onClose,
  pwdData
}) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [activeTab, setActiveTab] = useState<'front' | 'back'>('front');
  const [frontImageUrl, setFrontImageUrl] = useState<string | null>(null);
  const [backImageUrl, setBackImageUrl] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const previewWrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Responsive scaling factor
  const [scaleFactor, setScaleFactor] = useState(1);

  // Handle responsive scaling
  useEffect(() => {
    const updateScale = () => {
      if (previewWrapperRef.current) {
        const parentWidth = previewWrapperRef.current.offsetWidth - 48; // padding
        const newScale = Math.min(1, parentWidth / 540);
        setScaleFactor(newScale);
      }
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [isOpen]);

  // Ensure camera stream is attached to video element
  useEffect(() => {
    if (showCamera && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [showCamera, cameraStream]);

  // ---- Dynamic Layout State ----
  const [frontLayout, setFrontLayout] = useState<LayoutItem[]>([]);
  const [backLayout, setBackLayout] = useState<LayoutItem[]>([]);

  // Initialize Layout from data — load from DB template + populate values from pwdData
  useEffect(() => {
    if (!pwdData) return;

    const clean = (val: string | null | undefined) => {
      if (!val || val.toUpperCase() === 'N/A') return '';
      return val.trim();
    };

    const fullName = [clean(pwdData.last_name), ', ', clean(pwdData.first_name), ' ', clean(pwdData.middle_name), pwdData.suffix ? ` ${clean(pwdData.suffix)}` : '']
      .join('').replace(/\s+/g, ' ').replace(/^, /, '').trim();

    const dobValue = clean(pwdData.personal_info?.birth_date);
    const dob = dobValue
      ? new Date(dobValue).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : '';

    const address = pwdData.address
      ? [clean(pwdData.address.house_street), pwdData.address.barangay_name ? `Brgy. ${clean(pwdData.address.barangay_name)}` : '', clean(pwdData.address.city)].filter(Boolean).join(', ')
      : '';

    // Guardian/Parent/Spouse selection logic (include only 1)
    const familyMembers = pwdData.family_members || [];
    const guardian = familyMembers.find(f => f.relation_type === 'Guardian') 
                  || familyMembers.find(f => f.relation_type === 'Spouse')
                  || familyMembers.find(f => f.relation_type === 'Father')
                  || familyMembers.find(f => f.relation_type === 'Mother')
                  || familyMembers[0]; // Fallback to first member

    const guardianName = guardian ? [clean(guardian.first_name), clean(guardian.last_name)].filter(Boolean).join(' ') : '';
    const guardianLabel = guardian?.relation_type || 'Parent/Guardian';
    const contactNo = clean(pwdData.contacts?.guardian_contact || pwdData.contacts?.mobile || '');

    /** Map field id to its display value */
    const valueMap: Record<string, string> = {
      fullName,
      disability: (pwdData.disabilities || []).map(d => clean(d.disability_type_name)).filter(Boolean).join(', '),
      pwdNumber: clean(pwdData.pwd_number),
      address,
      dob,
      sex: clean(pwdData.personal_info?.sex),
      dateIssued: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      bloodType: clean(pwdData.personal_info?.blood_type),
      guardian: guardianName,
      contactNo,
    };

    /** Convert a DB layout item (cqw units) to modal LayoutItem (px units for 540px container) */
    const CQW_TO_PX = 5.4; // 540px / 100
    const toModalItem = (dbItem: IdCardLayoutItem, side: 'front' | 'back'): LayoutItem => {
      if (dbItem.id === 'photo') {
        return {
          id: dbItem.id,
          label: dbItem.label,
          value: '',
          top: dbItem.top,
          left: dbItem.left,
          width: dbItem.maxWidth || 27.5,
          height: (dbItem as any).maxHeight || 43.5,
          fontSize: 0,
          zoom: 1,
          offsetX: 0,
          offsetY: 0,
        };
      }
      return {
        id: dbItem.id,
        label: dbItem.id === 'guardian' ? guardianLabel : dbItem.label,
        value: valueMap[dbItem.id] || '',
        top: dbItem.top,
        left: dbItem.left,
        fontSize: dbItem.fontSize * CQW_TO_PX,
      };
    };

    // Default fallback layouts (pixel-based, 540px container)
    const defaultFront: LayoutItem[] = [
      { id: 'photo', label: 'Photo', value: '', top: 47, left: 6.5, width: 27.5, height: 43.5, fontSize: 0, zoom: 1, offsetX: 0, offsetY: 0 },
      { id: 'fullName', label: 'Full Name', value: fullName, top: 52, left: 64.5, fontSize: 13.5 },
      { id: 'disability', label: 'Type of Disability', value: valueMap.disability, top: 65.5, left: 64.5, fontSize: 13 },
      { id: 'pwdNumber', label: 'ID No.', value: clean(pwdData.pwd_number), top: 91.5, left: 20.5, fontSize: 11 },
    ];
    const defaultBack: LayoutItem[] = [
      { id: 'address', label: 'Address', value: address, top: 13.5, left: 21.5, fontSize: 9.5 },
      { id: 'dob', label: 'Date of Birth', value: dob, top: 19.5, left: 32, fontSize: 10 },
      { id: 'sex', label: 'Sex', value: clean(pwdData.personal_info?.sex), top: 19.5, left: 78, fontSize: 10 },
      { id: 'dateIssued', label: 'Date Issued', value: valueMap.dateIssued, top: 25.5, left: 32, fontSize: 10 },
      { id: 'bloodType', label: 'Blood Type', value: clean(pwdData.personal_info?.blood_type), top: 25.5, left: 78, fontSize: 11 },
      { id: 'guardian', label: guardianLabel, value: guardianName, top: 44.5, left: 45, fontSize: 10 },
      { id: 'contactNo', label: 'Contact Number', value: contactNo, top: 51, left: 28, fontSize: 10 },
    ];

    // Try to load from DB template first, then fall back to defaults
    (async () => {
      try {
        const data = await templateApi.getActive();
        if (data.front_image) setFrontImageUrl(data.front_image);
        if (data.back_image) setBackImageUrl(data.back_image);

        if (data.front?.length) {
          setFrontLayout(data.front.map(item => toModalItem(item, 'front')));
        } else {
          setFrontLayout(defaultFront);
        }
        if (data.back?.length) {
          setBackLayout(data.back.map(item => toModalItem(item, 'back')));
        } else {
          setBackLayout(defaultBack);
        }
      } catch (err) {
        console.warn('Could not load DB template for modal, using defaults.', err);
        setFrontLayout(defaultFront);
        setBackLayout(defaultBack);
      }
    })();
  }, [pwdData]);

  const updateLayout = (id: string, updates: Partial<LayoutItem>) => {
    if (activeTab === 'front') {
      setFrontLayout(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    } else {
      setBackLayout(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    }
  };

  // ---- Camera Functions ----
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 640 } });
      setCameraStream(stream);
      setShowCamera(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error('Camera access denied:', err);
    }
  };

  const stopCamera = () => {
    if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
    setCameraStream(null);
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const size = Math.min(videoRef.current.videoWidth, videoRef.current.videoHeight);
    canvasRef.current.width = size;
    canvasRef.current.height = size;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, (videoRef.current.videoWidth - size) / 2, (videoRef.current.videoHeight - size) / 2, size, size, 0, 0, size, size);
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
      setPhoto(dataUrl);
      // Smart Auto-Center logic
      updateLayout('photo', { zoom: 1.35, offsetX: 0, offsetY: -15 });
    }
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPhoto(dataUrl);
      // Smart Auto-Center logic
      updateLayout('photo', { zoom: 1.35, offsetX: 0, offsetY: -15 });
    };
    reader.readAsDataURL(file);
  };

  const handlePrint = () => {
    const origin = window.location.origin;
    
    // Create or get hidden iframe for "Same Page" print experience
    let iframe = document.getElementById('print-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ID Print Preview</title>
  <style>
    * { box-sizing: border-box; }
    @media print { 
      @page { size: portrait; margin: 5mm; } 
      body { margin: 0; padding: 0; background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .card { margin: 0; break-inside: avoid; border: none !important; box-shadow: none !important; }
      .card:first-child { margin-bottom: 15mm !important; }
      .print-container { gap: 0 !important; padding: 0 !important; display: flex; flex-direction: column; align-items: center; }
    }
    body { background: white; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; }
    .print-container { display: flex; flex-direction: column; align-items: center; gap: 30px; }
    .card { width: 85.6mm; height: 53.98mm; position: relative; background-size: cover; background-position: center; background-color: white; overflow: hidden; flex-shrink: 0; }
    .field { position: absolute; white-space: nowrap; line-height: 1; font-weight: 700; pointer-events: none; }
    .field-header { font-family: Georgia, "Times New Roman", serif; }
    .field-normal { font-family: "Arial", sans-serif; }
    .photo { position: absolute; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #fff; border: 0.5mm solid rgba(0,0,0,0.3); }
    .photo img { width: 100%; height: 100%; object-fit: cover; }
  </style>
</head>
<body>
  <div class="print-container">
    <div class="card" style="background-image: url('${frontImageUrl || `${origin}/pdao-id-front.jpg`}')">
      ${frontLayout.map(item => {
        if (item.id === 'photo') {
          const z = item.zoom || 1;
          const mmFactor = 0.1585;
          const ox = ((item.offsetX || 0) * mmFactor) / z;
          const oy = ((item.offsetY || 0) * mmFactor) / z;
          return `<div class="photo" style="top:${item.top}%; left:${item.left}%; width:${item.width}%; height:${item.height}%;">${photo ? `<img src="${photo}" style="transform: scale(${z}) translate(${ox}mm, ${oy}mm); transform-origin: center; width: 100%; height: 100%; object-fit: cover;"/>` : ''}</div>`;
        }
        const isHeader = item.id === 'fullName' || item.id === 'disability';
        const scaledSize = isHeader ? getAutoScaledSize(item.value, item.fontSize, 280) : item.fontSize;
        const mmSize = (scaledSize * 0.1585).toFixed(3);
        return `<div class="field ${isHeader ? 'field-header' : 'field-normal'}" style="top:${item.top}%; left:${item.left}%; font-size:${mmSize}mm; font-weight:${isHeader ? 800 : 700}; text-transform:${isHeader ? 'uppercase' : 'none'}; letter-spacing:${isHeader ? '0.05em' : 'normal'}; color:${item.id === 'bloodType' ? 'red' : 'black'}; ${isHeader ? 'transform: translateX(-50%); text-align: center;' : ''}">${item.value}</div>`;
      }).join('')}
    </div>
    <div class="card" style="background-image: url('${backImageUrl || `${origin}/pdao-id-back.jpg`}')">
      ${backLayout.map(item => {
        const isHeader = item.id === 'fullName' || item.id === 'disability';
        const scaledSize = isHeader ? getAutoScaledSize(item.value, item.fontSize, 280) : item.fontSize;
        const mmSize = (scaledSize * 0.1585).toFixed(3);
        return `<div class="field ${isHeader ? 'field-header' : 'field-normal'}" style="top:${item.top}%; left:${item.left}%; font-size:${mmSize}mm; font-weight:${isHeader ? 800 : 700}; text-transform:${isHeader ? 'uppercase' : 'none'}; letter-spacing:${isHeader ? '0.05em' : 'normal'}; color:${item.id === 'bloodType' ? 'red' : 'black'}; ${isHeader ? 'transform: translateX(-50%); text-align: center;' : ''}">${item.value}</div>`;
      }).join('')}
    </div>
  </div>
  <script>window.onload = () => { setTimeout(() => { window.focus(); window.print(); }, 500); };</script>
</body>
</html>`;

    const iframeWin = iframe.contentWindow;
    if (iframeWin) {
      iframeWin.document.open();
      iframeWin.document.write(printContent);
      iframeWin.document.close();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[8px]" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-10 py-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
              <IdCard size={28} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Generate ID Personalization</h3>
              <p className="text-slate-500 font-medium tracking-tight">Directly drag and resize elements on the preview card</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all">
            <X size={28} className="text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          
          {/* Controls */}
          <div className="lg:w-80 p-8 border-r border-slate-100 dark:border-slate-800 space-y-8 overflow-y-auto">
            <div className="space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">ID Photo (1x1 Ratio)</label>
              <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden border-2 border-dashed border-slate-200 dark:border-slate-700 relative">
                {showCamera ? (
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                ) : photo ? (
                  <img src={photo} alt="Captured ID" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                    <User size={48} className="opacity-20" />
                    <span className="text-[10px] font-bold">No Photo Captured</span>
                  </div>
                )}
                
                {showCamera && (
                  <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
                    <button onClick={capturePhoto} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xl active:scale-95 transition-transform">Capture</button>
                    <button onClick={stopCamera} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xl active:scale-95 transition-transform">Stop</button>
                  </div>
                )}
              </div>

              {!showCamera && (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold hover:border-blue-500 transition-all active:scale-95">
                    <Upload size={14} /> Upload
                  </button>
                  <button onClick={startCamera} className="flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-2xl text-xs font-bold hover:scale-105 hover:shadow-blue-600/30 transition-all shadow-lg active:scale-95">
                    <Camera size={14} /> Camera
                  </button>
                </div>
              )}
              
              {photo && !showCamera && (
                <button 
                  onClick={() => { setPhoto(null); startCamera(); }} 
                  className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw size={14} /> Retake Photo
                </button>
              )}

              {photo && (
                <div className="pt-4 space-y-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Center Scaling (Zoom)</label>
                    <div className="flex items-center gap-2">
                      <Maximize2 size={12} className="text-slate-400" />
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                        {Math.round((frontLayout.find(i => i.id === 'photo')?.zoom || 1) * 100)}%
                      </span>
                    </div>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="3" 
                    step="0.01"
                    value={frontLayout.find(i => i.id === 'photo')?.zoom || 1}
                    onChange={(e) => updateLayout('photo', { zoom: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateLayout('photo', { zoom: 1, offsetX: 0, offsetY: 0 })}
                      className="flex-1 py-2 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold text-slate-500 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      Reset Position
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium italic text-center">
                    Tip: Scroll over photo to zoom • Ctrl+Drag to move image inside
                  </p>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />
              <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleFileUpload} />
              {photo && (
                <button onClick={() => setPhoto(null)} className="w-full py-2 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-lg transition-colors">Clear Photo</button>
              )}
            </div>
          </div>

          {/* Preview */}
          <div ref={previewWrapperRef} className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 lg:p-10 flex flex-col items-center justify-center gap-8 overflow-hidden">
            
            {/* Tab Switcher */}
            <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mb-4 flex-shrink-0">
              <button 
                onClick={() => setActiveTab('front')} 
                className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'front' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-slate-600'}`}
              >Front</button>
              <button 
                onClick={() => setActiveTab('back')} 
                className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'back' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-slate-600'}`}
              >Back</button>
            </div>

            {/* The ID Container with responsiveness scaling */}
            <div className="w-full flex justify-center items-center overflow-visible min-h-0">
              <div 
                ref={containerRef}
                className="relative shadow-2xl overflow-hidden ring-4 ring-white dark:ring-slate-800 select-none bg-white flex-shrink-0"
                style={{
                  width: '540px',
                  height: '340px',
                  backgroundImage: `url('${activeTab === 'front' ? (frontImageUrl || '/pdao-id-front.jpg') : (backImageUrl || '/pdao-id-back.jpg')}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  transform: `scale(${scaleFactor})`,
                  transformOrigin: 'center center',
                }}
              >
                {(activeTab === 'front' ? frontLayout : backLayout).map(item => (
                  <DraggableItem 
                    key={item.id} 
                    item={item} 
                    containerRef={containerRef} 
                    onChange={updateLayout}
                    isPhoto={item.id === 'photo'}
                    photo={photo}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium italic">
            Tip: Scroll over photo to zoom • Ctrl+Drag to move image inside
          </p>
          <div className="flex gap-4">
            <button
               onClick={onClose}
               className="px-8 py-4 text-sm font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="group flex items-center gap-3 px-12 py-4 bg-blue-600 text-white rounded-[2rem] font-black text-sm hover:scale-105 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
            >
              <Printer size={20} className="group-hover:rotate-12 transition-transform" /> CONFIRM & GENERATE ID
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default GenerateIdModal;
