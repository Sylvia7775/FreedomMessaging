import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface FriendInvitationRecord {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  invitedUserId: string;
  invitedUserName: string;
  invitedUserAvatar: string;
  nativeLanguage?: string;
  status: 'pending' | 'accepted' | 'declined' | 'none';
  createdAt: string;
  respondedAt?: string;
  acceptedAt?: string;
}

const INVITATIONS_STORAGE_KEY = 'freedom_friend_invitations_v2';

/**
 * Strict Access Control Gate:
 * Returns true ONLY if the viewer is the exact invited user (`invitedUserId`)
 * and is NOT an Admin and NOT the sender or any other uninvited user.
 */
export function canUserSeeAndAcceptInvitation(
  invitation: FriendInvitationRecord | null | undefined,
  viewerUserId: string | null | undefined,
  viewerRoleOrIsAdmin: boolean | 'invited_user' | 'sender' | 'admin' | 'other_user' = false
): boolean {
  if (!invitation) return false;
  // Admin or other uninvited users or sender cannot see or accept user friend invitations
  if (
    viewerRoleOrIsAdmin === true ||
    viewerRoleOrIsAdmin === 'admin' ||
    viewerRoleOrIsAdmin === 'other_user' ||
    viewerRoleOrIsAdmin === 'sender'
  ) {
    return false;
  }
  if (!viewerUserId || viewerUserId === 'admin' || viewerUserId === 'other_user' || viewerUserId === 'sender') {
    return false;
  }
  // Sender cannot accept their own invitation
  if (viewerUserId === invitation.senderId) return false;
  // Only the specific invited user can see the invitation notification and accept it
  return viewerUserId === invitation.invitedUserId;
}

/**
 * Load all stored friend invitations from localStorage
 */
export function loadFriendInvitations(): Record<string, FriendInvitationRecord> {
  try {
    const raw = localStorage.getItem(INVITATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch {
    // ignore storage errors
  }
  return {};
}

/**
 * Get the invitation record for a specific target contact ID
 */
export function getInvitationForContact(contactId: string): FriendInvitationRecord | null {
  const all = loadFriendInvitations();
  return all[contactId] || null;
}

/**
 * Save or update a friend invitation record in both localStorage and Firestore (`friend_invitations`),
 * and broadcast a window event so notifications and UI update immediately.
 */
export async function saveFriendInvitation(
  invitation: FriendInvitationRecord
): Promise<FriendInvitationRecord> {
  try {
    const all = loadFriendInvitations();
    all[invitation.invitedUserId] = invitation;
    localStorage.setItem(INVITATIONS_STORAGE_KEY, JSON.stringify(all));
    localStorage.setItem(
      `freedom_friend_invite_${invitation.invitedUserId}`,
      invitation.status === 'declined' ? 'none' : invitation.status
    );
  } catch {
    // ignore localStorage errors
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('freedom-friend-invitation-updated', {
        detail: invitation,
      })
    );
    if (invitation.status === 'pending') {
      window.dispatchEvent(
        new CustomEvent('freedom-friend-request-received', {
          detail: invitation,
        })
      );
    }
  }

  try {
    const ref = doc(db, 'friend_invitations', invitation.id);
    await setDoc(ref, invitation, { merge: true });
  } catch {
    // offline or rules fallback handled gracefully
  }

  return invitation;
}

export const saveInvitationForContact = saveFriendInvitation;

/**
 * Subscribe to real-time friend invitations in Firestore (`friend_invitations`)
 */
export function subscribeFriendInvitationsFromDb(
  onUpdate: (invitations: FriendInvitationRecord[]) => void
): () => void {
  try {
    const colRef = collection(db, 'friend_invitations');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: FriendInvitationRecord[] = [];
        const allLocal = loadFriendInvitations();
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as FriendInvitationRecord;
          if (data && data.id && data.invitedUserId) {
            list.push(data);
            allLocal[data.invitedUserId] = data;
          }
        });
        try {
          localStorage.setItem(INVITATIONS_STORAGE_KEY, JSON.stringify(allLocal));
        } catch {}
        onUpdate(list);
      },
      () => {
        // ignore snapshot permission/offline errors
      }
    );
  } catch {
    return () => {};
  }
}

/**
 * Return all pending invitations where `viewerUserId` is the exact `invitedUserId`
 * and `isViewerAdmin` is false.
 */
export function getPendingInvitationsForInvitedUser(
  viewerUserId: string | null | undefined,
  isViewerAdmin: boolean = false
): FriendInvitationRecord[] {
  if (!viewerUserId || isViewerAdmin) return [];
  const all = loadFriendInvitations();
  return Object.values(all).filter(
    (inv) =>
      inv.status === 'pending' &&
      canUserSeeAndAcceptInvitation(inv, viewerUserId, isViewerAdmin)
  );
}
