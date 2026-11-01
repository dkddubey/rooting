import React, { useState } from 'react';
import { UserConnectionItem, KinshipDetails } from '../types/index.js';
import { Users, UserPlus, GitMerge, Check, X, Shield, Clock } from 'lucide-react';

interface ConnectionsViewProps {
  connections: UserConnectionItem[];
  onRespond: (id: string, status: 'ACCEPTED' | 'REJECTED') => Promise<void>;
  onInspectKinship: (otherUserId: string, otherUserName: string) => Promise<void>;
  onSendRequest: (receiverId: string, relationType: 'RELATIVE' | 'FRIEND') => Promise<void>;
  allUsers: Array<{ id: string; name: string; email: string; bio: string }>;
  currentUserId?: string;
}

export const ConnectionsView: React.FC<ConnectionsViewProps> = ({
  connections,
  onRespond,
  onInspectKinship,
  onSendRequest,
  allUsers,
  currentUserId
}) => {
  const [activeTab, setActiveTab] = useState<'relatives' | 'pending' | 'discover'>('relatives');
  const [selectedUserToConnect, setSelectedUserToConnect] = useState<string>('');
  const [selectedRelationType, setSelectedRelationType] = useState<'RELATIVE' | 'FRIEND'>('RELATIVE');
  const [sending, setSending] = useState(false);

  const pendingRequests = connections.filter(c => c.status === 'PENDING' && !c.isRequester);
  const acceptedRelatives = connections.filter(c => c.status === 'ACCEPTED' && c.relationType === 'RELATIVE');
  const acceptedFriends = connections.filter(c => c.status === 'ACCEPTED' && c.relationType === 'FRIEND');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserToConnect) return;
    setSending(true);
    try {
      await onSendRequest(selectedUserToConnect, selectedRelationType);
      setSelectedUserToConnect('');
    } finally {
      setSending(false);
    }
  };

  // Discoverable users (excluding self and already connected)
  const connectedUserIds = new Set(connections.map(c => c.otherUser.id));
  const discoverUsers = allUsers.filter(u => u.id !== currentUserId && !connectedUserIds.has(u.id));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="p-6 bg-white rounded-2xl border border-parchment-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-heading text-2xl font-bold text-slate-900">
            Kinship & Relatives Network
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Connect with family branches, confirm common ancestors, and share genealogical records.
          </p>
        </div>

        {/* Tab buttons */}
        <div className="flex items-center space-x-1 bg-parchment-100 p-1 rounded-xl border border-parchment-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('relatives')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'relatives' ? 'bg-white text-forest-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Relatives ({acceptedRelatives.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg transition relative ${
              activeTab === 'pending' ? 'bg-white text-forest-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Requests ({pendingRequests.length})
            {pendingRequests.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px]">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'discover' ? 'bg-white text-forest-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Discover Researchers
          </button>
        </div>
      </div>

      {/* Relatives List */}
      {activeTab === 'relatives' && (
        <div className="space-y-4">
          {acceptedRelatives.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-parchment-200">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-serif-heading font-bold text-lg text-slate-800">
                No Connected Relatives Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                When ancestor matches are accepted or relative requests are confirmed, they will appear here with automated kinship calculations.
              </p>
              <button
                onClick={() => setActiveTab('discover')}
                className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold rounded-lg shadow-sm transition"
              >
                Find & Connect With Users
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {acceptedRelatives.map(conn => (
                <div
                  key={conn.id}
                  className="p-5 bg-white rounded-xl border border-parchment-200 shadow-sm hover:border-forest-300 transition space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-forest-100 text-forest-800 flex items-center justify-center font-bold text-sm">
                        {conn.otherUser.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {conn.otherUser.name}
                        </h4>
                        <p className="text-xs text-slate-500">{conn.otherUser.email}</p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-forest-50 text-forest-700 border border-forest-200">
                      Relative
                    </span>
                  </div>

                  {/* Kinship Pill */}
                  {conn.kinshipTitle ? (
                    <div className="p-2.5 rounded-lg bg-parchment-50 border border-parchment-200 flex items-center justify-between text-xs">
                      <div className="font-medium text-forest-900">
                        {conn.kinshipTitle}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic">
                      Kinship hierarchy pending common ancestor verification
                    </div>
                  )}

                  {conn.otherUser.bio && (
                    <p className="text-xs text-slate-600 italic line-clamp-2">
                      "{conn.otherUser.bio}"
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                    <button
                      onClick={() => onInspectKinship(conn.otherUser.id, conn.otherUser.name)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-forest-50 hover:bg-forest-100 text-forest-800 text-xs font-semibold rounded-lg transition"
                    >
                      <GitMerge className="w-3.5 h-3.5" />
                      <span>Explore Kinship Path</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pending Connection Requests */}
      {activeTab === 'pending' && (
        <div className="space-y-3">
          {pendingRequests.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-parchment-200">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No Pending Requests</p>
              <p className="text-xs text-slate-500">You are all caught up!</p>
            </div>
          ) : (
            pendingRequests.map(req => (
              <div
                key={req.id}
                className="p-4 bg-white rounded-xl border border-amber-200 shadow-sm flex items-center justify-between gap-4"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                    {req.otherUser.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {req.otherUser.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Wants to connect as a <strong className="text-slate-800">{req.relationType.toLowerCase()}</strong>
                    </p>
                    {req.kinshipTitle && (
                      <p className="text-xs text-forest-700 font-medium mt-0.5">
                        Predicted: {req.kinshipTitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onRespond(req.id, 'ACCEPTED')}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold rounded-lg transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => onRespond(req.id, 'REJECTED')}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Reject"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Discover & Connect Form */}
      {activeTab === 'discover' && (
        <div className="bg-white p-6 rounded-2xl border border-parchment-200 space-y-6">
          <div>
            <h3 className="font-serif-heading font-bold text-lg text-slate-900">
              Send Connection Request
            </h3>
            <p className="text-xs text-slate-500">
              Invite another researcher to collaborate on family lines.
            </p>
          </div>

          <form onSubmit={handleSend} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Researcher
              </label>
              <select
                required
                value={selectedUserToConnect}
                onChange={e => setSelectedUserToConnect(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-600"
              >
                <option value="">-- Choose User --</option>
                {discoverUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Connection Relationship Type
              </label>
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="relationType"
                    value="RELATIVE"
                    checked={selectedRelationType === 'RELATIVE'}
                    onChange={() => setSelectedRelationType('RELATIVE')}
                    className="text-forest-600"
                  />
                  <span>Relative (computes common ancestor)</span>
                </label>
                <label className="flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="relationType"
                    value="FRIEND"
                    checked={selectedRelationType === 'FRIEND'}
                    onChange={() => setSelectedRelationType('FRIEND')}
                    className="text-forest-600"
                  />
                  <span>Research Peer / Friend</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={sending || !selectedUserToConnect}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{sending ? 'Sending...' : 'Send Connection Request'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

