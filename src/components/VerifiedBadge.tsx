import React from 'react';
import { UserContact, UserProfile, GroupParticipant } from '../types';

export interface ProfileValidationCheck {
  id: string;
  label: string;
  completed: boolean;
}

export interface ProfileValidationStatus {
  isValidated: boolean;
  score: number;
  completedCount: number;
  totalCount: number;
  checks: ProfileValidationCheck[];
}

/**
 * Checks whether a user or contact has completed their account profile validation
 */
export function isAccountProfileValidated(
  entity?: Partial<UserContact & UserProfile & GroupParticipant> | null
): boolean {
  if (!entity) return false;

  // Explicit verification flag on the profile/contact object
  if (entity.isVerified === true || Boolean(entity.profileValidatedAt)) {
    return true;
  }
  if (entity.isVerified === false) {
    return false;
  }

  // Check persisted validation flag in localStorage
  if (entity.id && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`freedom_profile_validated_${entity.id}`);
      if (stored === 'true') return true;
      if (stored === 'false') return false;
    } catch {}
  }

  // Group or Channel chat validation
  if (entity.isGroup || entity.entityType === 'group' || entity.isChannel || entity.entityType === 'channel') {
    return Boolean(entity.name && (entity.groupTopic || entity.channelDescription || entity.statusText));
  }

  // Evaluate profile completeness (Name, @Username, Email or Phone, Bio/Status)
  const hasName = Boolean(entity.name && entity.name.trim().length >= 2);
  const hasUsername = Boolean(entity.username && entity.username.trim().length >= 2);
  const hasContactMethod = Boolean(
    (entity.email && entity.email.trim().includes('@')) ||
      (entity.phoneNumber && entity.phoneNumber.trim().length >= 5)
  );
  const hasBioOrLocation = Boolean(
    (entity.bio && entity.bio.trim().length >= 3) ||
      (entity.location && entity.location.trim().length >= 2) ||
      (entity.statusText && entity.statusText.trim().length >= 3)
  );

  return hasName && (hasUsername || hasContactMethod) && hasBioOrLocation;
}

/**
 * Returns detailed profile validation checklist & completion percentage
 */
export function getProfileValidationStatus(
  entity?: Partial<UserContact & UserProfile> | null
): ProfileValidationStatus {
  const hasName = Boolean(entity?.name && entity.name.trim().length >= 2);
  const hasUsername = Boolean(entity?.username && entity.username.trim().length >= 2);
  const hasEmailOrPhone = Boolean(
    (entity?.email && entity.email.trim().includes('@')) ||
      (entity?.phoneNumber && entity.phoneNumber.trim().length >= 5)
  );
  const hasBio = Boolean(entity?.bio && entity.bio.trim().length >= 3);
  const hasAvatar = Boolean(entity?.avatar && entity.avatar.trim().length > 0);

  const checks: ProfileValidationCheck[] = [
    { id: 'name', label: 'Full Display Name', completed: hasName },
    { id: 'username', label: 'Unique @Username Handle', completed: hasUsername },
    { id: 'contact', label: 'Verified Email or Phone Number', completed: hasEmailOrPhone },
    { id: 'bio', label: 'Profile Bio & Location', completed: hasBio },
    { id: 'avatar', label: 'Profile Photo / Avatar', completed: hasAvatar },
  ];

  const completedCount = checks.filter((c) => c.completed).length;
  const totalCount = checks.length;
  const score = Math.round((completedCount / totalCount) * 100);
  const isValidated = isAccountProfileValidated(entity);

  return {
    isValidated,
    score: isValidated ? 100 : score,
    completedCount: isValidated ? totalCount : completedCount,
    totalCount,
    checks,
  };
}

/**
 * Persists account profile validation state locally and dispatches an update event
 */
export function setAccountProfileValidated(userId: string, validated: boolean = true): void {
  if (!userId || typeof window === 'undefined') return;
  try {
    localStorage.setItem(`freedom_profile_validated_${userId}`, String(validated));
    window.dispatchEvent(
      new CustomEvent('freedom-profile-validation-updated', {
        detail: { userId, isVerified: validated, profileValidatedAt: new Date().toISOString() },
      })
    );
  } catch {}
}

interface VerifiedCheckmarkBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'header' | 'inline' | 'pill';
  label?: string;
  title?: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * Visual Verified Checkmark Icon displayed next to user names for validated accounts
 */
export const VerifiedCheckmarkBadge: React.FC<VerifiedCheckmarkBadgeProps> = ({
  size = 'sm',
  variant = 'inline',
  label,
  title = 'Verified Account — Completed Account Profile Validation',
  className = '',
  onClick,
}) => {
  const sizeClasses = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-[14px] h-[14px]',
    md: 'w-[15px] h-[15px]',
    lg: 'w-[16px] h-[16px]',
  }[size];

  const pointsCount = 120;
  const cx = 50;
  const cy = 50;
  const baseR = 42.5;
  const amp = 4.6;
  const lobes = 10;

  const buildPath = (yOffset: number = 0) => {
    const pts: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < pointsCount; i++) {
      const theta = -Math.PI / 2 + (i * 2 * Math.PI) / pointsCount;
      const r = baseR + amp * Math.cos(lobes * (theta + Math.PI / 2));
      pts.push({
        x: cx + r * Math.cos(theta),
        y: cy + yOffset + r * Math.sin(theta),
      });
    }
    return (
      pts
        .map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
        .join(' ') + ' Z'
    );
  };

  const badgeSvg = (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClasses} shrink-0`}
      aria-label={title}
    >
      <path d={buildPath(1.8)} fill="#008FD6" />
      <path d={buildPath(0)} fill="#00B6FF" />
      <path
        d="M36.5 52.8L46.2 62.5L65.8 42.2"
        stroke="#008ED4"
        strokeWidth="9.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M36.5 51.2L46.2 60.9L65.8 40.6"
        stroke="#FFFFFF"
        strokeWidth="9.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === 'pill' || label) {
    return (
      <span
        onClick={onClick}
        title={title}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-tight select-none shrink-0 ${
          onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''
        } bg-sky-500/20 text-sky-200 border border-sky-300/40 ${className}`}
      >
        {badgeSvg}
        <span>{label || 'Verified'}</span>
      </span>
    );
  }

  return (
    <span
      onClick={onClick}
      title={title}
      className={`inline-flex items-center justify-center shrink-0 select-none ${
        onClick ? 'cursor-pointer hover:scale-110 active:scale-95 transition-transform' : ''
      } ${className}`}
    >
      {badgeSvg}
    </span>
  );
};
