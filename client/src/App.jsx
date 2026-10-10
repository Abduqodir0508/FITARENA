import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import TabsNav from './components/TabsNav';
import CameraTab from './components/tabs/CameraTab';
import DuelTab from './components/tabs/DuelTab';
import PlanTab from './components/tabs/PlanTab';
import RankingTab from './components/tabs/RankingTab';
import GuideTab from './components/tabs/GuideTab';
import AuthModal from './components/modals/AuthModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('camera-tab');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Load user profile from localStorage; default is null (prompts registration)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('fitarena_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          xp: parsed.xp !== undefined ? Number(parsed.xp) : 0,
          level: Math.floor((Number(parsed.xp) || 0) / 100),
        };
      }
    } catch (e) {
      console.warn("Storage parse error:", e);
    }
    return null;
  });

  // Strict initial XP: exactly 0 if new or not set
  const [userXP, setUserXP] = useState(() => {
    return currentUser?.xp !== undefined ? Number(currentUser.xp) : 0;
  });

  // Prompt registration modal if user is not registered yet
  useEffect(() => {
    if (!currentUser) {
      const timer = setTimeout(() => {
        setIsAuthModalOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  // Sync user profile to backend DB
  const syncUserToBackend = async (userData) => {
    try {
      await fetch('/api/rankings/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
    } catch (err) {
      // Backend may be offline or in standalone mode, safe fallback
      console.warn("Backend user sync notice:", err.message);
    }
  };

  // Save profile changes (Sign up or Edit)
  const handleSaveUser = (userData) => {
    const cleanXP = userData.xp !== undefined ? Number(userData.xp) : 0;
    const cleanUser = {
      ...userData,
      xp: cleanXP,
      level: Math.floor(cleanXP / 100),
      totalReps: Number(userData.totalReps || 0),
      duelsWon: Number(userData.duelsWon || 0),
      duelsTotal: Number(userData.duelsTotal || 0),
    };

    setCurrentUser(cleanUser);
    setUserXP(cleanXP);

    try {
      localStorage.setItem('fitarena_user_profile', JSON.stringify(cleanUser));
    } catch (e) {
      console.warn("Storage save error:", e);
    }

    // Persist to backend DB
    syncUserToBackend(cleanUser);
    setIsAuthModalOpen(false);
  };

  // Add EXP directly to user profile and top panel in real-time
  const handleAddXP = useCallback((amount, repsDelta = 0, duelWon = null) => {
    const numAmount = Number(amount) || 0;
    if (numAmount <= 0 && repsDelta <= 0) return;

    setUserXP((prev) => {
      const nextXP = prev + numAmount;

      setCurrentUser((prevUser) => {
        if (!prevUser) return null;
        const updated = {
          ...prevUser,
          xp: nextXP,
          level: Math.floor(nextXP / 100),
          totalReps: (prevUser.totalReps || 0) + (repsDelta || 0),
        };
        if (duelWon !== null) {
          updated.duelsTotal = (prevUser.duelsTotal || 0) + 1;
          if (duelWon) {
            updated.duelsWon = (prevUser.duelsWon || 0) + 1;
          }
        }

        try {
          localStorage.setItem('fitarena_user_profile', JSON.stringify(updated));
        } catch (e) {}

        // Sync with backend API
        fetch('/api/rankings/add-exp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: prevUser.id,
            amount: numAmount,
            repsDelta,
            duelWon,
          }),
        }).catch(() => {});

        return updated;
      });

      return nextXP;
    });
  }, []);

  const handleDuelFinished = (won, finalScore) => {
    if (currentUser) {
      const updated = {
        ...currentUser,
        duelsTotal: (currentUser.duelsTotal || 0) + 1,
        duelsWon: (currentUser.duelsWon || 0) + (won ? 1 : 0),
        totalReps: (currentUser.totalReps || 0) + (finalScore || 0),
      };
      setCurrentUser(updated);
      try {
        localStorage.setItem('fitarena_user_profile', JSON.stringify(updated));
      } catch (e) {}
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070b12] text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Header */}
      <Navbar
        currentUser={currentUser}
        userXP={userXP}
        soundEnabled={soundEnabled}
        onToggleSound={setSoundEnabled}
        onLogoClick={() => setActiveTab('camera-tab')}
        onOpenProfile={() => setIsAuthModalOpen(true)}
      />

      {/* Navigation Bar */}
      <TabsNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-2.5 sm:p-5">
        {activeTab === 'camera-tab' && (
          <CameraTab
            userXP={userXP}
            currentUser={currentUser}
            onAddXP={handleAddXP}
            soundEnabled={soundEnabled}
          />
        )}

        {activeTab === 'duel-tab' && (
          <DuelTab
            currentUser={currentUser}
            userXP={userXP}
            onAddXP={handleAddXP}
            soundEnabled={soundEnabled}
            onDuelFinished={handleDuelFinished}
          />
        )}

        {activeTab === 'plan-tab' && <PlanTab />}

        {activeTab === 'ranking-tab' && (
          <RankingTab currentUser={currentUser} userXP={userXP} />
        )}

        {activeTab === 'guide-tab' && <GuideTab />}
      </main>

      {/* Registration & Profile Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={currentUser ? () => setIsAuthModalOpen(false) : null}
        onRegister={handleSaveUser}
        initialUser={currentUser}
        soundEnabled={soundEnabled}
      />
    </div>
  );
}
