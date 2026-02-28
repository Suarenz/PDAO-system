import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  CreditCard,
  ClipboardList,
  Lock,
  RotateCcw,
  User,
  Loader2,
} from 'lucide-react';
import type { DigitalIdData } from './types';
import { isDigitalIdUnlocked } from './types';
import type { ApplicationStatus } from './types';
import templateApi, { type IdCardLayoutItem } from '../api/templates';

/* ==========================================================================
   FALLBACK DEFAULTS (used while loading or if DB has no template)
   ========================================================================== */

const FALLBACK_FRONT: IdCardLayoutItem[] = [
  { id: 'photo',      label: 'Photo',       top: 47,   left: 6.5,  fontSize: 0,   maxWidth: 27.5, maxHeight: 43.5 },
  { id: 'fullName',   label: 'Full Name',    top: 52,   left: 64.5, fontSize: 2.8, maxWidth: null },
  { id: 'disability', label: 'Disability',    top: 66,   left: 64.5, fontSize: 2.4, maxWidth: null },
  { id: 'pwdNumber',  label: 'PWD Number',    top: 91.5, left: 20.5, fontSize: 2.1, maxWidth: null },
];

const FALLBACK_BACK: IdCardLayoutItem[] = [
  { id: 'address',    label: 'Address',          top: 13.5, left: 21.5, fontSize: 1.8, maxWidth: 73 },
  { id: 'dob',        label: 'Date of Birth',    top: 19.5, left: 32,   fontSize: 1.8, maxWidth: null },
  { id: 'sex',        label: 'Sex',              top: 19.5, left: 78,   fontSize: 1.8, maxWidth: null },
  { id: 'dateIssued', label: 'Date Issued',      top: 25.5, left: 32,   fontSize: 1.8, maxWidth: null },
  { id: 'bloodType',  label: 'Blood Type',       top: 25.5, left: 78,   fontSize: 2.0, maxWidth: null },
  { id: 'guardian',   label: 'Parent/Guardian',   top: 44.5, left: 45,   fontSize: 1.8, maxWidth: 50 },
  { id: 'contactNo',  label: 'Contact No.',      top: 51,   left: 28,   fontSize: 1.8, maxWidth: null },
];

/* ==========================================================================
   AUTO-SCALING TEXT (shrink-to-fit for long names)
   ========================================================================== */

