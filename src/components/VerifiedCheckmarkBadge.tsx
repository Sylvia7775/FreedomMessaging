import React from 'react';
import { UserContact, UserProfile, GroupParticipant } from '../types';

export interface ProfileValidationCheckItem {
  key: 'name' | 'username' | 'email' | 'phone' | 'bio' | 'location';
  label: string;
  completed: boolean;
}

export interface ProfileValidationSummary {
  isValidated: boolean;
  completedCount: number;
  totalCount: number;
  percentage: number;
  validatedAt?: string;
  checks: ProfileValidationCheckItem[];
}

/**
 * Evaluates whether a user contact, user profile, or group participant
 * has completed their account profile validation.
 */
export function getProfileValidationSummary(
  entity?: Partial<UserContact & UserProfile & GroupParticipant> | null
): ProfileValidationSummary {
  if (!entity) {
    return {
      isValidated: false,
      completedCount: 0,
      totalCount: 6,
      percentage: 0,
      checks: [],
    };
  }

  const entityId = entity.id || '';
  let localValidated = false;
  let localValidatedAt: string | undefined;
  let storedUsername = entity.username || '';
  let storedEmail = entity.email || '';
  let storedPhone = entity.phoneNumber || '';
  let storedBio = entity.bio || '';
  let storedLocation = entity.location || '';

  if (typeof window !== 'undefined' && entityId) {
    try {
      localValidated =
        localStorage.getItem(`freedom_profile_validated_v1_${entityId}`) === 'true';
      localValidatedAt =
        localStorage.getItem(`freedom_profile_validated_at_v1_${entityId}`) || undefined;
      if (!storedUsername) {
        storedUsername =
          localStorage.getItem(`freedom_user_username_v1_${entityId}`) ||
          localStorage.getItem(`freedom_user_username_${entityId}`) ||
          '';
      }
      if (!storedEmail) {
        storedEmail = localStorage.getItem(`freedom_user_email_${entityId}`) || '';
      }
      if (!storedPhone) {
        storedPhone = localStorage.getItem(`freedom_user_phone_${entityId}`) || '';
      }
      if (!storedBio) {
        storedBio =
          localStorage.getItem(`freedom_user_bio_v1_${entityId}`) ||
          localStorage.getItem(`freedom_user_bio_${entityId}`) ||
          '';
      }
      if (!storedLocation) {
        storedLocation = localStorage.getItem(`freedom_user_location_${entityId}`) || '';
      }
    } catch {}
  }

  const hasName = Boolean(entity.name && entity.name.trim().length >= 2);
  const hasUsername = Boolean(storedUsername && storedUsername.replace(/^@+/, '').trim().length >= 2);
  const hasEmail = Boolean(storedEmail && storedEmail.includes('@') && storedEmail.trim().length >= 5);
  const hasPhone = Boolean(storedPhone && storedPhone.trim().length >= 6);
  const hasBio = Boolean(storedBio && storedBio.trim().length >= 4);
  const hasLocation = Boolean(storedLocation && storedLocation.trim().length >= 2);

  const checks: ProfileValidationCheckItem[] = [
    { key: 'name', label: 'Full Name', completed: hasName },
    { key: 'username', label: '@Username Handle', completed: hasUsername },
    { key: 'email', label: 'Verified Email', completed: hasEmail },
    { key: 'phone', label: 'Phone Number', completed: hasPhone },
    { key: 'bio', label: 'About / Bio', completed: hasBio },
    { key: 'location', label: 'Location', completed: hasLocation },
  ];

  const completedCount = checks.filter((c) => c.completed).length;
  const totalCount = checks.length;
  const allFieldsCompleted = completedCount === totalCount;

  const isExplicitlyVerified =
    entity.isVerified === true ||
    Boolean(entity.profileValidatedAt) ||
    localValidated;

  // Group participants or contacts with explicit verification or full profile completion
  const isValidated = isExplicitlyVerified || allFieldsCompleted;

  return {
    isValidated,
    completedCount: isExplicitlyVerified ? totalCount : completedCount,
    totalCount,
    percentage: isExplicitlyVerified ? 100 : Math.round((completedCount / totalCount) * 100),
    validatedAt: entity.profileValidatedAt || localValidatedAt,
    checks,
  };
}

export function isAccountProfileValidated(
  entity?: Partial<UserContact & UserProfile & GroupParticipant> | null
): boolean {
  return getProfileValidationSummary(entity).isValidated;
}

export function markAccountProfileValidatedLocally(userId: string): string {
  const now = new Date().toISOString();
  if (typeof window !== 'undefined' && userId) {
    try {
      localStorage.setItem(`freedom_profile_validated_v1_${userId}`, 'true');
      localStorage.setItem(`freedom_profile_validated_at_v1_${userId}`, now);
      window.dispatchEvent(
        new CustomEvent('freedom-profile-validation-updated', {
          detail: { userId, isVerified: true, profileValidatedAt: now },
        })
      );
    } catch {}
  }
  return now;
}

