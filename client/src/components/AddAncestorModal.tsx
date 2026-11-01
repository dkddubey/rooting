import React, { useState, useEffect } from 'react';
import { Ancestor } from '../types/index.js';
import { X, Sparkles, UserPlus } from 'lucide-react';

interface AddAncestorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Ancestor>) => Promise<void>;
  existingAncestors: Ancestor[];
  editingAncestor?: Ancestor | null;
  initialParent?: Ancestor | null;
}

export const AddAncestorModal: React.FC<AddAncestorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingAncestors,
  editingAncestor,
  initialParent
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [maidenName, setMaidenName] = useState('');
  const [gender, setGender] = useState('male');
  const [birthYear, setBirthYear] = useState('');
  const [deathYear, setDeathYear] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [deathPlace, setDeathPlace] = useState('');
  const [bio, setBio] = useState('');
  const [fatherId, setFatherId] = useState('');
  const [motherId, setMotherId] = useState('');
  const [spouseId, setSpouseId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingAncestor) {
      setFirstName(editingAncestor.firstName);
      setLastName(editingAncestor.lastName);
      setMaidenName(editingAncestor.maidenName || '');
      setGender(editingAncestor.gender || 'male');
      setBirthYear(editingAncestor.birthYear ? String(editingAncestor.birthYear) : '');
      setDeathYear(editingAncestor.deathYear ? String(editingAncestor.deathYear) : '');
      setBirthPlace(editingAncestor.birthPlace || '');
      setDeathPlace(editingAncestor.deathPlace || '');
      setBio(editingAncestor.bio || '');
      setFatherId(editingAncestor.fatherId || '');
      setMotherId(editingAncestor.motherId || '');
      setSpouseId(editingAncestor.spouseId || '');
    } else if (initialParent) {
      // Pre-fill parent relation
      setFirstName('');
      setLastName(initialParent.lastName);
      setMaidenName('');
      setGender('male');
      setBirthYear('');
      setDeathYear('');
      setBirthPlace(initialParent.birthPlace || '');
      setDeathPlace('');
      setBio('');
      if (initialParent.gender === 'male') {
        setFatherId(initialParent.id);
        setMotherId('');
      } else {
        setMotherId(initialParent.id);
        setFatherId('');
      }
      setSpouseId('');
    } else {
      setFirstName('');
      setLastName('');
      setMaidenName('');
      setGender('male');
      setBirthYear('');
      setDeathYear('');
      setBirthPlace('');
      setDeathPlace('');
      setBio('');
      setFatherId('');
      setMotherId('');
      setSpouseId('');
    }
    setError('');
  }, [editingAncestor, initialParent, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim()) {
      setError('First and Last Name are required.');
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        maidenName: maidenName.trim() || null,
        gender,
        birthYear: birthYear ? parseInt(birthYear, 10) : null,
        deathYear: deathYear ? parseInt(deathYear, 10) : null,
        birthPlace: birthPlace.trim() || null,
        deathPlace: deathPlace.trim() || null,
        bio: bio.trim() || null,
        fatherId: fatherId || null,
        motherId: motherId || null,
        spouseId: spouseId || null
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save ancestor');
    } finally {
      setSubmitting(false);
    }
  };

  const potentialFathers = existingAncestors.filter(
    a => (!editingAncestor || a.id !== editingAncestor.id) && (a.gender === 'male' || a.gender === 'other')
  );

  const potentialMothers = existingAncestors.filter(
    a => (!editingAncestor || a.id !== editingAncestor.id) && (a.gender === 'female' || a.gender === 'other')
  );

  const potentialSpouses = existingAncestors.filter(
    a => !editingAncestor || a.id !== editingAncestor.id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-parchment-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-parchment-200 flex items-center justify-between bg-parchment-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-forest-100 text-forest-700 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif-heading font-bold text-lg text-slate-800">
                {editingAncestor ? 'Edit Ancestor' : 'Add New Ancestor'}
              </h3>
              <p className="text-xs text-slate-500">
                Fuzzy matching will scan for heritage overlaps upon saving
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Names Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="e.g. Arthur"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="e.g. Vance"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Maiden Name (if applicable)
              </label>
              <input
                type="text"
                value={maidenName}
                onChange={e => setMaidenName(e.target.value)}
                placeholder="e.g. O'Connor"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-600"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other / Unknown</option>
              </select>
            </div>
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Birth Year
              </label>
              <input
                type="number"
                min="1000"
                max="2030"
                value={birthYear}
                onChange={e => setBirthYear(e.target.value)}
                placeholder="e.g. 1898"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Death Year (blank if living)
              </label>
              <input
                type="number"
                min="1000"
                max="2030"
                value={deathYear}
                onChange={e => setDeathYear(e.target.value)}
                placeholder="e.g. 1965"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-600"
              />
            </div>
          </div>

          {/* Places Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Birthplace
              </label>
              <input
                type="text"
                value={birthPlace}
                onChange={e => setBirthPlace(e.target.value)}
                placeholder="e.g. County Cork, Ireland"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Death Place
              </label>
              <input
                type="text"
                value={deathPlace}
                onChange={e => setDeathPlace(e.target.value)}
                placeholder="e.g. Boston, MA"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-600"
              />
            </div>
          </div>

          {/* Pedigree Parent Linking */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <span>Parentage & Spouse Links</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Father
                </label>
                <select
                  value={fatherId}
                  onChange={e => setFatherId(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-600"
                >
                  <option value="">None / Unknown</option>
                  {potentialFathers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.birthYear || '?'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Mother
                </label>
                <select
                  value={motherId}
                  onChange={e => setMotherId(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-600"
                >
                  <option value="">None / Unknown</option>
                  {potentialMothers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.birthYear || '?'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Spouse
              </label>
              <select
                value={spouseId}
                onChange={e => setSpouseId(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-600"
              >
                <option value="">None / Not in tree</option>
                {potentialSpouses.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.birthYear || '?'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Historical Notes & Bio
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="e.g. Immigrated 1914, stonemason in Boston harbor..."
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-600"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-1 text-[11px] text-forest-700">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart matching runs automatically</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-forest-700 hover:bg-forest-800 rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {submitting ? 'Saving...' : editingAncestor ? 'Update Ancestor' : 'Add to Tree'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