const AutoScaleText: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  maxWidthPercent?: number;
}> = ({ children, className, style, maxWidthPercent = 38 }) => {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    // Measure at scale=1 first
    el.style.transform = 'scaleX(1)';
    const container = el.closest('[data-id-card]') as HTMLElement;
    if (!container) return;
    const maxW = container.clientWidth * (maxWidthPercent / 100);
    const textW = el.scrollWidth;
    if (textW > maxW && textW > 0) {
      setScale(maxW / textW);
    } else {
      setScale(1);
    }
  }, [children, maxWidthPercent]);

  return (
    <p
      ref={textRef}
      className={className}
      style={{
        ...style,
        transform: `scaleX(${scale})`,
        transformOrigin: 'center top',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </p>
  );
};

/* ==========================================================================
   READ-ONLY FIELD RENDERER
   ========================================================================== */

interface FieldRendererProps {
  item: IdCardLayoutItem;
  value: string;
  isPhoto?: boolean;
  photoSrc?: string;
}

const FieldRenderer: React.FC<FieldRendererProps> = ({ item, value, isPhoto, photoSrc }) => {
  const isCentering = item.id === 'fullName' || item.id === 'disability';
  const isBloodType = item.id === 'bloodType';
  const needsAutoScale = item.id === 'fullName' || item.id === 'disability';

  if (isPhoto) {
    return (
      <div
        className="absolute overflow-hidden"
        style={{
          top: `${item.top}%`,
          left: `${item.left}%`,
          width: `${item.maxWidth || 27.5}%`,
          height: `${item.maxHeight || 43.5}%`,
        }}
      >
        <div className="w-full h-full bg-slate-100 border border-black/50 shadow-inner flex items-center justify-center overflow-hidden">
          {photoSrc ? (
            <img src={photoSrc} alt="ID Photo" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1 opacity-40">
              <User className="text-slate-400" size={24} />
              <span className="text-[5px] font-bold uppercase">No Photo</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute z-10"
      style={{
        top: `${item.top}%`,
        left: `${item.left}%`,
        transform: isCentering ? 'translateX(-50%)' : 'none',
        maxWidth: item.maxWidth ? `${item.maxWidth}%` : undefined,
      }}
    >
      {needsAutoScale ? (
        <AutoScaleText
          className={`leading-tight font-black uppercase tracking-wide font-serif text-center ${
            isBloodType ? 'text-rose-600' : 'text-slate-900'
          }`}
          style={{ fontSize: `${item.fontSize}cqw`, lineHeight: 1.15 }}
          maxWidthPercent={38}
        >
          {value || '\u00A0'}
        </AutoScaleText>
      ) : (
        <p
          className={`leading-tight font-bold font-sans text-left ${
            isBloodType ? 'text-rose-600 font-black' : 'text-slate-900'
          } ${item.maxWidth ? 'truncate' : ''}`}
          style={{ fontSize: `${item.fontSize}cqw`, lineHeight: 1.15, whiteSpace: 'nowrap' }}
        >
          {value || '\u00A0'}
        </p>
      )}
    </div>
  );
};

/* ==========================================================================
   MAIN COMPONENT: MyDigitalId (Read-Only, DB-Driven)
   ========================================================================== */

interface MyDigitalIdProps {
  isApproved: boolean;
  idData?: DigitalIdData;
  applicationStatus?: ApplicationStatus;
}

const MyDigitalId: React.FC<MyDigitalIdProps> = ({ isApproved, idData, applicationStatus }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [frontLayout, setFrontLayout] = useState<IdCardLayoutItem[]>(FALLBACK_FRONT);
  const [backLayout, setBackLayout] = useState<IdCardLayoutItem[]>(FALLBACK_BACK);
  const [frontImageUrl, setFrontImageUrl] = useState<string | null>(null);
  const [backImageUrl, setBackImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  const unlocked = isDigitalIdUnlocked(applicationStatus) || isApproved;

  /* ---- Load template from database ---- */
  useEffect(() => {
    if (!unlocked) {
      setIsLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await templateApi.getActive();
        if (data.front?.length) setFrontLayout(data.front);
        if (data.back?.length) setBackLayout(data.back);
        if (data.front_image) setFrontImageUrl(data.front_image);
        if (data.back_image) setBackImageUrl(data.back_image);
      } catch (err) {
        console.warn('Could not load ID template, using defaults.', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [unlocked]);

  /** Get value for a layout item from idData */
  const getFieldValue = (id: string): string => {
    if (!idData) return '';
    switch (id) {
      case 'fullName':   return idData.fullName || '';
      case 'disability': return idData.disabilityType || '';
      case 'pwdNumber':  return idData.pwdNumber || '';
      case 'address':    return idData.address || '';
      case 'dob':        return idData.dateOfBirth || '';
      case 'sex':        return idData.sex || '';
      case 'dateIssued': return idData.dateIssued || '';
      case 'bloodType':  return idData.bloodType || '';
      case 'guardian':   return idData.guardian || '';
      case 'contactNo':  return idData.contactNo || '';
      default:           return '';
    }
  };

  // ======== LOCKED STATE ========
  if (!unlocked || !idData) {
    return (
      <div className="max-w-4xl mx-auto animate-fadeIn">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-10 shadow-sm text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <Lock size={36} className="text-slate-400 dark:text-slate-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Digital ID Not Available</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Your Digital PWD ID will become available once your application has been approved. Please check your application status for updates.
          </p>
        </div>
      </div>
    );
  }

  // ======== LOADING STATE ========
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[40vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={28} />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading your Digital ID...</p>
        </div>
      </div>
    );
  }

  // ======== RENDER ========
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <CreditCard size={24} className="text-blue-600" />
          My Digital ID
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Your official virtual PWD identification card
        </p>
      </div>

      {/* Flip Card */}
      <div className="flex justify-center">
        <div
          ref={cardRef}
          className="relative w-full max-w-[540px] aspect-[85.6/53.98] cursor-pointer group shadow-2xl rounded-2xl"
          style={{ perspective: '1200px', containerType: 'inline-size' }}
          onClick={() => setIsFlipped(!isFlipped)}
          onKeyDown={(e) => { if (e.key === 'Enter') setIsFlipped(!isFlipped); }}
          tabIndex={0}
          role="button"
          aria-label={`PWD ID Card. Currently showing ${isFlipped ? 'back' : 'front'}. Press Enter to flip.`}
        >
          <div
            className="relative w-full h-full transition-transform duration-700 ease-in-out"
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* ===================== FRONT ===================== */}
            <div
              className="absolute inset-0 rounded-2xl overflow-hidden bg-white"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <img
                src={frontImageUrl || '/pdao-id-front.jpg'}
                alt="PDAO ID Front"
                className="absolute inset-0 w-full h-full object-fill"
              />
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20" aria-hidden="true">
                <span className="text-slate-900/[0.05] text-4xl font-black uppercase tracking-[0.3em] -rotate-[25deg] select-none whitespace-nowrap">
                  DIGITAL COPY
                </span>
              </div>
              {/* Front Content */}
              <div data-id-card className="relative z-10 w-full h-full font-sans text-slate-900">
                {frontLayout.map(item =>
                  item.id === 'photo' ? (
                    <FieldRenderer key={item.id} item={item} value="" isPhoto photoSrc={idData.photo} />
                  ) : (
                    <FieldRenderer key={item.id} item={item} value={getFieldValue(item.id)} />
                  )
                )}
              </div>
            </div>

            {/* ===================== BACK ===================== */}
            <div
              className="absolute inset-0 rounded-2xl overflow-hidden bg-white"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <img
                src={backImageUrl || '/pdao-id-back.jpg'}
                alt="PDAO ID Back"
                className="absolute inset-0 w-full h-full object-fill"
              />
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20" aria-hidden="true">
                <span className="text-slate-900/[0.05] text-4xl font-black uppercase tracking-[0.3em] -rotate-[25deg] select-none whitespace-nowrap">
                  DIGITAL COPY
                </span>
              </div>
              {/* Back Content */}
              <div data-id-card className="relative z-10 w-full h-full font-sans font-bold text-slate-900">
                {backLayout.map(item => (
                  <FieldRenderer key={item.id} item={item} value={getFieldValue(item.id)} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flip instruction */}
      <div className="text-center">
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          <RotateCcw size={16} />
          Click card or press here to flip
        </button>
      </div>

      {/* ID Details List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <User size={16} className="text-blue-600" />
            ID Details
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Full Name', value: idData.fullName },
              { label: 'PWD ID', value: idData.pwdNumber },
              { label: 'Date of Birth', value: idData.dateOfBirth },
              { label: 'Sex', value: idData.sex },
              { label: 'Blood Type', value: idData.bloodType },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                <span className="text-xs text-slate-500 dark:text-slate-400">{item.label}</span>
                <span className="text-sm font-medium text-slate-800 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <ClipboardList size={16} className="text-blue-600" />
            Other Details
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Disability', value: idData.disabilityType },
              { label: 'Address', value: idData.address },
              { label: 'Date Issued', value: idData.dateIssued },
              { label: 'Valid Until', value: idData.expiryDate },
              { label: 'Parent/Guardian/Spouse', value: idData.guardian || 'N/A' },
              { label: 'Contact No.', value: idData.contactNo || 'N/A' },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-start py-1.5 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">{item.label}</span>
                <span className="text-sm font-medium text-slate-800 dark:text-white text-right ml-4">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyDigitalId;
