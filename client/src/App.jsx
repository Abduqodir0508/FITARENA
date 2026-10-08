import React, { useState, useEffect } from 'react';
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

  // Load user profile from localStorage or initialize as null to prompt registration
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('fitarena_user_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Storage parse error:", e);
    }
    return null;
  });

  const [userXP, setUserXP] = useState(() => {
    return currentUser?.xp || 1450;
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

  // Save profile changes to localStorage
  const handleSaveUser = (userData) => {
    setCurrentUser(userData);
    setUserXP(userData.xp || 1450);
    try {
      localStorage.setItem('fitarena_user_profile', JSON.stringify(userData));
    } catch (e) {
      console.warn("Storage save error:", e);
    }
    setIsAuthModalOpen(false);
  };

  const handleAddXP = (amount) => {
    setUserXP((prev) => {
      const nextXP = prev + amount;
      if (currentUser) {
        const updated = {
          ...currentUser,
          xp: nextXP,
          totalReps: (currentUser.totalReps || 0) + 1,
        };
        setCurrentUser(updated);
        try {
          localStorage.setItem('fitarena_user_profile', JSON.stringify(updated));
        } catch (e) {}
      }
      return nextXP;
    });
  };

  const handleDuelFinished = (won, finalScore) => {
    if (currentUser) {
      const updated = {
        ...currentUser,
        duelsTotal: (currentUser.duelsTotal || 0) + 1,
        duelsWon: (currentUser.duelsWon || 0) + (won ? 1 : 0),
        totalReps: (currentUser.totalReps || 0) + finalScore,
      };
      setCurrentUser(updated);
      try {
        localStorage.setItem('fitarena_user_profile', JSON.stringify(updated));
      } catch (e) {}
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070b12] text-slate-100">
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
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-5">
        {activeTab === 'camera-tab' && (
          <CameraTab
            userXP={userXP}
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
          <RankingTab currentUser={currentUser} />
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
