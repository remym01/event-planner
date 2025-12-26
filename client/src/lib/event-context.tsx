import React, { createContext, useContext, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { EventConfig, Item, Rsvp } from '@shared/schema';

// --- Types ---

export type RSVP = Rsvp & { itemId?: number | null };

type EventContextType = {
  config: EventConfig | undefined;
  updateConfig: (newConfig: Partial<EventConfig>) => Promise<void>;
  
  items: Item[];
  addItem: (name: string) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  claimItem: (itemId: number, userName: string) => Promise<void>;
  unclaimItem: (itemId: number) => Promise<void>;
  
  rsvps: Rsvp[];
  addRSVP: (rsvp: Omit<Rsvp, 'id' | 'createdAt'>) => Promise<void>;
  
  // "Session" state for the current user filling the form
  currentUser: Rsvp | null;
  setCurrentUser: (user: Rsvp | null) => void;
  
  // Admin helpers
  resetSession: () => void;
  
  // Loading states
  isLoading: boolean;
};

// --- Context ---

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<Rsvp | null>(null);

  // Fetch event config
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const res = await fetch('/api/config');
      if (!res.ok) throw new Error('Failed to fetch config');
      return res.json() as Promise<EventConfig>;
    },
  });

  // Fetch items
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const res = await fetch('/api/items');
      if (!res.ok) throw new Error('Failed to fetch items');
      return res.json() as Promise<Item[]>;
    },
  });

  // Fetch RSVPs
  const { data: rsvps = [], isLoading: rsvpsLoading } = useQuery({
    queryKey: ['rsvps'],
    queryFn: async () => {
      const res = await fetch('/api/rsvps');
      if (!res.ok) throw new Error('Failed to fetch RSVPs');
      return res.json() as Promise<Rsvp[]>;
    },
  });

  // Update config mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (newConfig: Partial<EventConfig>) => {
      const res = await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      if (!res.ok) throw new Error('Failed to update config');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
    },
  });

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, assignee: null }),
      });
      if (!res.ok) throw new Error('Failed to add item');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove item');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  // Update item assignee mutation
  const updateItemAssigneeMutation = useMutation({
    mutationFn: async ({ id, assignee }: { id: number; assignee: string | null }) => {
      const res = await fetch(`/api/items/${id}/assignee`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignee }),
      });
      if (!res.ok) throw new Error('Failed to update item');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  // Add RSVP mutation
  const addRSVPMutation = useMutation({
    mutationFn: async (rsvp: Omit<Rsvp, 'id' | 'createdAt'>) => {
      const res = await fetch('/api/rsvps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rsvp),
      });
      if (!res.ok) throw new Error('Failed to add RSVP');
      return res.json() as Promise<Rsvp>;
    },
    onSuccess: (newRsvp) => {
      queryClient.invalidateQueries({ queryKey: ['rsvps'] });
      setCurrentUser(newRsvp);
    },
  });

  // Actions
  const updateConfig = async (newConfig: Partial<EventConfig>) => {
    await updateConfigMutation.mutateAsync(newConfig);
  };

  const addItem = async (name: string) => {
    await addItemMutation.mutateAsync(name);
  };

  const removeItem = async (id: number) => {
    await removeItemMutation.mutateAsync(id);
  };

  const claimItem = async (itemId: number, userName: string) => {
    await updateItemAssigneeMutation.mutateAsync({ id: itemId, assignee: userName });
  };

  const unclaimItem = async (itemId: number) => {
    await updateItemAssigneeMutation.mutateAsync({ id: itemId, assignee: null });
  };

  const addRSVP = async (newRSVP: Omit<Rsvp, 'id' | 'createdAt'>) => {
    const rsvp = await addRSVPMutation.mutateAsync(newRSVP);
    
    // If they selected an item, claim it
    if (newRSVP.itemId) {
      await claimItem(newRSVP.itemId, newRSVP.firstName);
    }
  };

  const resetSession = () => {
    setCurrentUser(null);
  };

  const isLoading = configLoading || itemsLoading || rsvpsLoading;

  return (
    <EventContext.Provider value={{
      config,
      updateConfig,
      items,
      addItem,
      removeItem,
      claimItem,
      unclaimItem,
      rsvps,
      addRSVP,
      currentUser,
      setCurrentUser,
      resetSession,
      isLoading,
    }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvent() {
  const context = useContext(EventContext);
  if (!context) throw new Error("useEvent must be used within an EventProvider");
  return context;
}

export type { EventConfig, Item };
