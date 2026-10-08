import React from 'react';
import { ArrowUpDown, Filter, RotateCcw } from 'lucide-react';

export type AdvancedSearchScope = 'all' | 'name' | 'username' | 'email' | 'texted';

export function getUserUsername(entity: any): string {
  if (entity?.username && typeof entity.username === 'string') {
    return entity.username.replace(/^@/, '');
  }
  const baseName = (entity?.name || 'user').toString().toLowerCase().trim();
  return baseName.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'user';
}

export function getUserEmail(entity: any): string {
  if (entity?.email && typeof entity.email === 'string') {
    return entity.email;
  }
  return `${getUserUsername(entity)}@freedom.io`;
}

export function getUserAlphabetLetter(entity: any): string {
  const name = (entity?.name || '').toString().trim();
  const firstChar = name.charAt(0).toUpperCase();
  return /[A-Z]/.test(firstChar) ? firstChar : '#';
}

export interface FilterAndSortOptions {
  searchQuery: string;
  alphabetFilter: string;
  scope: AdvancedSearchScope;
  sortOrder: 'asc' | 'desc';
  aiMatchedIds?: string[];
  aiMatchReasons?: Record<string, string>;
}

export function filterAndSortEntitiesAdvanced<T extends Record<string, any>>(
  items: T[],
  options: FilterAndSortOptions
): { item: T; matchReason?: string }[] {
  const {
    searchQuery = '',
    alphabetFilter = 'ALL',
    scope = 'all',
    sortOrder = 'asc',
    aiMatchedIds = [],
    aiMatchReasons = {},
  } = options;

  const query = searchQuery.trim().toLowerCase();

  const filtered = items.filter((item) => {
    if (alphabetFilter && alphabetFilter !== 'ALL') {
      const letter = getUserAlphabetLetter(item);
      if (letter !== alphabetFilter) return false;
    }

    if (aiMatchedIds && aiMatchedIds.length > 0 && !query) {
      return aiMatchedIds.includes(item.id);
    }

    if (!query) return true;

    const name = (item.name || '').toString().toLowerCase();
    const username = getUserUsername(item).toLowerCase();
    const email = getUserEmail(item).toLowerCase();
    const texted = `${item.lastMessage || ''} ${item.groupTopic || ''} ${item.nativeLanguage || ''}`.toLowerCase();

    if (scope === 'name') return name.includes(query);
    if (scope === 'username') return username.includes(query.replace(/^@/, ''));
    if (scope === 'email') return email.includes(query);
    if (scope === 'texted') return texted.includes(query);

    return (
      name.includes(query) ||
      username.includes(query.replace(/^@/, '')) ||
      email.includes(query) ||
      texted.includes(query)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    const nameA = (a.name || '').toString().toLowerCase();
    const nameB = (b.name || '').toString().toLowerCase();
    return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  });

  return sorted.map((item) => ({
    item,
    matchReason: aiMatchReasons[item.id],
  }));
}

interface AdvancedAiSearchPanelProps {
  items: any[];
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  alphabetFilter: string;
  onAlphabetFilterChange: (letter: string) => void;
  scope: AdvancedSearchScope;
  onScopeChange: (scope: AdvancedSearchScope) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  onAiResults?: (ids: string[], summary: string, reasons: Record<string, string>) => void;
  isDark?: boolean;
  primaryColor?: string;
  contextLabel?: string;
  compact?: boolean;
  idPrefix?: string;
}

const ALPHABET = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

export const AdvancedAiSearchPanel: React.FC<AdvancedAiSearchPanelProps> = ({
  searchQuery,
  onSearchQueryChange,
  alphabetFilter,
  onAlphabetFilterChange,
  scope,
  onScopeChange,
  sortOrder,
  onSortOrderChange,
  onAiResults,
  isDark = true,
  primaryColor = '#7C3AED',
  idPrefix = 'adv-search',
}) => {
  const scopes: { id: AdvancedSearchScope; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'name', label: 'Name' },
    { id: 'username', label: '@Username' },
    { id: 'email', label: 'Email' },
    { id: 'texted', label: 'Texted' },
  ];

  const hasActiveFilters =
    Boolean(searchQuery.trim()) || alphabetFilter !== 'ALL' || scope !== 'all' || sortOrder !== 'asc';

  return (
    <div id={`${idPrefix}-panel`} className="space-y-2">
      {/* Scope & Sort Row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap">
          <Filter className="w-3 h-3 text-slate-400 mr-0.5 shrink-0" />
          {scopes.map((s) => {
            const active = scope === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onScopeChange(s.id)}
                style={active ? { backgroundColor: primaryColor } : undefined}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  active
                    ? 'text-white shadow-2xs'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-200/70 text-slate-700 hover:bg-slate-300/70'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 border cursor-pointer transition-all ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ArrowUpDown className="w-2.5 h-2.5" />
            <span>{sortOrder === 'asc' ? 'A–Z' : 'Z–A'}</span>
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                onSearchQueryChange('');
                onAlphabetFilterChange('ALL');
                onScopeChange('all');
                onSortOrderChange('asc');
                if (onAiResults) onAiResults([], '', {});
              }}
              className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Alphabet A-Z Filter Bar */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
        {ALPHABET.map((letter) => {
          const active = alphabetFilter === letter;
          return (
            <button
              key={letter}
              type="button"
              onClick={() => onAlphabetFilterChange(letter)}
              style={active ? { backgroundColor: primaryColor } : undefined}
              className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold shrink-0 transition-all cursor-pointer ${
                active
                  ? 'text-white shadow-2xs'
                  : isDark
                  ? 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
};
