import React, { useState, useMemo } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  Video,
  Users,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  Globe,
  Plus,
  Trash2,
} from 'lucide-react';
import { GroupParticipant, ThemeMode } from '../types';

export interface ScheduledGroupVideoCall {
  id: string;
  groupId: string;
  groupName: string;
  title: string;
  dateIso: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "18:00"
  durationMinutes: number;
  timezone: string;
  notes?: string;
  proposedBy: string;
  createdAt: string;
  rsvps: Record<string, 'going' | 'maybe' | 'declined'>;
}

interface GroupVideoCallSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  participants: GroupParticipant[];
  scheduledCalls: ScheduledGroupVideoCall[];
  onSaveScheduledCall: (call: ScheduledGroupVideoCall, sendAnnouncementToChat: boolean) => void;
  onUpdateRsvp: (callId: string, status: 'going' | 'maybe' | 'declined') => void;
  onDeleteScheduledCall: (callId: string) => void;
  onStartVideoCallNow: () => void;
  theme?: ThemeMode;
  primaryColor?: string;
}

const TIME_SLOTS = [
  '09:00',
  '10:30',
  '12:00',
  '14:00',
  '16:00',
  '18:00',
  '19:30',
  '21:00',
];

const DURATIONS = [15, 30, 45, 60, 90];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function formatReadableCallDate(dateIso: string, timeSlot: string): string {
  try {
    const [y, m, d] = dateIso.split('-').map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    const dayStr = dt.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const [hh, mm] = timeSlot.split(':').map(Number);
    const period = (hh ?? 12) >= 12 ? 'PM' : 'AM';
    const hour12 = (hh ?? 12) % 12 === 0 ? 12 : (hh ?? 12) % 12;
    const minStr = String(mm ?? 0).padStart(2, '0');
    return `${dayStr} at ${hour12}:${minStr} ${period}`;
  } catch {
    return `${dateIso} at ${timeSlot}`;
  }
}

