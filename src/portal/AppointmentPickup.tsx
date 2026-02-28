import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays, Clock, MapPin, UserCheck, Download,
  ChevronLeft, ChevronRight, CheckCircle2, AlertCircle,
  XCircle, Users, FileText, Building2, Loader2, Lock,
  Printer, ChevronDown,
} from 'lucide-react';
import type { Appointment, AppointmentSlot, ApplicationStatus } from './types';
import { isAppointmentUnlocked } from './types';
import { appointmentsApi, AppointmentSlotAvailability, AppointmentData } from '../api/appointments';
import { jsPDF } from 'jspdf';

/** Maximum pickups per hour slot (business rule) */
const MAX_PICKUPS_PER_SLOT = 20;

interface AppointmentPickupProps {
  applicationStatus?: ApplicationStatus;
  existingAppointment?: Appointment;
  userName?: string;
  pwdNumber?: string;
  userPhone?: string;
  onBookAppointment?: (date: string, time: string) => void;
  onCancelAppointment?: (id: string) => void;
  onDownloadAuthLetter?: (proxyName: string, relationship: string) => void;
}

const TIME_SLOTS = [
  '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM',
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Format "2026-03-05" → "March 5, 2026" */
function formatDateDisplay(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return `${MONTHS[month]} ${day}, ${year}`;
}

const AppointmentPickup: React.FC<AppointmentPickupProps> = ({
  applicationStatus,
  existingAppointment,
  userName,
  pwdNumber,
  userPhone,
  onBookAppointment,
  onCancelAppointment,
  onDownloadAuthLetter,
}) => {
  // ── STATUS GATE: Only available when PRINTED or ISSUED ──
  const unlocked = isAppointmentUnlocked(applicationStatus);

  if (!unlocked) {
    const isApproved = applicationStatus === 'APPROVED' || applicationStatus === 'FOR_PRINTING';
    return (
      <div className="max-w-4xl mx-auto animate-fadeIn">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-10 shadow-sm text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <Lock size={36} className="text-slate-400 dark:text-slate-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
            Appointment Not Yet Available
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {isApproved
              ? 'Your application is approved but your physical ID card is still being printed. You will be notified via email/SMS once it\'s ready for pickup.'
              : 'The appointment module will become available once your ID card has been printed. Please complete and submit your application first.'}
          </p>
          {isApproved && (
            <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-400 font-medium">
              <Printer size={16} />
              Waiting for card printing...
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Main component (only rendered when status = PRINTED or ISSUED) ──
  return (
    <AppointmentPickupContent
      existingAppointment={existingAppointment}
      userName={userName}
      pwdNumber={pwdNumber}
      userPhone={userPhone}
      onBookAppointment={onBookAppointment}
      onCancelAppointment={onCancelAppointment}
      onDownloadAuthLetter={onDownloadAuthLetter}
    />
  );
};

/** Internal component: rendered only when the user's status allows appointments */
const AppointmentPickupContent: React.FC<Omit<AppointmentPickupProps, 'applicationStatus'>> = ({
  existingAppointment,
  userName,
  pwdNumber,
  userPhone,
  onBookAppointment,
  onCancelAppointment,
  onDownloadAuthLetter,
}) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [proxyName, setProxyName] = useState('');
  const [proxyRelationship, setProxyRelationship] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [showProxy, setShowProxy] = useState(false);
  const [slotAvailability, setSlotAvailability] = useState<AppointmentSlotAvailability[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [myAppointment, setMyAppointment] = useState<AppointmentData | null>(null);
  const [isLoadingAppointment, setIsLoadingAppointment] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  // ── Fetch existing appointment on mount ──
  useEffect(() => {
    const fetchMyAppointment = async () => {
      setIsLoadingAppointment(true);
      try {
        const data = await appointmentsApi.getMy();
        if (data && data.status === 'SCHEDULED') {
          setMyAppointment(data);
        } else {
          setMyAppointment(null);
        }
      } catch (error) {
        console.error('Failed to fetch existing appointment:', error);
        setMyAppointment(null);
      } finally {
        setIsLoadingAppointment(false);
      }
    };
    fetchMyAppointment();
  }, []);

  // Determine whether user has a scheduled appointment
  const hasAppointment = myAppointment !== null || (existingAppointment !== undefined && existingAppointment !== null);

  // Resolved appointment details (myAppointment takes priority over prop)
  const appointmentDetails = useMemo(() => {
    if (myAppointment) {
      return {
        id: String(myAppointment.id),
        date: formatDateDisplay(myAppointment.appointment_date),
        rawDate: myAppointment.appointment_date,
        time: myAppointment.appointment_time,
        status: myAppointment.status,
        proxyName: myAppointment.proxy_name,
        proxyRelationship: myAppointment.proxy_relationship,
        notes: myAppointment.notes,
      };
    }
    if (existingAppointment) {
      return {
        id: existingAppointment.id,
        date: existingAppointment.date,
        rawDate: existingAppointment.date,
        time: existingAppointment.time,
        status: existingAppointment.status,
        proxyName: existingAppointment.proxyName || null,
        proxyRelationship: existingAppointment.proxyRelationship || null,
        notes: existingAppointment.notes || null,
      };
    }
    return null;
  }, [myAppointment, existingAppointment]);

  // Fetch available slots when a date is selected
  useEffect(() => {
    if (!selectedDate) {
      setSlotAvailability([]);
      return;
    }
    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      try {
        const slots = await appointmentsApi.getAvailableSlots(selectedDate);
        setSlotAvailability(slots);
      } catch (error) {
        console.error('Failed to fetch slots:', error);
        setSlotAvailability(TIME_SLOTS.map(t => ({ time: t, booked: 0, max: MAX_PICKUPS_PER_SLOT, available: true })));
      } finally {
        setIsLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDate]);

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const isDateSelectable = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6 && date >= new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const formatDate = (day: number) => {
    const d = new Date(currentYear, currentMonth, day);
    return d.toISOString().split('T')[0];
  };

  // ── Book appointment ──
  const handleBook = async () => {
    if (!selectedDate || !selectedTime) return;
    setIsBooking(true);
    setBookingError('');
    try {
      const result = await appointmentsApi.book({
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        proxy_name: proxyName || undefined,
        proxy_relationship: proxyRelationship || undefined,
      });
      onBookAppointment?.(selectedDate, selectedTime);
      setMyAppointment(result);
      setBookingSuccess(true);
      setSelectedDate(null);
      setSelectedTime(null);
      setTimeout(() => setBookingSuccess(false), 5000);
    } catch (error: any) {
      setBookingError(error?.response?.data?.message || 'Failed to book appointment. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  // ── Cancel appointment ──
  const handleCancel = async () => {
    if (!appointmentDetails) return;
    setIsCancelling(true);
    try {
      const numericId = typeof appointmentDetails.id === 'string' ? parseInt(appointmentDetails.id, 10) : Number(appointmentDetails.id);
      await appointmentsApi.cancel(numericId);
      onCancelAppointment?.(appointmentDetails.id);
      setMyAppointment(null);
      setCancelSuccess(true);
      setTimeout(() => setCancelSuccess(false), 5000);
    } catch (error: any) {
      setBookingError(error?.response?.data?.message || 'Failed to cancel appointment. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  // ── Generate Authorization Letter PDF ──
  const generateAuthorizationLetterPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const leftMargin = 25;
    const rightMargin = 25;
    const usableWidth = pageWidth - leftMargin - rightMargin;

    // Use appointment date (pickup date) for the letter
    const pickupDateStr = appointmentDetails?.date || 'N/A';

    const name = userName || 'N/A';
    const pwdId = pwdNumber || 'N/A';
    const contactNo = userPhone || 'N/A';
    const repName = proxyName || 'N/A';
    const repRelationship = proxyRelationship || 'N/A';

    let y = 40;

    // Title
    doc.setFont('times', 'bold');
    doc.setFontSize(18);
    doc.text('AUTHORIZATION LETTER', pageWidth / 2, y, { align: 'center' });
    y += 20;

    // Date
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(`Date: ${pickupDateStr}`, leftMargin, y);
    y += 14;

    // Salutation
    doc.text('To Whom It May Concern,', leftMargin, y);
    y += 14;

    // Body paragraph 1
    const para1 = `I, ${name}, a registered Person with Disability (PWD) with PWD ID No. ${pwdId}, hereby authorize ${repName}, my ${repRelationship.toLowerCase()}, to claim my PWD ID on my behalf.`;
    const para1Lines = doc.splitTextToSize(para1, usableWidth);
    doc.text(para1Lines, leftMargin, y);
    y += para1Lines.length * 7 + 7;

    // Body paragraph 2
    const para2 = 'I am currently unable to personally pick up my ID due to valid reasons. I authorize the above-named representative to process and receive the said ID for me.';
    const para2Lines = doc.splitTextToSize(para2, usableWidth);
    doc.text(para2Lines, leftMargin, y);
    y += para2Lines.length * 7 + 7;

    // Body paragraph 3
    const para3 = 'Attached are copies of my valid ID and the valid ID of my authorized representative for verification purposes.';
    const para3Lines = doc.splitTextToSize(para3, usableWidth);
    doc.text(para3Lines, leftMargin, y);
    y += para3Lines.length * 7 + 7;

    // Thank you
    doc.text('Thank you for your kind consideration.', leftMargin, y);
    y += 20;

    // Sincerely
    doc.text('Sincerely,', leftMargin, y);
    y += 25;

    // Name
    doc.setFont('times', 'bold');
    doc.text(name, leftMargin, y);
    y += 7;

    // PWD ID No.
    doc.setFont('times', 'normal');
    doc.text(`PWD ID number ${pwdId}`, leftMargin, y);
    y += 7;

    // Contact No.
    doc.text(contactNo, leftMargin, y);

    // Save
    const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Authorization_Letter_${safeName}.pdf`);
  };

  const handleDownloadAuth = () => {
    if (proxyName && proxyRelationship) {
      generateAuthorizationLetterPDF();
    }
  };

  const statusConfig = {
    SCHEDULED: { label: 'Scheduled', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: <Clock size={18} /> },
    COMPLETED: { label: 'Completed', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', icon: <CheckCircle2 size={18} /> },
    CANCELLED: { label: 'Cancelled', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', icon: <XCircle size={18} /> },
    NO_SHOW: { label: 'No Show', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', icon: <AlertCircle size={18} /> },
  };

  // ── Loading state ──
  if (isLoadingAppointment) {
    return (
      <div className="max-w-4xl mx-auto animate-fadeIn">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-10 shadow-sm flex flex-col items-center justify-center">
          <Loader2 size={32} className="animate-spin text-blue-600 mb-4" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading appointment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <CalendarDays size={24} className="text-blue-600" />
          Appointment & Pickup
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Schedule your visit to claim your physical PWD ID card
        </p>
      </div>

      {/* Booking Success Message */}
      {bookingSuccess && (
        <div className="animate-fadeIn">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 size={20} className="text-green-600 dark:text-green-400 shrink-0" />
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              Appointment booked successfully! You will receive a notification with details.
            </p>
          </div>
        </div>
      )}

      {/* Cancel Success Message */}
      {cancelSuccess && (
        <div className="animate-fadeIn">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 size={20} className="text-green-600 dark:text-green-400 shrink-0" />
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              Appointment cancelled successfully. You can book a new one anytime.
            </p>
          </div>
        </div>
      )}

      {/* Booking Error */}
      {bookingError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3 animate-fadeIn">
          <AlertCircle size={20} className="text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-sm font-medium text-red-700 dark:text-red-300">{bookingError}</p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODE: HAS APPOINTMENT
          ═══════════════════════════════════════════════════════════════════════ */}
      {hasAppointment && appointmentDetails && (
        <>
          {/* Appointment Detail Card */}
          <div className={`rounded-2xl border p-5 shadow-sm ${statusConfig[appointmentDetails.status].bg} ${statusConfig[appointmentDetails.status].border}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${statusConfig[appointmentDetails.status].color} bg-white/60 dark:bg-white/5`}>
                  {statusConfig[appointmentDetails.status].icon}
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${statusConfig[appointmentDetails.status].color}`}>
                    {statusConfig[appointmentDetails.status].label}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays size={14} /> {appointmentDetails.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} /> {appointmentDetails.time}
                    </span>
                  </div>
                  {appointmentDetails.proxyName && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                      <Users size={14} /> Representative: {appointmentDetails.proxyName} ({appointmentDetails.proxyRelationship})
                    </p>
                  )}
                  {appointmentDetails.notes && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                      <FileText size={14} /> {appointmentDetails.notes}
                    </p>
                  )}
                </div>
              </div>
              {appointmentDetails.status === 'SCHEDULED' && (
                <button
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors min-h-[44px] flex items-center gap-2"
                >
                  {isCancelling ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                  Cancel Appointment
                </button>
              )}
            </div>
          </div>

          {/* Pickup Location */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <MapPin size={16} className="text-blue-600" />
              Pickup Location
            </h3>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
              <Building2 size={20} className="text-slate-500 dark:text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-white">PDAO</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pagsanjan, Laguna</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Office Hours: Mon–Fri, 8:00 AM – 5:00 PM</p>
              </div>
            </div>
          </div>

          {/* Authorize a Representative (Proxy Pickup) */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
            <button
              onClick={() => setShowProxy(!showProxy)}
              className="w-full flex items-center justify-between text-left min-h-[44px]"
              aria-expanded={showProxy}
            >
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <UserCheck size={16} className="text-blue-600" />
                Authorize a Representative (Proxy Pickup)
              </h3>
              <ChevronDown size={18} className={`text-slate-400 transition-transform ${showProxy ? 'rotate-180' : ''}`} />
            </button>

            {showProxy && (
              <div className="mt-4 space-y-4 animate-fadeIn">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  If you cannot claim your ID in person, authorize someone to pick it up on your behalf.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Representative's Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={proxyName}
                      onChange={(e) => setProxyName(e.target.value)}
                      placeholder="e.g., Juan Dela Cruz"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white min-h-[44px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Relationship <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={proxyRelationship}
                      onChange={(e) => setProxyRelationship(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white min-h-[44px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    >
                      <option value="">Select relationship...</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Caregiver">Caregiver</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                {proxyName && proxyRelationship && (
                  <button
                    onClick={handleDownloadAuth}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-600/20 transition-all min-h-[48px]"
                  >
                    <Download size={18} />
                    Download Authorization Letter
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODE: NO APPOINTMENT
          ═══════════════════════════════════════════════════════════════════════ */}
      {!hasAppointment && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendar */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Select Date</h3>
                <div className="flex items-center gap-2">
                  <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Previous month">
                    <ChevronLeft size={18} className="text-slate-600 dark:text-slate-300" />
                  </button>
                  <span className="text-sm font-bold text-slate-800 dark:text-white min-w-[140px] text-center">
                    {MONTHS[currentMonth]} {currentYear}
                  </span>
                  <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Next month">
                    <ChevronRight size={18} className="text-slate-600 dark:text-slate-300" />
                  </button>
                </div>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map((day) => (
                  <div key={day} className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = formatDate(day);
                  const selectable = isDateSelectable(day);
                  const isSelected = selectedDate === dateStr;
                  const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

                  return (
                    <button
                      key={day}
                      onClick={() => selectable && setSelectedDate(dateStr)}
                      disabled={!selectable}
                      className={`aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all min-h-[40px]
                        ${isSelected
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                          : isToday
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-1 ring-blue-300 dark:ring-blue-700'
                            : selectable
                              ? 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                              : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                        }`}
                      aria-label={`${MONTHS[currentMonth]} ${day}, ${currentYear}`}
                      aria-selected={isSelected}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slots & Actions */}
            <div className="space-y-4">
              {/* Time Slots */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">
                  {selectedDate ? `Available slots for ${formatDateDisplay(selectedDate)}` : 'Select a date first'}
                </h3>
                {selectedDate ? (
                  isLoadingSlots ? (
                    <div className="flex items-center justify-center h-32 text-slate-400">
                      <Loader2 size={18} className="animate-spin mr-2" /> Loading available slots...
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {slotAvailability.map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => slot.available && setSelectedTime(slot.time)}
                          disabled={!slot.available}
                          className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all min-h-[44px]
                            ${!slot.available
                              ? 'bg-red-50 dark:bg-red-900/20 text-red-400 dark:text-red-500 cursor-not-allowed border border-red-200 dark:border-red-800 line-through'
                              : selectedTime === slot.time
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                : 'bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-slate-200 dark:border-slate-600'
                            }`}
                          title={slot.available ? `${slot.max - slot.booked} of ${slot.max} slot(s) left` : 'Fully booked (max 20/hr)'}
                        >
                          {slot.time}
                          {!slot.available && <span className="block text-[9px] mt-0.5">Full</span>}
                        </button>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center h-32 text-slate-400 dark:text-slate-500 text-sm">
                    <CalendarDays size={18} className="mr-2" /> Please select a date
                  </div>
                )}
              </div>

              {/* Location */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                  <MapPin size={16} className="text-blue-600" />
                  Pickup Location
                </h3>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                  <Building2 size={20} className="text-slate-500 dark:text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">PDAO</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pagsanjan, Laguna</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Office Hours: Mon–Fri, 8:00 AM – 5:00 PM</p>
                  </div>
                </div>
              </div>

              {/* Book Button */}
              {selectedDate && selectedTime && (
                <button
                  onClick={handleBook}
                  disabled={isBooking}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/20 transition-all min-h-[48px]"
                >
                  {isBooking ? <Loader2 size={18} className="animate-spin" /> : <CalendarDays size={18} />}
                  Book Appointment — {formatDateDisplay(selectedDate)} at {selectedTime}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AppointmentPickup;
