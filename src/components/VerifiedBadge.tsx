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
    sm: 'w-4 h-4',
    md: 'w-4.5 h-4.5',
    lg: 'w-5 h-5',
  }[size];

  const badgeSvg = (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClasses} shrink-0 drop-shadow-xs`}
      aria-label={title}
    >
      {/* Scalloped Verified Seal Polygon */}
      <path
        d="M12 1.75L14.72 3.63L18.01 3.48L19.17 6.57L22 8.25L20.99 11.39L22 14.53L19.17 16.21L18.01 19.3L14.72 19.15L12 21.03L9.28 19.15L5.99 19.3L4.83 16.21L2 14.53L3.01 11.39L2 8.25L4.83 6.57L5.99 3.48L9.28 3.63L12 1.75Z"
        fill={variant === 'header' ? '#38BDF8' : '#0EA5E9'}
        stroke={variant === 'header' ? '#FFFFFF' : '#E0F2FE'}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Crisp Inner Checkmark */}
      <path
        d="M8.5 11.8L10.85 14.15L15.75 9.25"
        stroke="#FFFFFF"
        strokeWidth="2.3"
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
