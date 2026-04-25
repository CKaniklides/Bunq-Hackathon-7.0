import { useState } from 'react';
import { Screen, AnalyzedEvidence, RecommendationResult, DisputeSetup } from './types';
import Layout from './components/Layout';
import ApiKeyPrompt from './components/ApiKeyPrompt';
import LandingScreen from './components/screens/LandingScreen';
import SetupScreen from './components/screens/SetupScreen';
import EvidenceScreen from './components/screens/EvidenceScreen';
import TimelineScreen from './components/screens/TimelineScreen';
import CostModelScreen from './components/screens/CostModelScreen';
import RecommendationScreen from './components/screens/RecommendationScreen';
import ChallengeScreen from './components/screens/ChallengeScreen';
import PaymentScreen from './components/screens/PaymentScreen';
import PitchScreen from './components/screens/PitchScreen';

const API_KEY_REQUIRED: Screen[] = ['evidence', 'recommendation', 'challenge'];

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [apiKey, setApiKey] = useState<string>(() =>
    (import.meta.env.VITE_ANTHROPIC_API_KEY as string) ||
    sessionStorage.getItem('fairsplit_key') ||
    ''
  );
  const [disputeSetup, setDisputeSetup] = useState<DisputeSetup | null>(null);
  const [analyzedEvidence, setAnalyzedEvidence] = useState<AnalyzedEvidence[]>([]);
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [isGeneratingRecommendation, setIsGeneratingRecommendation] = useState(false);

  const navigate = (s: Screen) => {
    setScreen(s);
    window.scrollTo(0, 0);
  };

  const handleSetApiKey = (key: string) => {
    sessionStorage.setItem('fairsplit_key', key);
    setApiKey(key);
  };

  const handleSetupComplete = (setup: DisputeSetup) => {
    setDisputeSetup(setup);
    setRecommendation(null);
    setAnalyzedEvidence([]);
    navigate('evidence');
  };

  const handleEvidenceAdd = (ev: AnalyzedEvidence) => {
    setAnalyzedEvidence(prev => {
      const idx = prev.findIndex(e => e.id === ev.id);
      if (idx !== -1) return prev.map(e => e.id === ev.id ? ev : e);
      return [...prev, ev];
    });
  };

  const reset = () => {
    setScreen('landing');
    setDisputeSetup(null);
    setAnalyzedEvidence([]);
    setRecommendation(null);
    setIsGeneratingRecommendation(false);
  };

  if (!apiKey && API_KEY_REQUIRED.includes(screen)) {
    return <ApiKeyPrompt onSetKey={handleSetApiKey} onBack={() => navigate('setup')} />;
  }

  const renderScreen = () => {
    switch (screen) {
      case 'landing':
        return <LandingScreen onNavigate={navigate} />;
      case 'setup':
        return <SetupScreen onSetupComplete={handleSetupComplete} onNavigate={navigate} />;
      case 'evidence':
        return disputeSetup ? (
          <EvidenceScreen
            setup={disputeSetup}
            onNavigate={navigate}
            apiKey={apiKey}
            analyzedEvidence={analyzedEvidence}
            onEvidenceAdd={handleEvidenceAdd}
          />
        ) : null;
      case 'timeline':
        return disputeSetup ? (
          <TimelineScreen
            setup={disputeSetup}
            onNavigate={navigate}
            analyzedEvidence={analyzedEvidence}
          />
        ) : null;
      case 'costmodel':
        return disputeSetup ? (
          <CostModelScreen onNavigate={navigate} recommendation={recommendation} setup={disputeSetup} />
        ) : null;
      case 'recommendation':
        return disputeSetup ? (
          <RecommendationScreen
            setup={disputeSetup}
            onNavigate={navigate}
            apiKey={apiKey}
            analyzedEvidence={analyzedEvidence}
            recommendation={recommendation}
            onRecommendationGenerated={setRecommendation}
            isGenerating={isGeneratingRecommendation}
            onSetGenerating={setIsGeneratingRecommendation}
          />
        ) : null;
      case 'challenge':
        return disputeSetup ? (
          <ChallengeScreen
            setup={disputeSetup}
            onNavigate={navigate}
            apiKey={apiKey}
            recommendation={recommendation}
            analyzedEvidence={analyzedEvidence}
          />
        ) : null;
      case 'payment':
        return disputeSetup ? (
          <PaymentScreen
            setup={disputeSetup}
            onNavigate={navigate}
            recommendation={recommendation}
          />
        ) : null;
      case 'pitch':
        return disputeSetup ? (
          <PitchScreen
            setup={disputeSetup}
            recommendation={recommendation}
            onNavigate={navigate}
            analyzedEvidence={analyzedEvidence}
            onReset={reset}
          />
        ) : null;
      default:
        return null;
    }
  };

  if (screen === 'landing') {
    return <>{renderScreen()}</>;
  }

  return (
    <Layout currentScreen={screen} onNavigate={navigate} setup={disputeSetup}>
      {renderScreen()}
    </Layout>
  );
}
