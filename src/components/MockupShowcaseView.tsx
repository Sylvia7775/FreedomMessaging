import React from 'react';
import { PhoneFrame } from './PhoneFrame';
import { ChatsListScreen } from './ChatsListScreen';
import { ActiveChatScreen } from './ActiveChatScreen';
import { OnboardingScreen } from './OnboardingScreen';
import { UserContact, ChatMessage, ScreenView, ThemeMode, StickerItem } from '../types';

interface MockupShowcaseViewProps {
  contacts: UserContact[];
  kristinContact?: UserContact;
  activeContact?: UserContact;
  messages: ChatMessage[];
  onSelectChat: (contact: UserContact) => void;
  onSendMessage: (
    text: string,
    type?: 'text' | 'audio' | 'image' | 'video' | 'sticker',
    imageUrl?: string,
    stickerData?: { id: string; name: string; category?: string }
  ) => void;
  onStartCall: (type: 'voice' | 'video') => void;
  onNavigate: (screen: ScreenView) => void;
  userMotherLanguage: string;
  theme?: ThemeMode;
  onToggleMessageStatus?: (messageId: string) => void;
  onReactToMessage?: (messageId: string, emoji: string) => void;
  onToggleBlockUser?: (contactId: string, blocked: boolean) => void;
  customStickers?: StickerItem[];
  onArchiveChat?: (contactId: string, isArchived: boolean) => Promise<void> | void;
  onDeleteChat?: (contactId: string) => Promise<void> | void;
  onRestoreChat?: (contactId: string) => Promise<void> | void;
  onPinChat?: (contactId: string, isPinned: boolean) => Promise<void> | void;
  onToggleReadChat?: (contactId: string, isRead: boolean) => Promise<void> | void;
  onToggleLikeMedia?: (mediaId: string, isLiked: boolean) => void;
  onToggleFavoriteMedia?: (mediaId: string, isFavorite: boolean) => void;
  onRateMedia?: (mediaId: string, rating: number) => void;
  onOpenNewChatModal?: () => void;
  onOpenQrScanner?: () => void;
  primaryColor?: string;
}

export const MockupShowcaseView: React.FC<MockupShowcaseViewProps> = ({
  contacts,
  kristinContact,
  activeContact,
  messages,
  onSelectChat,
  onSendMessage,
  onStartCall,
  onNavigate,
  userMotherLanguage,
  theme = 'light',
  onToggleMessageStatus,
  onReactToMessage,
  onToggleBlockUser,
  customStickers = [],
  onArchiveChat,
  onDeleteChat,
  onRestoreChat,
  onPinChat,
  onToggleReadChat,
  onToggleLikeMedia,
  onToggleFavoriteMedia,
  onRateMedia,
  onOpenNewChatModal,
  onOpenQrScanner,
  primaryColor = '#7C3AED',
}) => {
  const currentContact = activeContact || kristinContact || contacts[0];
  return (
    <div className="w-full min-h-screen py-10 px-4 sm:px-8 flex flex-col items-center justify-center relative overflow-x-auto overflow-y-auto">
      {/* Background Graphic Accents matching screenshot */}
      <div className="absolute top-10 left-10 text-white/10 font-black text-8xl pointer-events-none select-none">
        er
      </div>
      <div className="absolute bottom-20 left-8 text-white/15 font-black text-9xl pointer-events-none select-none">
        +
      </div>
      <div className="absolute bottom-10 left-20 text-white/10 font-black text-8xl pointer-events-none select-none">
        s
      </div>
      <div className="absolute top-1/2 right-12 text-white/10 font-black text-9xl pointer-events-none select-none">
        F
      </div>

      {/* Title Header */}
      <div className="text-center z-10 mb-8 max-w-xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-xs text-white text-xs font-semibold mb-3 border border-white/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Freedom UI Showcase • Interactive Mockup</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-sm">
          Freedom Multilingual Messaging
        </h1>
        <p className="text-white/80 text-xs sm:text-sm mt-1.5 font-medium">
          "Freedom talk any person of your mother language" • Click into any device to interact directly!
        </p>
      </div>

      {/* 3 Interactive Phone Mockups in Behance / Dribbble Showcase Layout */}
      <div className="flex flex-wrap lg:flex-nowrap items-center justify-center gap-8 lg:gap-10 z-10 max-w-7xl">
        {/* Phone 1: Chats List Screen (Light Mode, tilted slightly left) */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-white/80 uppercase tracking-wider mb-2">
            Chats Screen (Light)
          </span>
          <PhoneFrame className="shadow-2xl">
            <ChatsListScreen
              contacts={contacts}
              onSelectChat={onSelectChat}
              onNavigate={onNavigate}
              theme="light"
              onOpenNewChatModal={onOpenNewChatModal}
              onOpenQrScanner={onOpenQrScanner}
              primaryColor={primaryColor}
              onArchiveChat={onArchiveChat}
              onDeleteChat={onDeleteChat}
              onRestoreChat={onRestoreChat}
              onPinChat={onPinChat}
              onToggleReadChat={onToggleReadChat}
            />
          </PhoneFrame>
        </div>

        {/* Phone 2: Active Chat Screen */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Live Conversation ({theme === 'dark' ? 'Dark' : 'White'})
          </span>
          <PhoneFrame className="shadow-2xl ring-4 ring-emerald-400/40">
            {currentContact ? (
              <ActiveChatScreen
                contact={currentContact}
                messages={messages}
                onBack={() => onNavigate('chats')}
                onSendMessage={onSendMessage}
                onStartCall={onStartCall}
                theme={theme}
                userMotherLanguage={userMotherLanguage}
                onToggleMessageStatus={onToggleMessageStatus}
                onReactToMessage={onReactToMessage}
                onToggleBlockUser={onToggleBlockUser}
                customStickers={customStickers}
                onToggleLikeMedia={onToggleLikeMedia}
                onToggleFavoriteMedia={onToggleFavoriteMedia}
                onRateMedia={onRateMedia}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-6 text-center text-slate-400">
                Select a chat to begin
              </div>
            )}
          </PhoneFrame>
        </div>

        {/* Phone 3: Welcome & Login Screen (Right phone) */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-white/80 uppercase tracking-wider mb-2">
            Login & Front Page
          </span>
          <PhoneFrame className="shadow-2xl">
            <OnboardingScreen
              onStart={() => onNavigate('login')}
              theme="light"
            />
          </PhoneFrame>
        </div>
      </div>
    </div>
  );
};
