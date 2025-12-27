import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Gift, Loader2, Check, PartyPopper, Sparkles } from 'lucide-react';
import type { SecretSantaParticipant, EventConfig } from '@shared/schema';

interface SecretSantaSectionProps {
  userName: string;
  config: EventConfig;
}

export function SecretSantaSection({ userName, config }: SecretSantaSectionProps) {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState('');
  const [checkName, setCheckName] = useState('');
  const [showMatchCheck, setShowMatchCheck] = useState(false);

  const { data: participants = [] } = useQuery({
    queryKey: ['secret-santa-participants'],
    queryFn: async () => {
      const res = await fetch('/api/secret-santa/participants');
      if (!res.ok) throw new Error('Failed to fetch participants');
      return res.json() as Promise<SecretSantaParticipant[]>;
    },
    staleTime: 10000,
  });

  const myParticipation = participants.find(p => p.name.toLowerCase() === userName.toLowerCase());
  
  const { data: matchData, refetch: refetchMatch } = useQuery({
    queryKey: ['secret-santa-match', checkName],
    queryFn: async () => {
      if (!checkName) return null;
      const res = await fetch(`/api/secret-santa/my-match/${encodeURIComponent(checkName)}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!checkName && showMatchCheck,
    staleTime: 5000,
  });

  const joinMutation = useMutation({
    mutationFn: async (data: { name: string; preferences: string }) => {
      const res = await fetch('/api/secret-santa/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to join');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secret-santa-participants'] });
      setPreferences('');
    },
  });

  if (!config.secretSantaEnabled) {
    return null;
  }

  const giftLimit = config.secretSantaGiftLimit || 20;
  const drawCompleted = config.secretSantaDrawCompleted;

  return (
    <Card className="w-full max-w-md mx-auto mt-6 border-none shadow-soft bg-white/95 backdrop-blur-sm overflow-hidden">
      <CardHeader className="text-center pb-4 bg-gradient-to-b from-red-50/50 to-transparent">
        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-2">
          <Gift className="w-6 h-6 text-red-600" />
        </div>
        <CardTitle className="text-2xl font-serif text-red-700">Secret Santa</CardTitle>
        <CardDescription>
          Join the gift exchange! Budget: <strong>${giftLimit}</strong>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!myParticipation && !drawCompleted && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Share what you like so your Secret Santa knows what to get you!
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="preferences" className="text-sm font-medium">
                What do you like? (Hobbies, favorite things, colors, etc.)
              </Label>
              <Textarea
                id="preferences"
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder="I love reading, especially mysteries. My favorite color is blue. I collect vintage postcards..."
                className="min-h-[80px] resize-none"
                data-testid="input-preferences"
              />
            </div>

            <Button
              onClick={() => joinMutation.mutate({ name: userName, preferences })}
              disabled={joinMutation.isPending || !preferences.trim()}
              className="w-full bg-red-600 hover:bg-red-700"
              data-testid="button-join-santa"
            >
              {joinMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Gift className="w-4 h-4 mr-2" />
              )}
              Join Secret Santa
            </Button>

            {joinMutation.isError && (
              <p className="text-sm text-destructive text-center">
                {(joinMutation.error as Error).message}
              </p>
            )}
          </div>
        )}

        {myParticipation && !drawCompleted && (
          <div className="text-center py-4 space-y-3">
            <div className="mx-auto w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <p className="font-medium text-green-700">You're in the draw!</p>
            <p className="text-sm text-muted-foreground">
              Waiting for the host to complete the draw. Check back later to see who you got!
            </p>
            <p className="text-xs text-muted-foreground italic">
              {participants.length} participant{participants.length !== 1 ? 's' : ''} so far
            </p>
          </div>
        )}

        {drawCompleted && (
          <div className="space-y-4">
            <div className="text-center py-2">
              <div className="mx-auto w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mb-2">
                <PartyPopper className="w-5 h-5 text-amber-600" />
              </div>
              <p className="font-medium text-amber-700">The draw is complete!</p>
            </div>

            {!showMatchCheck ? (
              <Button
                onClick={() => setShowMatchCheck(true)}
                variant="outline"
                className="w-full border-red-200 text-red-700 hover:bg-red-50"
                data-testid="button-check-match"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                See Who I Got
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="checkName" className="text-sm font-medium">
                    Enter your name to reveal your match:
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="checkName"
                      value={checkName}
                      onChange={(e) => setCheckName(e.target.value)}
                      placeholder="Your name"
                      data-testid="input-check-name"
                    />
                    <Button
                      onClick={() => refetchMatch()}
                      disabled={!checkName.trim()}
                      className="bg-red-600 hover:bg-red-700"
                      data-testid="button-reveal-match"
                    >
                      Reveal
                    </Button>
                  </div>
                </div>

                {matchData?.matched && matchData.match && (
                  <div className="bg-gradient-to-br from-red-50 to-green-50 p-4 rounded-lg border border-red-100 text-center space-y-2">
                    <p className="text-sm text-muted-foreground">You are buying a gift for:</p>
                    <p className="text-xl font-serif font-semibold text-red-700" data-testid="text-match-name">
                      {matchData.match.name}
                    </p>
                    <div className="text-left bg-white/60 p-3 rounded-md mt-2">
                      <p className="text-xs font-medium text-muted-foreground mb-1">They like:</p>
                      <p className="text-sm text-foreground" data-testid="text-match-preferences">
                        {matchData.match.preferences}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground pt-2">
                      Budget: <strong>${giftLimit}</strong>
                    </p>
                  </div>
                )}

                {matchData?.matched === false && (
                  <p className="text-sm text-muted-foreground text-center">
                    {matchData.message || "You're not in the draw or the draw hasn't happened yet."}
                  </p>
                )}

                {checkName && matchData === null && (
                  <p className="text-sm text-muted-foreground text-center">
                    Name not found. Make sure you entered the same name you used to join.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
