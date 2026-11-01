import React from 'react';
import { KinshipDetails } from '../types/index.js';
import { X, GitMerge, Award, ChevronRight, User, Compass } from 'lucide-react';

interface KinshipViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  kinship: KinshipDetails | null;
  otherUserName: string;
}

export const KinshipViewerModal: React.FC<KinshipViewerModalProps> = ({
  isOpen,
  onClose,
  kinship,
  otherUserName
}) => {
  if (!isOpen || !kinship) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-parchment-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-forest-800 to-forest-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-forest-700 border border-forest-600 flex items-center justify-center">
              <GitMerge className="w-5 h-5 text-forest-200" />
            </div>
            <div>
              <h3 className="font-serif-heading font-bold text-lg text-white">
                Kinship & Common Ancestor Hierarchy
              </h3>
              <p className="text-xs text-forest-200">
                Shared heritage path between you and {otherUserName}
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

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Kinship Title Banner */}
          <div className="p-4 rounded-xl bg-forest-50 border border-forest-200 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-forest-600 text-white flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700">
                Computed Genealogical Kinship
              </span>
              <h4 className="font-bold text-forest-950 text-base sm:text-lg">
                {kinship.kinshipRelationship}
              </h4>
              <p className="text-xs text-forest-800 mt-0.5">
                Total generational graph distance: {kinship.totalDistance} degrees
              </p>
            </div>
          </div>

          {/* Lowest Common Ancestor (LCA) Highlight */}
          {kinship.commonAncestorName && (
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                Lowest Common Ancestor (LCA)
              </span>
              <h4 className="font-serif-heading font-bold text-slate-900 text-lg">
                {kinship.commonAncestorName}
              </h4>
              {kinship.commonAncestorBirthYear && (
                <p className="text-xs text-slate-600">
                  Born c. {kinship.commonAncestorBirthYear}
                </p>
              )}
            </div>
          )}

          {/* Lineage Paths Side by Side */}
          <div className="space-y-4">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Generational Descent Tree
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Your Lineage */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="text-xs font-bold text-slate-800 pb-1 border-b border-slate-200">
                  Your Lineage ({kinship.depthUser1} gens to LCA)
                </div>
                <div className="space-y-1.5 pt-1">
                  {kinship.pathUser1.map((p, idx) => (
                    <div
                      key={p.id}
                      className={`flex items-center space-x-2 text-xs p-1.5 rounded ${
                        idx === kinship.pathUser1.length - 1
                          ? 'bg-amber-100/70 font-semibold text-amber-950'
                          : 'text-slate-700'
                      }`}
                    >
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium">{p.name}</span>
                      <span className="text-[10px] text-slate-400 ml-auto">
                        {idx === 0 ? 'You' : `Gen +${idx}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Other User's Lineage */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="text-xs font-bold text-slate-800 pb-1 border-b border-slate-200">
                  {otherUserName}'s Lineage ({kinship.depthUser2} gens to LCA)
                </div>
                <div className="space-y-1.5 pt-1">
                  {kinship.pathUser2.map((p, idx) => (
                    <div
                      key={p.id}
                      className={`flex items-center space-x-2 text-xs p-1.5 rounded ${
                        idx === kinship.pathUser2.length - 1
                          ? 'bg-amber-100/70 font-semibold text-amber-950'
                          : 'text-slate-700'
                      }`}
                    >
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium">{p.name}</span>
                      <span className="text-[10px] text-slate-400 ml-auto">
                        {idx === 0 ? otherUserName : `Gen +${idx}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-forest-700 hover:bg-forest-800 rounded-lg shadow-sm transition"
          >
            Close Explorer
          </button>
        </div>
      </div>
    </div>
  );
};

