import React from 'react';
import { UserContact, UserProfile, GroupParticipant } from '../types';

export interface ProfileValidationCheckItem {
  key: 'profile_image' | 'id_document' | 'name' | 'username' | 'email' | 'phone' | 'bio' | 'location';
  label: string;
  completed: boolean;
}

export interface AdminVerificationRequirements {
  hasProfileImage: boolean;
  hasIdDocumentPicture: boolean;
  meetsRequirements: boolean;
  profileImageUrl: string;
  idDocumentUrl: string;
  idDocumentName: string;
  isRewardedByAdmin: boolean;
  isRevokedByAdmin: boolean;
  rewardedAt?: string;
  rewardedBy?: string;
}

export interface ProfileValidationSummary {
  isValidated: boolean;
  completedCount: number;
  totalCount: number;
  percentage: number;
  validatedAt?: string;
  checks: ProfileValidationCheckItem[];
  requirements: AdminVerificationRequirements;
}

export function getUserIdDocumentLocally(
  userId?: string
): { url: string; name: string; uploadedAt?: string } | null {
  if (typeof window === 'undefined' || !userId) return null;
  try {
    const raw = localStorage.getItem(`freedom_user_id_document_v1_${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.url) {
      return {
        url: parsed.url,
        name: parsed.name || 'ID_Verification_Document.jpg',
        uploadedAt: parsed.uploadedAt,
      };
    }
  } catch {}
  return null;
}

export function saveUserIdDocumentLocally(
  userId: string,
  url: string,
  name: string = 'ID_Document_Picture.jpg'
): void {
  if (typeof window === 'undefined' || !userId) return;
  const now = new Date().toISOString();
  try {
    localStorage.setItem(
      `freedom_user_id_document_v1_${userId}`,
      JSON.stringify({ url, name, uploadedAt: now })
    );
    window.dispatchEvent(
      new CustomEvent('freedom-profile-validation-updated', {
        detail: { userId, idDocumentUrl: url, idDocumentName: name },
      })
    );
    window.dispatchEvent(
      new CustomEvent('freedom-user-profile-details-updated', {
        detail: { userId, idDocumentUrl: url, idDocumentName: name },
      })
    );
  } catch {}
}

export function getAdminVerificationRequirements(
  entity?: Partial<UserContact & UserProfile & GroupParticipant> | null
): AdminVerificationRequirements {
  if (!entity) {
    return {
      hasProfileImage: false,
      hasIdDocumentPicture: false,
      meetsRequirements: false,
      profileImageUrl: '',
      idDocumentUrl: '',
      idDocumentName: '',
      isRewardedByAdmin: false,
      isRevokedByAdmin: false,
    };
  }

  const entityId = entity.id || '';
  let savedAvatar = entity.avatar || '';
  let idDocUrl = entity.idDocumentUrl || '';
  let idDocName = entity.idDocumentName || '';
  let adminStatus: string | null = null;
  let rewardedAt: string | undefined = entity.verifiedRewardedAt || entity.profileValidatedAt;
  let rewardedBy: string | undefined;

  if (typeof window !== 'undefined' && entityId) {
    try {
      const localAvatarRaw = localStorage.getItem(`freedom_user_avatar_v2_${entityId}`);
      if (localAvatarRaw) {
        const parsedAvatar = JSON.parse(localAvatarRaw);
        if (parsedAvatar?.avatarUrl) {
          savedAvatar = parsedAvatar.avatarUrl;
        }
      }
      const localDoc = getUserIdDocumentLocally(entityId);
      if (localDoc) {
        idDocUrl = localDoc.url;
        idDocName = localDoc.name;
      }
      adminStatus = localStorage.getItem(`freedom_admin_verified_status_v1_${entityId}`);
      const storedAt = localStorage.getItem(`freedom_admin_verified_at_v1_${entityId}`);
      if (storedAt) rewardedAt = storedAt;
      const storedBy = localStorage.getItem(`freedom_admin_verified_by_v1_${entityId}`);
      if (storedBy) rewardedBy = storedBy;
    } catch {}
  }

  const hasProfileImage = Boolean(
    savedAvatar &&
      savedAvatar.trim().length > 5 &&
      !savedAvatar.includes('ui-avatars.com')
  );
  const hasIdDocumentPicture = Boolean(idDocUrl && idDocUrl.trim().length > 5);
  const meetsRequirements = hasProfileImage || hasIdDocumentPicture;

  const isRevokedByAdmin = adminStatus === 'revoked';
  const isRewardedByAdmin =
    !isRevokedByAdmin &&
    (adminStatus === 'rewarded' ||
      entity.verifiedByAdmin === true ||
      entity.isVerified === true ||
      (typeof window !== 'undefined' &&
        Boolean(entityId) &&
        localStorage.getItem(`freedom_profile_validated_v1_${entityId}`) === 'true'));

  return {
    hasProfileImage,
    hasIdDocumentPicture,
    meetsRequirements,
    profileImageUrl: savedAvatar,
    idDocumentUrl: idDocUrl,
    idDocumentName: idDocName || (hasIdDocumentPicture ? 'Verified_ID_Document.jpg' : ''),
    isRewardedByAdmin,
    isRevokedByAdmin,
    rewardedAt,
    rewardedBy,
  };
}

/**
 * Evaluates whether a user contact, user profile, or group participant
 * has been verified by Admin (or meets Admin verification status).
 */
export function getProfileValidationSummary(
  entity?: Partial<UserContact & UserProfile & GroupParticipant> | null
): ProfileValidationSummary {
  const requirements = getAdminVerificationRequirements(entity);
  if (!entity) {
    return {
      isValidated: false,
      completedCount: 0,
      totalCount: 6,
      percentage: 0,
      checks: [],
      requirements,
    };
  }

  const entityId = entity.id || '';
  let localValidatedAt: string | undefined;
  let storedUsername = entity.username || '';
  let storedEmail = entity.email || '';
  let storedPhone = entity.phoneNumber || '';
  let storedBio = entity.bio || '';
  let storedLocation = entity.location || '';

  if (typeof window !== 'undefined' && entityId) {
    try {
      localValidatedAt =
        localStorage.getItem(`freedom_admin_verified_at_v1_${entityId}`) ||
        localStorage.getItem(`freedom_profile_validated_at_v1_${entityId}`) ||
        undefined;
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
    { key: 'profile_image', label: 'Profile Image', completed: requirements.hasProfileImage },
    { key: 'id_document', label: 'ID / Document Picture', completed: requirements.hasIdDocumentPicture },
    { key: 'name', label: 'Full Name', completed: hasName },
    { key: 'username', label: '@Username Handle', completed: hasUsername },
    { key: 'email', label: 'Verified Email', completed: hasEmail },
    { key: 'phone', label: 'Phone Number', completed: hasPhone },
    { key: 'bio', label: 'About / Bio', completed: hasBio },
    { key: 'location', label: 'Location', completed: hasLocation },
  ];

  const completedCount = checks.filter((c) => c.completed).length;
  const totalCount = checks.length;

  // Verification is controlled by Admin reward (or existing verified accounts that haven't been revoked by Admin)
  const isValidated = !requirements.isRevokedByAdmin && requirements.isRewardedByAdmin;

  return {
    isValidated,
    completedCount: isValidated ? totalCount : completedCount,
    totalCount,
    percentage: isValidated ? 100 : Math.round((completedCount / totalCount) * 100),
    validatedAt: requirements.rewardedAt || entity.profileValidatedAt || localValidatedAt,
    checks,
    requirements,
  };
}

export function isAccountProfileValidated(
  entity?: Partial<UserContact & UserProfile & GroupParticipant> | null
): boolean {
  return getProfileValidationSummary(entity).isValidated;
}

export function rewardUserVerifiedBadgeByAdmin(
  userId: string,
  adminEmail: string = 'Admin'
): string {
  const now = new Date().toISOString();
  if (typeof window !== 'undefined' && userId) {
    try {
      localStorage.setItem(`freedom_admin_verified_status_v1_${userId}`, 'rewarded');
      localStorage.setItem(`freedom_admin_verified_at_v1_${userId}`, now);
      localStorage.setItem(`freedom_admin_verified_by_v1_${userId}`, adminEmail);
      localStorage.setItem(`freedom_profile_validated_v1_${userId}`, 'true');
      localStorage.setItem(`freedom_profile_validated_at_v1_${userId}`, now);
      window.dispatchEvent(
        new CustomEvent('freedom-profile-validation-updated', {
          detail: {
            userId,
            isVerified: true,
            verifiedByAdmin: true,
            profileValidatedAt: now,
            verifiedRewardedAt: now,
          },
        })
      );
      window.dispatchEvent(
        new CustomEvent('freedom-user-profile-details-updated', {
          detail: {
            userId,
            isVerified: true,
            verifiedByAdmin: true,
            profileValidatedAt: now,
            verifiedRewardedAt: now,
          },
        })
      );
    } catch {}
  }
  return now;
}

export function revokeUserVerifiedBadgeByAdmin(userId: string): void {
  if (typeof window !== 'undefined' && userId) {
    try {
      localStorage.setItem(`freedom_admin_verified_status_v1_${userId}`, 'revoked');
      localStorage.removeItem(`freedom_profile_validated_v1_${userId}`);
      window.dispatchEvent(
        new CustomEvent('freedom-profile-validation-updated', {
          detail: {
            userId,
            isVerified: false,
            verifiedByAdmin: false,
          },
        })
      );
      window.dispatchEvent(
        new CustomEvent('freedom-user-profile-details-updated', {
          detail: {
            userId,
            isVerified: false,
            verifiedByAdmin: false,
          },
        })
      );
    } catch {}
  }
}

export function markAccountProfileValidatedLocally(userId: string): string {
  return rewardUserVerifiedBadgeByAdmin(userId, 'Admin');
}

interface VerifiedCheckmarkBadgeProps {
  id?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'header' | 'inline' | 'pill' | 'profile_seal' | 'chat_list';
  label?: string;
  title?: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * Exact 10-lobed smooth wavy sky-blue Verified Badge matching the user's uploaded image,
 * sized compactly to match the Facebook verified badge size (~14px - 16px).
 */
const ScallopedSkyBlueVerifiedSvg: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => {
  // Generate smooth 10-lobe sinusoidal rosette path matching images-1.jpeg:
  // R(theta) = 43 + 4.8 * cos(10 * theta), with top lobe at -90 deg
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

  const shadowPath = buildPath(1.8);
  const mainPath = buildPath(0);

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      className={`${className} shrink-0`}
      aria-hidden="true"
    >
      {/* Subtle bottom 3D edge matching screenshot */}
      <path d={shadowPath} fill="#008FD6" />
      {/* Main bright sky-blue 10-lobe rosette body matching screenshot */}
      <path d={mainPath} fill="#00B6FF" />
      {/* Subtle checkmark drop shadow */}
      <path
        d="M36.5 52.8L46.2 62.5L65.8 42.2"
        stroke="#008ED4"
        strokeWidth="9.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Crisp rounded white checkmark in center */}
      <path
        d="M36.5 51.2L46.2 60.9L65.8 40.6"
        stroke="#FFFFFF"
        strokeWidth="9.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * Visual Verified Checkmark Icon displayed next to user names in the chat header,
 * conversation list, and user profile page for verified accounts.
 * Sized to match the compact Facebook verified badge (14px-16px).
 */
export const VerifiedCheckmarkBadge: React.FC<VerifiedCheckmarkBadgeProps> = ({
  id,
  size = 'md',
  variant = 'inline',
  label,
  title = 'Verified Account',
  className = '',
  onClick,
}) => {
  // Compact Facebook-style verified badge sizing (14px - 16px)
  const dimensions =
    size === 'xs'
      ? 'w-3.5 h-3.5'
      : size === 'sm'
      ? 'w-[14px] h-[14px]'
      : size === 'lg'
      ? 'w-[16px] h-[16px]'
      : size === 'xl'
      ? 'w-[17px] h-[17px]'
      : 'w-[15px] h-[15px]';

  if (variant === 'pill') {
    return (
      <span
        id={id}
        onClick={onClick}
        title={title}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-tight bg-sky-500/15 text-sky-400 border border-sky-400/35 shadow-2xs shrink-0 select-none ${
          onClick ? 'cursor-pointer hover:bg-sky-500/25 transition-colors' : ''
        } ${className}`}
      >
        <ScallopedSkyBlueVerifiedSvg className="w-3.5 h-3.5" />
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
        className={`inline-flex items-center justify-center shrink-0 select-none ${
          onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''
        } ${className}`}
      >
        <ScallopedSkyBlueVerifiedSvg className="w-[16px] h-[16px]" />
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
        onClick ? 'cursor-pointer hover:scale-110 transition-transform' : ''
      } ${className}`}
    >
      <ScallopedSkyBlueVerifiedSvg className={dimensions} />
    </span>
  );
};
