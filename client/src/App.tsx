import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext.js';
import { useSocket } from './context/SocketContext.js';
import { api } from './services/api.js';
import { Ancestor, AncestorMatchItem, UserConnectionItem, KinshipDetails } from './types/index.js';
import { Navbar } from './components/Navbar.js';
import { FamilyTreeCanvas } from './components/FamilyTreeCanvas.js';
import { AddAncestorModal } from './components/AddAncestorModal.js';
import { MatchNotificationBanner } from './components/MatchNotificationBanner.js';
import { MatchDetailsModal } from './components/MatchDetailsModal.js';
import { MatchesView } from './components/MatchesView.js';
import { ConnectionsView } from './components/ConnectionsView.js';
import { KinshipViewerModal } from './components/KinshipViewerModal.js';
import { AuthModal, AuthMode } from './components/AuthModal.js';
import { Info, Sparkles, ArrowRight, GitFork, UserPlus } from 'lucide-react';

export function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { notifications } = useSocket();

  const [activeTab, setActiveTab] = useState<'tree' | 'matches' | 'connections'>('tree');
  const [ancestors, setAncestors] = useState<Ancestor[]>([]);
  const [matches, setMatches] = useState<AncestorMatchItem[]>([]);
  const [connections, setConnections] = useState<UserConnectionItem[]>([]);
  const [allUsers, setAllUsers] = useState<Array<{ id: string; name: string; email: string; bio: string; originPlaces?: string[] }>>([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAncestor, setEditingAncestor] = useState<Ancestor | null>(null);
  const [initialParent, setInitialParent] = useState<Ancestor | null>(null);

  const [selectedMatch, setSelectedMatch] = useState<AncestorMatchItem | null>(null);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);

  const [kinshipData, setKinshipData] = useState<KinshipDetails | null>(null);
  const [kinshipOtherUserName, setKinshipOtherUserName] = useState<string>('');
  const [isKinshipModalOpen, setIsKinshipModalOpen] = useState(false);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>('login');
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [highlightedAncestorId, setHighlightedAncestorId] = useState<string | null>(null);

  // Load user data
  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [ancs, mchs, conns, usrs] = await Promise.all([
        api.getMyAncestors().catch(() => []),
        api.getMatches().catch(() => []),
        api.getConnections().catch(() => []),
        api.getDemoUsers().catch(() => [])
      ]);
      setAncestors(ancs);
      setMatches(mchs);
      setConnections(conns);
      setAllUsers(usrs);
    } catch (err) {
      console.error('Failed to load user data:', err);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData, user]);

  // Re-fetch data on socket events
  useEffect(() => {
    if (notifications.length > 0) {
      loadData();
    }
  }, [notifications.length, loadData]);

  // Handle Ancestor actions
  const handleSaveAncestor = async (data: Partial<Ancestor>) => {
    if (editingAncestor) {
      await api.updateAncestor(editingAncestor.id, data);
    } else {
      await api.createAncestor(data);
    }
    await loadData();
    setEditingAncestor(null);
    setInitialParent(null);
  };

  const handleDeleteAncestor = async (id: string) => {
    if (!confirm('Are you sure you want to remove this ancestor node?')) return;
    await api.deleteAncestor(id);
    await loadData();
  };

  const handleEditAncestor = (ancestor: Ancestor) => {
    setEditingAncestor(ancestor);
    setInitialParent(null);
    setIsAddModalOpen(true);
  };

  const handleAddRelative = (parent: Ancestor) => {
    setEditingAncestor(null);
    setInitialParent(parent);
    setIsAddModalOpen(true);
  };

  // Handle Match actions
  const handleReviewMatch = (match: AncestorMatchItem) => {
    setSelectedMatch(match);
    setIsMatchModalOpen(true);
  };

  const handleAcceptMatch = async (matchId: string) => {
    await api.acceptMatch(matchId);
    await loadData();
  };

  const handleDismissMatch = async (matchId: string) => {
    await api.dismissMatch(matchId);
    await loadData();
  };

  const handleTriggerScan = async () => {
    await api.triggerScan();
    await loadData();
  };

  // Handle Connection & Kinship actions
  const handleRespondConnection = async (id: string, status: 'ACCEPTED' | 'REJECTED') => {
    await api.respondConnection(id, status);
    await loadData();
  };

  const handleInspectKinship = async (otherUserId: string, otherUserName: string) => {
    try {
      const details = await api.getKinship(otherUserId);
      setKinshipData(details);
      setKinshipOtherUserName(otherUserName);
      setIsKinshipModalOpen(true);
      if (details.commonAncestorId) {
        setHighlightedAncestorId(details.commonAncestorId);
      }
    } catch (e) {
      alert('Could not compute kinship path.');
    }
  };

  const handleSendConnectionRequest = async (receiverId: string, relationType: 'RELATIVE' | 'FRIEND') => {
    await api.sendConnectionRequest(receiverId, relationType);
    await loadData();
    alert('Connection request sent!');
  };

  const handleResetSeed = async () => {
    if (confirm('Reset database with demo genealogies for Eleanor Vance and Marcus Vance?')) {
      await api.resetSeed();
      await loadData();
    }
  };

  const openAuthWithMode = (mode: AuthMode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const pendingMatchesCount = matches.filter(m => m.status === 'PENDING').length;

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5]">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => {
          setEditingAncestor(null);
          setInitialParent(null);
          setIsAddModalOpen(true);
        }}
        matchesCount={pendingMatchesCount}
        onResetSeed={handleResetSeed}
        onOpenAuth={openAuthWithMode}
      />

      {/* Floating Match Alert Banner */}
      {!bannerDismissed && (
        <MatchNotificationBanner
          matches={matches}
          onReviewMatch={handleReviewMatch}
          onDismiss={() => setBannerDismissed(true)}
        />
      )}

      {/* Demo Walkthrough Guide Header */}
      <div className="bg-forest-900 text-forest-100 text-xs py-2 px-4 border-b border-forest-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center space-x-2 truncate">
            <Info className="w-3.5 h-3.5 text-forest-300 shrink-0" />
            <span className="truncate">
              <strong>Active Account:</strong> Signed in as <strong>{user?.name}</strong> ({user?.email}). Click <strong>"Create User"</strong> in the navbar to register a new account, or switch personas to test matching.
            </span>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => openAuthWithMode('register')}
              className="inline-flex items-center space-x-1 text-forest-200 hover:text-white underline font-semibold"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Create New User</span>
            </button>
            <span className="text-forest-700">|</span>
            <button
              onClick={() => {
                setActiveTab('matches');
              }}
              className="underline text-forest-200 hover:text-white"
            >
              Matches ({matches.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'tree' && (
          <FamilyTreeCanvas
            ancestors={ancestors}
            onEdit={handleEditAncestor}
            onDelete={handleDeleteAncestor}
            onAddRelative={handleAddRelative}
            onOpenAddModal={() => {
              setEditingAncestor(null);
              setInitialParent(null);
              setIsAddModalOpen(true);
            }}
            highlightedAncestorId={highlightedAncestorId}
          />
        )}

        {activeTab === 'matches' && (
          <MatchesView
            matches={matches}
            onReviewMatch={handleReviewMatch}
            onTriggerScan={handleTriggerScan}
          />
        )}

        {activeTab === 'connections' && (
          <ConnectionsView
            connections={connections}
            onRespond={handleRespondConnection}
            onInspectKinship={handleInspectKinship}
            onSendRequest={handleSendConnectionRequest}
            allUsers={allUsers}
            currentUserId={user?.id}
          />
        )}
      </main>

      {/* Modals */}
      <AddAncestorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveAncestor}
        existingAncestors={ancestors}
        editingAncestor={editingAncestor}
        initialParent={initialParent}
      />

      <MatchDetailsModal
        match={selectedMatch}
        isOpen={isMatchModalOpen}
        onClose={() => setIsMatchModalOpen(false)}
        onAccept={handleAcceptMatch}
        onDismiss={handleDismissMatch}
      />

      <KinshipViewerModal
        isOpen={isKinshipModalOpen}
        onClose={() => setIsKinshipModalOpen(false)}
        kinship={kinshipData}
        otherUserName={kinshipOtherUserName}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
