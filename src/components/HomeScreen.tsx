
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Map, Globe, Wand2, Trophy, RefreshCw } from 'lucide-react';
import { GameSettings } from '@/types/game';
import { sampleEvents } from '@/data/sampleEvents';
import { useAuth } from '@/contexts/AuthContext';
import DailyCompetitionButton from './DailyCompetitionButton';
import AuthPromptDialog from './AuthPromptDialog';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface HomeScreenProps {
  onStartGame: (settings: GameSettings) => void;
  isLoading?: boolean;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStartGame, isLoading = false }) => {
  const { user, profile } = useAuth();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [dailyScore, setDailyScore] = useState(0);
  const [localLoading, setLocalLoading] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (user) {
      // Check if user has completed today's daily competition
      checkDailyCompetition();
    }
  }, [user]);

  const checkDailyCompetition = async () => {
    try {
      // Implementation will be added in future when game results are stored
      setDailyCompleted(false);
      setDailyScore(0);
    } catch (error) {
      console.error("Error checking daily competition:", error);
    }
  };

  const handleStartGame = async (settings: GameSettings) => {
    if (settings.gameMode === 'daily' && !user) {
      setShowAuthPrompt(true);
      return;
    }
    
    setLocalLoading(true);
    try {
      await onStartGame(settings);
    } finally {
      setLocalLoading(false);
    }
  };

  // Use either the parent isLoading or local loading state
  const buttonLoading = isLoading || localLoading;

  return (
    <div className="container mx-auto p-4 min-h-screen flex flex-col justify-center items-center">
      <div className="w-full max-w-4xl mx-auto pb-8">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Time Trek</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="play" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="play" className="flex items-center gap-2">
                  <Map className="h-4 w-4" /> 
                  Play
                </TabsTrigger>
                <TabsTrigger value="compete" className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Compete
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="play">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="text-center">
                      <CardTitle className="text-xl flex items-center justify-center gap-2">
                        <Globe className="h-5 w-5" />
                        Classic Game
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        Play a standard game with 5 rounds.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={() => handleStartGame({
                          gameMode: 'classic',
                          distanceUnit: 'km',
                          timerEnabled: false,
                          timerDuration: 5
                        })} 
                        className="w-full"
                        disabled={buttonLoading}
                      >
                        {buttonLoading ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Start Game"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader className="text-center">
                      <CardTitle className="text-xl flex items-center justify-center gap-2">
                        <Wand2 className="h-5 w-5" />
                        Timed Challenge
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        Race against the clock with a time limit.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={() => handleStartGame({
                          gameMode: 'timed',
                          distanceUnit: 'km',
                          timerEnabled: true,
                          timerDuration: 5
                        })} 
                        className="w-full"
                        disabled={buttonLoading}
                      >
                        {buttonLoading ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Start Timed Game"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="compete">
                <div className="space-y-4">
                  <DailyCompetitionButton
                    dailyCompleted={dailyCompleted}
                    dailyScore={dailyScore}
                    user={user}
                    onStartGame={() => handleStartGame({
                      gameMode: 'daily',
                      distanceUnit: 'km',
                      timerEnabled: false,
                      timerDuration: 5
                    })}
                    isLoading={buttonLoading}
                  />
                  
                  <Card>
                    <CardHeader className="text-center">
                      <CardTitle className="text-xl">Friends Competition</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Challenge your friends with a custom game link.
                      </p>
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => handleStartGame({
                          gameMode: 'friends',
                          distanceUnit: 'km',
                          timerEnabled: false,
                          timerDuration: 5
                        })}
                        disabled={buttonLoading}
                      >
                        {buttonLoading ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Create Challenge"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <AuthPromptDialog 
        open={showAuthPrompt} 
        onOpenChange={setShowAuthPrompt} 
        source="daily-competition"
      />
    </div>
  );
};

export default HomeScreen;