interface VerifiedCheckmarkBadgeProps {
  id?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'header' | 'inline' | 'pill' | 'profile_seal';
  label?: string;
  title?: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * Visual Verified Checkmark Icon displayed next to user names in the chat header,
 * conversation list, and user profile page (below the cover on the location row)
 * for users who have completed account profile validation.
 */
export const VerifiedCheckmarkBadge: React.FC<VerifiedCheckmarkBadgeProps> = ({
  id,
  size = 'md',
  variant = 'inline',
  label,
  title = 'Verified Account • Completed Account Profile Validation',
  className = '',
  onClick,
}) => {
  const dimensions =
    size === 'xs'
      ? 'w-3.5 h-3.5'
      : size === 'sm'
      ? 'w-4 h-4'
      : size === 'lg'
      ? 'w-6 h-6'
      : size === 'xl'
      ? 'w-7 h-7'
      : 'w-4.5 h-4.5';

  if (variant === 'pill') {
    return (
      <span
        id={id}
        onClick={onClick}
        title={title}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-tight bg-sky-500/15 text-sky-400 border border-sky-400/35 shadow-2xs shrink-0 select-none ${
          onClick ? 'cursor-pointer hover:bg-sky-500/25 transition-colors' : ''
        } ${className}`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-3.5 h-3.5 shrink-0"
          aria-hidden="true"
        >
          <path
            d="M12 1.2L14.1 2.8L16.7 2.1L17.9 4.5L20.5 5.1L20.6 7.8L22.6 9.5L21.5 12L22.6 14.5L20.6 16.2L20.5 18.9L17.9 19.5L16.7 21.9L14.1 21.2L12 22.8L9.9 21.2L7.3 21.9L6.1 19.5L3.5 18.9L3.4 16.2L1.4 14.5L2.5 12L1.4 9.5L3.4 7.8L3.5 5.1L6.1 4.5L7.3 2.1L9.9 2.8L12 1.2Z"
            fill="#1D9BF0"
          />
          <circle
            cx="12"
            cy="12"
            r="7.2"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="0.9"
          />
          <path
            d="M8.6 12.2L10.9 14.5L15.6 9.6"
            stroke="#FFFFFF"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>{label || 'Verified'}</span>
      </span>
    );
  }

  if (variant === 'profile_seal') {
    return (
      <span
        id={id}
        onClick={onClick}
        title={title}
        aria-label={title}
        className={`inline-flex items-center justify-center shrink-0 select-none drop-shadow-xs ${
          onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''
        } ${className}`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className="w-7 h-7 shrink-0"
          aria-hidden="true"
        >
          {/* 16-point scalloped blue verification rosette matching screenshot */}
          <path
            d="M16 1.4L18.4 3.4L21.4 2.5L22.7 5.3L25.8 5.6L26.0 8.7L28.8 10.1L27.9 13.1L29.8 15.6L27.9 18.1L28.8 21.1L26.0 22.5L25.8 25.6L22.7 25.9L21.4 28.7L18.4 27.8L16 29.8L13.6 27.8L10.6 28.7L9.3 25.9L6.2 25.6L6.0 22.5L3.2 21.1L4.1 18.1L2.2 15.6L4.1 13.1L3.2 10.1L6.0 8.7L6.2 5.6L9.3 5.3L10.6 2.5L13.6 3.4L16 1.4Z"
            fill="#249EF0"
            stroke="#1A8CD8"
            strokeWidth="0.6"
          />
          {/* Subtle inner ring */}
          <circle
            cx="16"
            cy="15.6"
            r="9.6"
            fill="#2AA3F4"
            stroke="#157EC4"
            strokeWidth="0.9"
          />
          {/* Crisp white checkmark */}
          <path
            d="M11.6 15.8L14.5 18.7L20.6 12.5"
            stroke="#FFFFFF"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  return (
    <span
      id={id}
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`inline-flex items-center justify-center shrink-0 select-none ${
        variant === 'header'
          ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]'
          : ''
      } ${onClick ? 'cursor-pointer hover:scale-110 transition-transform' : ''} ${className}`}
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        className={`${dimensions} shrink-0`}
        aria-hidden="true"
      >
        {/* Scalloped Verified Seal */}
        <path
          d="M16 1.4L18.4 3.4L21.4 2.5L22.7 5.3L25.8 5.6L26.0 8.7L28.8 10.1L27.9 13.1L29.8 15.6L27.9 18.1L28.8 21.1L26.0 22.5L25.8 25.6L22.7 25.9L21.4 28.7L18.4 27.8L16 29.8L13.6 27.8L10.6 28.7L9.3 25.9L6.2 25.6L6.0 22.5L3.2 21.1L4.1 18.1L2.2 15.6L4.1 13.1L3.2 10.1L6.0 8.7L6.2 5.6L9.3 5.3L10.6 2.5L13.6 3.4L16 1.4Z"
          fill="#249EF0"
          stroke={variant === 'header' ? '#FFFFFF' : '#1A8CD8'}
          strokeWidth={variant === 'header' ? '1.2' : '0.6'}
        />
        <circle
          cx="16"
          cy="15.6"
          r="9.6"
          fill="#2AA3F4"
          stroke="#157EC4"
          strokeWidth="0.8"
        />
        {/* Inner Checkmark */}
        <path
          d="M11.6 15.8L14.5 18.7L20.6 12.5"
          stroke="#FFFFFF"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
};
