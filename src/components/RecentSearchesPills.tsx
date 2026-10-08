import React from 'react';
import { Clock, X, Search, Trash2 } from 'lucide-react';

export const RECENT_SEARCHES_STORAGE_KEY = 'freedom_recent_chat_searches_v1';
export const MAX_RECENT_SEARCHES = 5;

export interface RecentSearchesPillsProps {
  recentSearches: string[];
  activeQuery: string;
  onSelectSearch: (query: string) => void;
  onRemoveSearch: (query: string) => void;
  onClearAll: () => void;
  isDark?: boolean;
  primaryColor?: string;
}

export const RecentSearchesPills: React.FC<RecentSearchesPillsProps> = ({
  recentSearches,
  activeQuery,
  onSelectSearch,
  onRemoveSearch,
  onClearAll,
  isDark = false,
  primaryColor = '#7C3AED',
}) => {
  const displayedSearches = recentSearches.slice(0, MAX_RECENT_SEARCHES);

  return (
    <section
      id="recent-searches-section"
      aria-label="Recent Searches"
      className={`px-3.5 py-2.5 border-b transition-colors ${
        isDark
          ? 'bg-[#161B26] border-slate-800/90 text-slate-100'
          : 'bg-slate-50/90 border-slate-200/80 text-slate-800'
      }`}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0 border border-current/20"
          >
            <Clock className="w-2.5 h-2.5 stroke-[2.5]" />
            <span>Recent</span>
          </span>
          <h2
            className={`text-xs font-bold tracking-tight truncate ${
              isDark ? 'text-slate-200' : 'text-slate-700'
            }`}
          >
            Recent Searches
          </h2>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200/80 text-slate-600'
            }`}
            title="Stores the last 5 search queries"
          >
            {displayedSearches.length}/{MAX_RECENT_SEARCHES}
          </span>
        </div>

        {displayedSearches.length > 0 && (
          <button
            id="clear-recent-searches-btn"
            type="button"
            onClick={onClearAll}
            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
              isDark
                ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                : 'text-slate-500 hover:text-rose-600 hover:bg-slate-200/60'
            }`}
            title="Clear all recent searches"
          >
            <Trash2 className="w-2.5 h-2.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Recent Search Query Pills */}
      {displayedSearches.length > 0 ? (
        <div
          id="recent-searches-pills-list"
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-wrap"
        >
          {displayedSearches.map((query, index) => {
            const isSelected =
              activeQuery.trim().toLowerCase() === query.trim().toLowerCase() &&
              activeQuery.trim().length > 0;

            return (
              <div
                key={`${query}-${index}`}
                id={`recent-search-pill-${index}`}
                style={
                  isSelected
                    ? {
                        backgroundColor: primaryColor,
                        borderColor: primaryColor,
                        color: '#FFFFFF',
                      }
                    : undefined
                }
                className={`group inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-semibold border transition-all shrink-0 shadow-2xs ${
                  isSelected
                    ? 'text-white shadow-sm'
                    : isDark
                    ? 'bg-[#1E2534] hover:bg-slate-800 text-slate-200 border-slate-700/80'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectSearch(query)}
                  className="inline-flex items-center gap-1.5 cursor-pointer focus:outline-none max-w-[150px]"
                  title={`Search "${query}"`}
                >
                  <Clock
                    className={`w-3 h-3 shrink-0 ${
                      isSelected
                        ? 'text-white'
                        : isDark
                        ? 'text-slate-400 group-hover:text-slate-200'
                        : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span className="truncate">{query}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveSearch(query);
                  }}
                  aria-label={`Remove ${query} from recent searches`}
                  title={`Remove "${query}"`}
                  className={`w-4 h-4 rounded-full inline-flex items-center justify-center transition-colors cursor-pointer ${
                    isSelected
                      ? 'hover:bg-black/20 text-white/90'
                      : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          id="recent-searches-empty-pill"
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border ${
            isDark
              ? 'bg-[#1C2230]/70 border-slate-800 text-slate-400'
              : 'bg-white/80 border-slate-200/80 text-slate-400'
          }`}
        >
          <Search className="w-3 h-3 opacity-70" />
          <span>Search conversations above — your last 5 queries are saved here</span>
        </div>
      )}
    </section>
  );
};
