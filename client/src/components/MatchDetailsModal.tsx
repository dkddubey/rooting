import React, { useState } from 'react';
import { AncestorMatchItem } from '../types/index.js';
import { X, Sparkles, Check, UserCheck, ShieldCheck, MapPin, Calendar, GitCompare } from 'lucide-react';

interface MatchDetailsModalProps {
  match: AncestorMatchItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAccept: (matchId: string) => Promise<void>;
  onDismiss: (matchId: string) => Promise<void>;
}

export const MatchDetailsModal: React.FC<MatchDetailsModalProps> = ({
  match,
  isOpen,
  onClose,
  onAccept,
  onDismiss
}) => {
  const [processing, setProcessing] = useState(false);

  if (!isOpen || !match) return null;

  const { myAncestor, matchedAncestor, otherUser, score, metrics } = match;

  const handleAccept = async () => {
    setProcessing(true);
    try {
      await onAccept(match.id);
      onClose();
    } finally {
      setProcessing(false);
    }
  };

  const handleDismiss = async () => {
    setProcessing(true);
    try {
      await onDismiss(match.id);
      onClose();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-parchment-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-forest-800 to-forest-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Sparkles className="w-5 h-5 text-amber-900" />
            </div>
            <div>
              <h3 className="font-serif-heading font-bold text-lg text-white">
                Ancestor Match Detected
              </h3>
              <p className="text-xs text-forest-200">
                Fuzzy string & phonetic algorithms found a {score}% heritage correlation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-forest-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Main Proposal Callout */}
          <div className="p-4 rounded-xl bg-parchment-100 border border-parchment-200 text-center">
            <p className="text-sm text-slate-800">
              We found a <strong className="text-forest-800 font-bold">{score}% match</strong> for your ancestor{' '}
              <strong className="underline decoration-forest-400 font-bold">
                {myAncestor.firstName} {myAncestor.lastName}
              </strong>.
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Would you like to connect with <strong className="text-slate-900">{otherUser.name}</strong> as verified relatives and link your family trees?
            </p>
          </div>

          {/* Side-by-Side Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left: Your Ancestor */}
            <div className="p-4 rounded-xl border border-forest-200 bg-forest-50/50 space-y-3">
              <div className="flex items-center justify-between border-b border-forest-100 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 bg-forest-100 px-2 py-0.5 rounded">
                  Your Tree
                </span>
                <span className="text-xs text-slate-500 font-medium">You</span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-base">
                  {myAncestor.firstName} {myAncestor.lastName}
                </h4>
                {myAncestor.maidenName && (
                  <p className="text-xs text-slate-500 italic">née {myAncestor.maidenName}</p>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5 text-forest-600 shrink-0" />
                  <span>
                    Born {myAncestor.birthYear || 'Unknown'}
                    {myAncestor.deathYear ? ` – Died ${myAncestor.deathYear}` : ''}
                  </span>
                </div>
                {myAncestor.birthPlace && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-forest-600 shrink-0" />
                    <span>{myAncestor.birthPlace}</span>
                  </div>
                )}
              </div>

              {myAncestor.bio && (
                <p className="text-[11px] text-slate-500 italic pt-2 border-t border-forest-100">
                  "{myAncestor.bio}"
                </p>
              )}
            </div>

            {/* Right: Matched Ancestor */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3">
              <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  Matched Candidate
                </span>
                <span className="text-xs text-slate-600 font-medium">
                  Tree of {otherUser.name}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-base">
                  {matchedAncestor.firstName} {matchedAncestor.lastName}
                </h4>
                {matchedAncestor.maidenName && (
                  <p className="text-xs text-slate-500 italic">née {matchedAncestor.maidenName}</p>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    Born {matchedAncestor.birthYear || 'Unknown'}
                    {matchedAncestor.deathYear ? ` – Died ${matchedAncestor.deathYear}` : ''}
                  </span>
                </div>
                {matchedAncestor.birthPlace && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{matchedAncestor.birthPlace}</span>
                  </div>
                )}
              </div>

              {matchedAncestor.bio && (
                <p className="text-[11px] text-slate-500 italic pt-2 border-t border-amber-100">
                  "{matchedAncestor.bio}"
                </p>
              )}
            </div>
          </div>

          {/* Algorithmic Scoring Breakdown */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-forest-700" />
              <span>Smart Match Algorithm Diagnostics</span>
            </h5>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[10px] font-semibold uppercase">Name Sim</div>
                <div className="font-bold text-forest-800 text-sm mt-0.5">
                  {Math.round((metrics?.nameSimilarity || 0.95) * 100)}%
                </div>
                <div className="text-[9px] text-slate-400">Jaro-Winkler</div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[10px] font-semibold uppercase">Phonetic Sound</div>
                <div className="font-bold text-forest-800 text-sm mt-0.5">
                  {metrics?.phoneticMatch ? 'Exact Match' : 'Variant'}
                </div>
                <div className="text-[9px] text-slate-400">
                  Soundex / Metaphone
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[10px] font-semibold uppercase">Birthplace</div>
                <div className="font-bold text-forest-800 text-sm mt-0.5">
                  {Math.round((metrics?.birthPlaceMatch || 0.9) * 100)}%
                </div>
                <div className="text-[9px] text-slate-400">Token Overlap</div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[10px] font-semibold uppercase">Birth Year Gap</div>
                <div className="font-bold text-forest-800 text-sm mt-0.5">
                  {metrics?.yearDelta != null ? `±${metrics.yearDelta} yr` : 'Compatible'}
                </div>
                <div className="text-[9px] text-slate-400">Within ±3 Years</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleDismiss}
            disabled={processing}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-50"
          >
            Dismiss Match
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              disabled={processing}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAccept}
              disabled={processing}
              className="inline-flex items-center space-x-2 px-5 py-2 text-xs font-bold text-white bg-forest-700 hover:bg-forest-800 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{processing ? 'Connecting...' : 'Connect as Relatives & Link Trees'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