export const GroupVideoCallSchedulerModal: React.FC<GroupVideoCallSchedulerModalProps> = ({
  isOpen,
  onClose,
  groupId,
  groupName,
  participants,
  scheduledCalls,
  onSaveScheduledCall,
  onUpdateRsvp,
  onDeleteScheduledCall,
  onStartVideoCallNow,
  theme = 'dark',
  primaryColor = '#10B981',
}) => {
  const isDark = theme === 'dark';

  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth());

  const defaultTomorrowIso = useMemo(() => {
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    const yyyy = tmr.getFullYear();
    const mm = String(tmr.getMonth() + 1).padStart(2, '0');
    const dd = String(tmr.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const [selectedDateIso, setSelectedDateIso] = useState<string>(defaultTomorrowIso);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('18:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [callTitle, setCallTitle] = useState<string>(`${groupName} Live Video Catch-Up`);
  const [callNotes, setCallNotes] = useState<string>(
    'Multilingual group video call with real-time translation enabled.'
  );
  const [sendToChat, setSendToChat] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'propose' | 'upcoming'>('propose');

  const detectedTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }, []);

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: Array<{ day: number | null; iso: string | null; isToday: boolean; isPast: boolean }> =
      [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push({ day: null, iso: null, isToday: false, isPast: false });
    }

    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(viewMonth + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const iso = `${viewYear}-${mm}-${dd}`;
      const cellTime = new Date(viewYear, viewMonth, d).getTime();
      cells.push({
        day: d,
        iso,
        isToday: cellTime === todayZero,
        isPast: cellTime < todayZero,
      });
    }
    return cells;
  }, [viewYear, viewMonth, today]);

  if (!isOpen) return null;

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleProposeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = callTitle.trim() || `${groupName} Video Call`;
    const initialRsvps: Record<string, 'going' | 'maybe' | 'declined'> = {
      me: 'going',
    };
    participants.slice(0, 2).forEach((p) => {
      if (p.id !== 'me') initialRsvps[p.id] = 'going';
    });

    const newCall: ScheduledGroupVideoCall = {
      id: `gcall_${Date.now()}`,
      groupId,
      groupName,
      title: cleanTitle,
      dateIso: selectedDateIso,
      timeSlot: selectedTimeSlot,
      durationMinutes,
      timezone: detectedTimezone,
      notes: callNotes.trim(),
      proposedBy: 'You',
      createdAt: new Date().toISOString(),
      rsvps: initialRsvps,
    };

    onSaveScheduledCall(newCall, sendToChat);
    onClose();
  };

  return (
    <div
      id="group-video-call-scheduler-modal"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150 ${
          isDark
            ? 'bg-[#161B26] border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div
          style={{ backgroundColor: primaryColor }}
          className="px-5 py-4 text-white flex items-center justify-between shrink-0"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight truncate">
                Schedule Group Video Call
              </h3>
              <p className="text-[11px] text-white/85 truncate">
                {groupName} · {participants.length} members
              </p>
            </div>
          </div>

          <button
            id="close-group-call-scheduler-btn"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/35 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Tabs: Propose New Time vs Upcoming Calls */}
        <div
          className={`grid grid-cols-2 gap-1 p-1.5 border-b text-xs font-bold shrink-0 ${
            isDark ? 'bg-[#12161F] border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            id="scheduler-tab-propose-btn"
            type="button"
            onClick={() => setActiveTab('propose')}
            style={activeTab === 'propose' ? { backgroundColor: primaryColor } : undefined}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'propose'
                ? 'text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Propose Call Time</span>
          </button>
          <button
            id="scheduler-tab-upcoming-btn"
            type="button"
            onClick={() => setActiveTab('upcoming')}
            style={activeTab === 'upcoming' ? { backgroundColor: primaryColor } : undefined}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'upcoming'
                ? 'text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Upcoming ({scheduledCalls.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'propose' ? (
            <form onSubmit={handleProposeSubmit} className="space-y-4">
              {/* Call Topic Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Video Call Topic / Agenda
                </label>
                <input
                  id="group-call-title-input"
                  type="text"
                  value={callTitle}
                  onChange={(e) => setCallTitle(e.target.value)}
                  placeholder="e.g. Weekly Group Video Sync"
                  required
                  className={`w-full px-3.5 py-2 rounded-xl text-xs font-semibold border outline-none ${
                    isDark
                      ? 'bg-[#1D2432] border-slate-700 text-white focus:border-emerald-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'
                  }`}
                />
              </div>

              {/* Interactive Month Calendar Picker */}
              <div
                className={`p-3 rounded-2xl border ${
                  isDark ? 'bg-[#1B212E] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-extrabold flex items-center gap-1.5">
                    <CalendarIcon style={{ color: primaryColor }} className="w-3.5 h-3.5" />
                    <span>
                      {MONTH_NAMES[viewMonth]} {viewYear}
                    </span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1 rounded-lg hover:bg-slate-500/15 cursor-pointer"
                      title="Previous Month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1 rounded-lg hover:bg-slate-500/15 cursor-pointer"
                      title="Next Month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {WEEKDAYS.map((wd) => (
                    <span key={wd} className="text-[10px] font-bold text-slate-400 py-0.5">
                      {wd}
                    </span>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((cell, idx) => {
                    if (!cell.day || !cell.iso) {
                      return <div key={`empty-${idx}`} className="h-8" />;
                    }
                    const isSelected = cell.iso === selectedDateIso;
                    return (
                      <button
                        key={cell.iso}
                        id={`calendar-day-${cell.iso}`}
                        type="button"
                        onClick={() => setSelectedDateIso(cell.iso!)}
                        style={isSelected ? { backgroundColor: primaryColor } : undefined}
                        className={`h-8 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer relative ${
                          isSelected
                            ? 'text-white shadow-sm scale-105'
                            : cell.isPast
                            ? 'text-slate-500/50 hover:bg-slate-500/10'
                            : isDark
                            ? 'text-slate-200 hover:bg-slate-800'
                            : 'text-slate-800 hover:bg-slate-200/70'
                        }`}
                      >
                        <span>{cell.day}</span>
                        {cell.isToday && !isSelected && (
                          <span
                            style={{ backgroundColor: primaryColor }}
                            className="w-1 h-1 rounded-full absolute bottom-1"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Proposed Time & Duration */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Select Time ({detectedTimezone})</span>
                  </label>
                  <input
                    id="group-call-custom-time-input"
                    type="time"
                    value={selectedTimeSlot}
                    onChange={(e) => setSelectedTimeSlot(e.target.value)}
                    className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border outline-none ${
                      isDark
                        ? 'bg-[#1D2432] border-slate-700 text-white'
                        : 'bg-slate-100 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                {/* Quick Time Slots */}
                <div className="grid grid-cols-4 gap-1.5">
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = selectedTimeSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTimeSlot(slot)}
                        style={isSelected ? { backgroundColor: primaryColor } : undefined}
                        className={`py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'text-white border-transparent shadow-xs'
                            : isDark
                            ? 'bg-[#1D2432] border-slate-800 text-slate-300 hover:border-slate-600'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>

                {/* Duration Pills */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] font-bold text-slate-400">Duration:</span>
                  <div className="flex items-center gap-1.5">
                    {DURATIONS.map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setDurationMinutes(mins)}
                        style={durationMinutes === mins ? { backgroundColor: primaryColor } : undefined}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                          durationMinutes === mins
                            ? 'text-white shadow-2xs'
                            : isDark
                            ? 'bg-slate-800 text-slate-400 hover:text-white'
                            : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Optional Call Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Notes for Group Members
                </label>
                <input
                  id="group-call-notes-input"
                  type="text"
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="Optional agenda or language note..."
                  className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-none ${
                    isDark
                      ? 'bg-[#1D2432] border-slate-700 text-slate-200'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              {/* Summary Preview Box */}
              <div
                className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                  isDark
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-extrabold truncate">{callTitle || 'Group Video Call'}</p>
                  <p className="text-[10px] opacity-90">
                    📅 {formatReadableCallDate(selectedDateIso, selectedTimeSlot)} · {durationMinutes} min
                  </p>
                </div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={sendToChat}
                    onChange={(e) => setSendToChat(e.target.checked)}
                    className="rounded accent-emerald-500"
                  />
                  <span>Announce in chat</span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  id="propose-group-video-call-submit-btn"
                  type="submit"
                  style={{ backgroundColor: primaryColor }}
                  className="flex-1 py-2.5 px-4 rounded-xl text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                  <span>Propose Group Video Call</span>
                </button>
              </div>
            </form>
          ) : (
            /* Upcoming Scheduled Group Video Calls Tab */
            <div className="space-y-3">
              {scheduledCalls.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <CalendarIcon className="w-8 h-8 text-slate-400 mx-auto opacity-60" />
                  <p className="text-xs font-bold text-slate-400">
                    No group video calls scheduled yet
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('propose')}
                    style={{ backgroundColor: primaryColor }}
                    className="px-4 py-2 rounded-xl text-white text-xs font-bold cursor-pointer"
                  >
                    + Propose a Call Time
                  </button>
                </div>
              ) : (
                scheduledCalls.map((call) => {
                  const myRsvp = call.rsvps?.me || 'going';
                  const goingCount = Object.values(call.rsvps || {}).filter(
                    (v) => v === 'going'
                  ).length;

                  return (
                    <div
                      key={call.id}
                      className={`p-3.5 rounded-2xl border space-y-2.5 ${
                        isDark ? 'bg-[#1C2230] border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-xs font-extrabold truncate">{call.title}</h4>
                          <p className="text-[11px] text-emerald-500 font-bold mt-0.5">
                            📅 {formatReadableCallDate(call.dateIso, call.timeSlot)} ({call.durationMinutes}m)
                          </p>
                          {call.notes && (
                            <p className="text-[10px] text-slate-400 mt-0.5">{call.notes}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => onDeleteScheduledCall(call.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 cursor-pointer"
                          title="Cancel scheduled call"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-500/15">
                        <div className="flex items-center gap-1">
                          {(
                            [
                              { id: 'going', label: `Going (${goingCount})` },
                              { id: 'maybe', label: 'Maybe' },
                              { id: 'declined', label: "Can't" },
                            ] as const
                          ).map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => onUpdateRsvp(call.id, opt.id)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                                myRsvp === opt.id
                                  ? 'bg-emerald-500 text-white'
                                  : isDark
                                  ? 'bg-slate-800 text-slate-400'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onStartVideoCallNow();
                          }}
                          style={{ backgroundColor: primaryColor }}
                          className="px-3 py-1.5 rounded-xl text-white text-[10px] font-extrabold flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Video className="w-3 h-3" />
                          <span>Join Video Call</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
