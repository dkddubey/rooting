import React, { useState } from 'react';
import { AncestorMatchItem } from '../types/index.js';
import { Sparkles, ArrowRight, CheckCircle2, ShieldAlert, RefreshCw, Layers } from 'lucide-react';

interface MatchesViewProps {
  matches: AncestorMatchItem[];
  onReviewMatch: (match: AncestorMatchItem) => void;
  onTriggerScan: () => Promise<void>;
}

export const MatchesView: React.FC<MatchesViewProps> = ({
  matches,
  onReviewMatch,
  onTriggerScan
}) => {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'DISMISSED'>('ALL');
  const [scanning, setScanning] = useState(false);

  const filteredMatches = matches.filter(m => {
    if (filter === 'ALL') return true;
    return m.status === filter;
  });

  const handleScan = async () => {
    setScanning(true);
    try {
      await onTriggerScan();
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="p-6 bg-white rounded-2xl border border-parchment-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="font-serif-heading text-2xl font-bold text-slate-900">
              Smart Ancestor Matches
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 rounded">
              AI Matching Engine
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Detects shared ancestors across different family trees using Levenshtein distance, Jaro-Winkler phonetic algorithms, and birthplace proximity.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleScan}
            disabled={scanning}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-parchment-100 hover:bg-parchment-200 text-forest-900 border border-parchment-200 rounded-xl text-xs font-semibold transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Scanning Trees...' : 'Run Full Database Scan'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 text-xs font-medium">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg transition ${
            filter === 'ALL' ? 'bg-forest-800 text-white shadow-xs' : 'bg-white text-slate-600 border border-parchment-200'
          }`}
        >
          All ({matches.length})
        </button>
        <button
          onClick={() => setFilter('PENDING')}
          className={`px-3 py-1.5 rounded-lg transition ${
            filter === 'PENDING' ? 'bg-forest-800 text-white shadow-xs' : 'bg-white text-slate-600 border border-parchment-200'
          }`}
        >
          Pending Review ({matches.filter(m => m.status === 'PENDING').length})
        </button>
        <button
          onClick={() => setFilter('ACCEPTED')}
          className={`px-3 py-1.5 rounded-lg transition ${
            filter === 'ACCEPTED' ? 'bg-forest-800 text-white shadow-xs' : 'bg-white text-slate-600 border border-parchment-200'
          }`}
        >
          Accepted & Linked ({matches.filter(m => m.status === 'ACCEPTED').length})
        </button>
      </div>

      {/* Matches Grid */}
      {filteredMatches.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-parchment-200">
          <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h3 className="font-serif-heading font-bold text-lg text-slate-800">
            No Matches Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Try adding more ancestors with birthplaces and years, or click "Run Full Database Scan" to test cross-user comparisons.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map(m => (
            <div
              key={m.id}
              className={`p-5 rounded-2xl border transition shadow-sm bg-white ${
                m.status === 'PENDING'
                  ? 'border-amber-300 ring-1 ring-amber-100 hover:shadow-md'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                {/* Left: Score Badge & Names */}
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center shrink-0">
                    <span className="text-sm font-black text-amber-800 leading-none">
                      {m.score}%
                    </span>
                    <span className="text-[9px] uppercase font-bold text-amber-600 mt-0.5">
                      Match
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-slate-900 text-base">
                        {m.myAncestor.firstName} {m.myAncestor.lastName}
                      </h4>
                      <span className="text-slate-400 font-normal">↔</span>
                      <h4 className="font-bold text-slate-900 text-base">
                        {m.matchedAncestor.firstName} {m.matchedAncestor.lastName}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-500 mt-1">
                      Candidate found in tree of <strong className="text-slate-700">{m.otherUser.name}</strong> •{' '}
                      Birthplaces: <span className="font-medium text-slate-700">{m.myAncestor.birthPlace || 'Unknown'}</span> vs{' '}
                      <span className="font-medium text-slate-700">{m.matchedAncestor.birthPlace || 'Unknown'}</span>
                    </p>

                    {/* Algorithmic pills */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="px-2 py-0.5 bg-forest-50 text-forest-800 text-[10px] font-semibold rounded">
                        Name Sim: {Math.round((m.metrics?.nameSimilarity || 0.95) * 100)}%
                      </span>
                      <span className="px-2 py-0.5 bg-forest-50 text-forest-800 text-[10px] font-semibold rounded">
                        Soundex: {m.metrics?.soundex1 || 'V520'}
                      </span>
                      <span className="px-2 py-0.5 bg-forest-50 text-forest-800 text-[10px] font-semibold rounded">
                        Birth Gap: ±{m.metrics?.yearDelta != null ? m.metrics.yearDelta : 1} yr
                      </span>
                      {m.status === 'ACCEPTED' && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Trees Linked</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center space-x-2 self-end md:self-center">
                  <button
                    onClick={() => onReviewMatch(m)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold rounded-xl shadow-sm transition"
                  >
                    <span>{m.status === 'ACCEPTED' ? 'View Details' : 'Review Match Proposal'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

