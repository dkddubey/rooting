import React from 'react';
import { Ancestor } from '../types/index.js';
import { MapPin, Calendar, Edit3, Trash2, UserPlus, Heart } from 'lucide-react';

interface AncestorNodeCardProps {
  ancestor: Ancestor;
  onEdit: (ancestor: Ancestor) => void;
  onDelete: (id: string) => void;
  onAddRelative: (parentAncestor: Ancestor) => void;
  isHighlighted?: boolean;
}

export const AncestorNodeCard: React.FC<AncestorNodeCardProps> = ({
  ancestor,
  onEdit,
  onDelete,
  onAddRelative,
  isHighlighted = false
}) => {
  const isMale = ancestor.gender === 'male';
  const isFemale = ancestor.gender === 'female';

  const lifespan = ancestor.birthYear
    ? `${ancestor.birthYear} – ${ancestor.deathYear || 'Living'}`
    : ancestor.deathYear
    ? `Died ${ancestor.deathYear}`
    : 'Date Unknown';

  return (
    <div
      className={`relative w-64 bg-white rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md ${
        isHighlighted
          ? 'ring-2 ring-amber-400 border-amber-300 shadow-amber-100'
          : isMale
          ? 'border-slate-200 hover:border-blue-300'
          : isFemale
          ? 'border-slate-200 hover:border-rose-300'
          : 'border-slate-200 hover:border-forest-300'
      }`}
    >
      {/* Top Accent Strip */}
      <div
        className={`h-1.5 w-full rounded-t-xl ${
          isHighlighted
            ? 'bg-amber-400'
            : isMale
            ? 'bg-blue-500'
            : isFemale
            ? 'bg-rose-400'
            : 'bg-forest-600'
        }`}
      />

      <div className="p-3.5 space-y-2">
        {/* Header: Name & Gender */}
        <div className="flex items-start justify-between">
          <div className="pr-2">
            <h4 className="font-semibold text-slate-900 text-sm leading-snug">
              {ancestor.firstName} {ancestor.lastName}
            </h4>
            {ancestor.maidenName && (
              <p className="text-[11px] text-slate-500 italic">
                (née {ancestor.maidenName})
              </p>
            )}
          </div>

          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider shrink-0 ${
              isMale
                ? 'bg-blue-50 text-blue-700'
                : isFemale
                ? 'bg-rose-50 text-rose-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {ancestor.gender}
          </span>
        </div>

        {/* Lifespan */}
        <div className="flex items-center text-xs text-slate-600 space-x-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{lifespan}</span>
        </div>

        {/* Birthplace */}
        {ancestor.birthPlace && (
          <div className="flex items-center text-xs text-slate-600 space-x-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate" title={ancestor.birthPlace}>
              {ancestor.birthPlace}
            </span>
          </div>
        )}

        {/* Bio snippet if available */}
        {ancestor.bio && (
          <p className="text-[11px] text-slate-500 line-clamp-2 pt-1 border-t border-slate-100">
            {ancestor.bio}
          </p>
        )}

        {/* Parents Indicator if linked */}
        {(ancestor.father || ancestor.mother) && (
          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 truncate">
            Parents:{' '}
            {[
              ancestor.father ? `${ancestor.father.firstName}` : null,
              ancestor.mother ? `${ancestor.mother.firstName}` : null
            ]
              .filter(Boolean)
              .join(' & ')}
          </div>
        )}

        {/* Quick Node Actions */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <button
            onClick={() => onAddRelative(ancestor)}
            className="inline-flex items-center space-x-1 text-[11px] font-medium text-forest-700 hover:text-forest-900 transition"
            title="Add Child or Parent"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Connect</span>
          </button>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => onEdit(ancestor)}
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="Edit Ancestor"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(ancestor.id)}
              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              title="Delete Ancestor"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

