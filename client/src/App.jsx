import React, { useState } from 'react';
import Navbar from './components/Navbar';
import TabsNav from './components/TabsNav';
import CameraTab from './components/tabs/CameraTab';
import DuelTab from './components/tabs/DuelTab';
import PlanTab from './components/tabs/PlanTab';
import RankingTab from './components/tabs/RankingTab';
import GuideTab from './components/tabs/GuideTab';

export default function App() {
  const [activeTab, setActiveTab] = useState('camera-tab');
  const [userXP, setUserXP] = useState(1450);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleAddXP = (amount) => {
    setUserXP((prev) => prev + amount);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070b12] text-slate-100">
      {/* Top Header */}
      <Navbar
        userXP={userXP}
        soundEnabled={soundEnabled}
        onToggleSound={setSoundEnabled}
        onLogoClick={() => setActiveTab('camera-tab')}
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
            userXP={userXP}
            onAddXP={handleAddXP}
            soundEnabled={soundEnabled}
          />
        )}

        {activeTab === 'plan-tab' && <PlanTab />}

        {activeTab === 'ranking-tab' && <RankingTab />}

        {activeTab === 'guide-tab' && <GuideTab />}
      </main>
    </div>
  );
}
