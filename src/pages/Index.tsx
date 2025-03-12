import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import HomeScreen from '@/components/HomeScreen';
import PhotoViewer from '@/components/PhotoViewer';
import GameMap from '@/components/GameMap';
import YearSlider from '@/components/YearSlider';
import GameHeader from '@/components/GameHeader';
import RoundResultComponent from '@/components/RoundResult';
import GameResults from '@/components/GameResults';
import SettingsDialog from '@/components/SettingsDialog';
import Timer from '@/components/Timer';
import { sampleEvents } from '@/data/sampleEvents';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  GameSettings, 
  GameState, 
  PlayerGuess, 
  HistoricalEvent,
  RoundResult 
} from '@/types/game';
import { 
  calculateRoundResult, 
  shuffleArray 
} from '@/utils/gameUtils';

const Index = () => {
  const { toast } = useToast();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmHomeOpen, setConfirmHomeOpen] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    settings: {
      distanceUnit: 'km',
      timerEnabled: false,
      timerDuration: 5,
      gameMode: 'daily'
    },
    events: [],
    currentRound: 1,
    totalRounds: 5,
    roundResults: [],
    gameStatus: 'not-started',
    currentGuess: null
  });

  const startGame = (settings: GameSettings) => {
    const shuffledEvents = shuffleArray(sampleEvents).slice(0, 5);
    
    setGameState({
      settings,
      events: shuffledEvents,
      currentRound: 1,
      totalRounds: 5,
      roundResults: [],
      gameStatus: 'in-progress',
      currentGuess: {
        location: null,
        year: 1962 // Default year is now 1962
      },
      timerStartTime: settings.timerEnabled ? Date.now() : undefined,
      timerRemaining: settings.timerEnabled ? settings.timerDuration * 60 : undefined
    });
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    console.log("Location selected:", lat, lng);
    setGameState(prev => ({
      ...prev,
      currentGuess: {
        ...(prev.currentGuess || { year: 1962 }),
        location: { lat, lng }
      }
    }));
  };

  const handleYearSelect = (year: number) => {
    console.log("Year selected:", year);
    setGameState(prev => ({
      ...prev,
      currentGuess: {
        ...(prev.currentGuess || { location: null }),
        year
      }
    }));
  };

  const handleTimeUp = () => {
    console.log("Timer expired, submitting current guess");
    const currentEvent = gameState.events[gameState.currentRound - 1];
    const currentGuess = gameState.currentGuess || { location: null, year: 1962 };
    
    let result: RoundResult;
    
    if (currentGuess.location) {
      result = calculateRoundResult(currentEvent, currentGuess);
    } else {
      const yearError = Math.abs(currentEvent.year - currentGuess.year);
      result = {
        event: currentEvent,
        guess: currentGuess,
        distanceError: Infinity,
        yearError,
        locationScore: 0,
        timeScore: Math.max(0, Math.round(5000 - Math.min(5000, 400 * Math.pow(yearError, 0.9)))),
        totalScore: 0
      };
      result.totalScore = result.locationScore + result.timeScore;
    }

    setGameState(prev => ({
      ...prev,
      roundResults: [...prev.roundResults, result],
      gameStatus: 'round-result'
    }));

    toast({
      title: "Time's up!",
      description: "Your guess has been submitted automatically.",
    });
  };

  const submitGuess = () => {
    console.log("Submitting guess:", gameState.currentGuess);
    if (!gameState.currentGuess) {
      toast({
        title: "Missing guess",
        description: "Please select both a location and a year.",
        variant: "destructive"
      });
      return;
    }

    if (!gameState.currentGuess.location) {
      toast({
        title: "No location selected",
        description: "You'll only receive points for your year guess.",
      });
      
      const currentEvent = gameState.events[gameState.currentRound - 1];
      const yearError = Math.abs(currentEvent.year - gameState.currentGuess.year);
      const timeScore = Math.max(0, Math.round(5000 - Math.min(5000, 400 * Math.pow(yearError, 0.9))));
      
      const result: RoundResult = {
        event: currentEvent,
        guess: gameState.currentGuess,
        distanceError: Infinity,
        yearError,
        locationScore: 0,
        timeScore,
        totalScore: timeScore
      };

      setGameState(prev => ({
        ...prev,
        roundResults: [...prev.roundResults, result],
        gameStatus: 'round-result'
      }));
      
      return;
    }

    const currentEvent = gameState.events[gameState.currentRound - 1];
    const result = calculateRoundResult(currentEvent, gameState.currentGuess);

    setGameState(prev => ({
      ...prev,
      roundResults: [...prev.roundResults, result],
      gameStatus: 'round-result'
    }));
  };

  const handleNextRound = () => {
    if (gameState.currentRound === gameState.totalRounds) {
      setGameState(prev => ({
        ...prev,
        gameStatus: 'game-over'
      }));
    } else {
      setGameState(prev => ({
        ...prev,
        currentRound: prev.currentRound + 1,
        gameStatus: 'in-progress',
        currentGuess: {
          location: null,
          year: 1962
        },
        timerStartTime: prev.settings.timerEnabled ? Date.now() : undefined,
        timerRemaining: prev.settings.timerEnabled ? prev.settings.timerDuration * 60 : undefined
      }));
    }
  };

  const handleGoHome = () => {
    setConfirmHomeOpen(true);
  };

  const confirmGoHome = () => {
    setGameState(prev => ({
      ...prev,
      gameStatus: 'not-started'
    }));
    setConfirmHomeOpen(false);
  };

  const handleRestart = () => {
    startGame(gameState.settings);
  };

  const handleReturnHome = () => {
    setGameState(prev => ({
      ...prev,
      gameStatus: 'not-started'
    }));
  };

  const calculateCumulativeScore = () => {
    return gameState.roundResults.reduce((sum, result) => sum + result.totalScore, 0);
  };

  const handleSettingsChange = (newSettings: GameSettings) => {
    setGameState(prev => ({
      ...prev,
      settings: newSettings,
      timerRemaining: newSettings.timerEnabled 
        ? newSettings.timerDuration * 60 
        : undefined
    }));
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        toast({
          title: "Link copied!",
          description: "Share this link with friends to challenge them.",
        });
      })
      .catch(err => {
        toast({
          title: "Failed to copy link",
          description: "Please try again or share the URL manually.",
          variant: "destructive",
        });
      });
  };

  const renderGameView = () => {
    switch (gameState.gameStatus) {
      case 'not-started':
        return <HomeScreen onStartGame={startGame} />;
      
      case 'in-progress':
        const currentEvent = gameState.events[gameState.currentRound - 1];
        return (
          <div className="container mx-auto p-4 min-h-screen bg-[#f3f3f3]">
            <div className="fixed top-0 left-0 right-0 z-10 bg-white shadow-sm">
              <div className="container mx-auto p-4">
                <GameHeader 
                  currentRound={gameState.currentRound} 
                  totalRounds={gameState.totalRounds}
                  cumulativeScore={calculateCumulativeScore()}
                  onShare={handleShare}
                  onSettingsClick={() => setSettingsOpen(true)}
                  onHomeClick={handleGoHome}
                />
              </div>
            </div>
            
            <div className="pt-20">
              {gameState.settings.timerEnabled && (
                <div className="mb-4">
                  <Timer 
                    durationMinutes={gameState.settings.timerDuration}
                    onTimeUp={handleTimeUp}
                    isActive={gameState.gameStatus === 'in-progress'}
                    remainingSeconds={gameState.timerRemaining}
                  />
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="h-96">
                  <PhotoViewer src={currentEvent.imageUrl} alt={currentEvent.description} />
                </div>
                <div className="h-96">
                  <GameMap 
                    onLocationSelect={handleLocationSelect} 
                    selectedLocation={gameState.currentGuess?.location}
                  />
                </div>
              </div>
              
              <div className="flex flex-col justify-between items-center gap-6 mb-6">
                <div className="w-full">
                  <YearSlider 
                    value={gameState.currentGuess?.year || 1962}
                    onChange={handleYearSelect}
                    minYear={1900}
                    maxYear={new Date().getFullYear()}
                  />
                </div>
                <Button 
                  size="lg"
                  onClick={submitGuess}
                  disabled={!gameState.currentGuess?.year}
                  className="w-full md:w-auto"
                >
                  Submit Guess
                </Button>
              </div>
            </div>
          </div>
        );
      
      case 'round-result':
        const lastResult = gameState.roundResults[gameState.roundResults.length - 1];
        return (
          <div className="container mx-auto p-4 min-h-screen bg-[#f3f3f3]">
            <RoundResultComponent 
              result={lastResult} 
              onNextRound={handleNextRound} 
              distanceUnit={gameState.settings.distanceUnit}
              isLastRound={gameState.currentRound === gameState.totalRounds}
              userAvatar={gameState.userAvatar}
            />
          </div>
        );
      
      case 'game-over':
        return (
          <div className="container mx-auto p-4 min-h-screen bg-[#f3f3f3]">
            <GameResults 
              results={gameState.roundResults} 
              onRestart={handleRestart}
              onHome={handleReturnHome}
            />
          </div>
        );
      
      default:
        return <div>Loading...</div>;
    }
  };

  return (
    <>
      {renderGameView()}
      
      <SettingsDialog 
        open={settingsOpen}
        settings={gameState.settings}
        onOpenChange={setSettingsOpen}
        onSettingsChange={handleSettingsChange}
      />

      <AlertDialog open={confirmHomeOpen} onOpenChange={setConfirmHomeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Return to Home Screen?</AlertDialogTitle>
            <AlertDialogDescription>
              Your current game will be canceled and your progress will be lost. 
              Are you sure you want to go back to the home screen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmGoHome}>
              Yes, go to Home
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Index;
