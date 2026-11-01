import React, { useState, useMemo, useRef } from 'react';
import { Ancestor } from '../types/index.js';
import { AncestorNodeCard } from './AncestorNodeCard.js';
import { ZoomIn, ZoomOut, Maximize2, Search, Filter, Plus, Compass } from 'lucide-react';

interface FamilyTreeCanvasProps {
  ancestors: Ancestor[];
  onEdit: (ancestor: Ancestor) => void;
  onDelete: (id: string) => void;
  onAddRelative: (parent: Ancestor) => void;
  onOpenAddModal: () => void;
  highlightedAncestorId?: string | null;
}

export const FamilyTreeCanvas: React.FC<FamilyTreeCanvasProps> = ({
  ancestors,
  onEdit,
  onDelete,
  onAddRelative,
  onOpenAddModal,
  highlightedAncestorId
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const canvasRef = useRef<HTMLDivElement>(null);

  // Group ancestors by generational levels
  // Level 0: Self / youngest generation
  // Level 1: Parents
  // Level 2: Grandparents
  // Level 3: Great-Grandparents
  const generations = useMemo(() => {
    const genMap = new Map<number, Ancestor[]>();

    // Calculate parent depths
    const depthLookup = new Map<string, number>();
    const parentMap = new Map<string, string[]>();

    ancestors.forEach(a => {
      parentMap.set(a.id, [a.fatherId, a.motherId].filter(Boolean) as string[]);
    });

    const getDepth = (id: string, visited = new Set<string>()): number => {
      if (depthLookup.has(id)) return depthLookup.get(id)!;
      if (visited.has(id)) return 0;
      visited.add(id);

      const parents = parentMap.get(id) || [];
      if (parents.length === 0) {
        depthLookup.set(id, 0);
        return 0;
      }

      let maxP = 0;
      for (const p of parents) {
        maxP = Math.max(maxP, getDepth(p, new Set(visited)) + 1);
      }
      depthLookup.set(id, maxP);
      return maxP;
    };

    ancestors.forEach(a => getDepth(a.id));

    // Invert depth so oldest generations (great-grandparents) are on top (tier 3),
    // and youngest (self) is on bottom (tier 0)
    const maxGenerationDepth = Math.max(0, ...Array.from(depthLookup.values()));

    ancestors.forEach(a => {
      // Oldest generation on top: maxGenerationDepth - depth
      const tier = (maxGenerationDepth - (depthLookup.get(a.id) || 0));
      if (!genMap.has(tier)) {
        genMap.set(tier, []);
      }
      genMap.get(tier)!.push(a);
    });

    const sortedTiers = Array.from(genMap.keys()).sort((a, b) => a - b);
    return sortedTiers.map(tier => ({
      tierIndex: tier,
      title:
        tier === 0
          ? 'Earliest Patriarchs & Matriarchs'
          : tier === 1
          ? 'Grandparents Generation'
          : tier === 2
          ? 'Parents Generation'
          : 'Descendants / Immediate Family',
      ancestors: genMap.get(tier)!
    }));
  }, [ancestors]);

  // Filtered ancestors for quick search
  const filteredAncestors = useMemo(() => {
    return ancestors.filter(a => {
      const fullName = `${a.firstName} ${a.lastName} ${a.maidenName || ''}`.toLowerCase();
      const place = `${a.birthPlace || ''} ${a.deathPlace || ''}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || place.includes(searchQuery.toLowerCase());
      const matchesGender = selectedGender === 'all' || a.gender === selectedGender;
      return matchesSearch && matchesGender;
    });
  }, [ancestors, searchQuery, selectedGender]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.15, 1.6));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.15, 0.6));
  const handleResetZoom = () => setZoom(1);

  if (ancestors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[70vh] border-2 border-dashed border-parchment-300 rounded-2xl bg-white/50">
        <div className="w-16 h-16 rounded-2xl bg-forest-100 text-forest-700 flex items-center justify-center mb-4">
          <Compass className="w-8 h-8" />
        </div>
        <h3 className="font-serif-heading text-2xl font-bold text-slate-800 mb-2">
          Start Your Family Tree
        </h3>
        <p className="text-slate-500 max-w-md mb-6 text-sm">
          You haven't added any ancestors yet. Add your known parents, grandparents, or earlier ancestors to visualize your lineage and trigger automated smart matching!
        </p>
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-medium shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add First Ancestor</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-8.5rem)] rounded-2xl border border-parchment-200 overflow-hidden bg-[#faf8f5] shadow-inner flex flex-col">
      {/* Top Floating Control Bar */}
      <div className="p-3 bg-white/90 backdrop-blur border-b border-parchment-200 flex flex-wrap items-center justify-between gap-3 z-20">
        {/* Search & Filter */}
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search ancestor name, birthplace, dates..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-parchment-50 border border-parchment-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-600"
            />
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            <select
              value={selectedGender}
              onChange={e => setSelectedGender(e.target.value)}
              className="text-xs bg-parchment-50 border border-parchment-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-forest-600"
            >
              <option value="all">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        {/* Stats & Canvas Zoom Controls */}
        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-500 font-medium">
            {ancestors.length} Ancestor{ancestors.length !== 1 ? 's' : ''} Mapped
          </span>

          <div className="flex items-center space-x-1 bg-parchment-100 p-1 rounded-lg border border-parchment-200">
            <button
              onClick={handleZoomOut}
              className="p-1 hover:bg-white rounded text-slate-600 hover:text-slate-900 transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1.5 text-slate-600">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 hover:bg-white rounded text-slate-600 hover:text-slate-900 transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 hover:bg-white rounded text-slate-600 hover:text-slate-900 transition ml-1"
              title="Reset Zoom"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-forest-700 hover:bg-forest-800 text-white text-xs font-medium shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Node</span>
          </button>
        </div>
      </div>

      {/* Interactive Family Canvas Surface */}
      <div
        ref={canvasRef}
        className="flex-1 overflow-auto p-8 tree-grid-pattern cursor-grab active:cursor-grabbing"
      >
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out'
          }}
          className="min-w-max mx-auto py-6 space-y-12"
        >
          {generations.map(gen => {
            // Apply filtering if search or gender filter active
            const visibleAncestors = gen.ancestors.filter(a =>
              filteredAncestors.some(fa => fa.id === a.id)
            );

            if (visibleAncestors.length === 0) return null;

            return (
              <div key={gen.tierIndex} className="relative">
                {/* Generation Tier Badge */}
                <div className="flex items-center justify-center mb-6">
                  <div className="flex items-center space-x-2 px-3 py-1 bg-white/80 backdrop-blur rounded-full border border-parchment-200 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-forest-500" />
                    <span className="text-xs font-semibold text-forest-900 uppercase tracking-wider">
                      {gen.title}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({visibleAncestors.length})
                    </span>
                  </div>
                </div>

                {/* Nodes in this Tier */}
                <div className="flex flex-wrap items-center justify-center gap-6 relative z-10">
                  {visibleAncestors.map(anc => (
                    <AncestorNodeCard
                      key={anc.id}
                      ancestor={anc}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onAddRelative={onAddRelative}
                      isHighlighted={anc.id === highlightedAncestorId}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

