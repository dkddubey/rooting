import React from 'react';
import { AncestorMatchItem } from '../types/index.js';
import { Sparkles, ArrowRight, X } from 'lucide-react';

interface MatchNotificationBannerProps {
  matches: AncestorMatchItem[];
  onReviewMatch: (match: AncestorMatchItem) => void;
  onDismiss: () => void;
}

export const MatchNotificationBanner: React.FC<MatchNotificationBannerProps> = ({
  matches,
  onReviewMatch,
  onDismiss
}) => {
  const pendingMatches = matches.filter(m => m.status === 'PENDING');
  if (pendingMatches.length === 0) return null;

  const topMatch = pendingMatches[0];

  return (
    <aside aria-label="Smart Ancestor Match Alert" className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white shadow-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-amber-100" />
          </div>
          <div className="text-xs sm:text-sm truncate">
            <span className="font-bold">Match Found! </span>
            <span>
              We found a <span className="font-extrabold underline">{topMatch.score}% match</span> for your ancestor{' '}
              <strong className="underline decoration-white/40">{topMatch.myAncestor.firstName} {topMatch.myAncestor.lastName}</strong> with{' '}
              <strong>{topMatch.otherUser.name}</strong>'s tree.
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => onReviewMatch(topMatch)}
            className="flex items-center space-x-1 px-3 py-1 bg-white text-amber-900 hover:bg-amber-50 text-xs font-bold rounded-lg shadow-sm transition"
          >
            <span>Review & Connect</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
            title="Dismiss Alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

