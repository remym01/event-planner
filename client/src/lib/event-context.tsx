import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { EventConfig, Item, Rsvp } from '@shared/schema';

// --- Types ---

export type RSVP = Rsvp & { itemId?: number | null };

type EventContextType = {
  config: EventConfig | undefined;
  updateConfig: (newConfig: Partial<EventConfig>) => void;
  
  items: Item[];
  addItem: (name: string) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  claimItem: (itemId: number, userName: string) => Promise<void>;
  unclaimItem: (itemId: number) => Promise<void>;
  
  rsvps: Rsvp[];
  addRSVP: (rsvp: Omit<Rsvp, 'id' | 'createdAt'>) => Promise<void>;
  
  currentUser: Rsvp | null;
  setCurrentUser: (user: Rsvp | null) => void;
  
  resetSession: () => void;
  isLoading: boolean;
};

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<Rsvp | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const pendingConfigRef = useRef<Partial<EventConfig>>({});

  // Fetch event config with caching
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const res = await fetch('/api/config');
      if (!res.ok) throw new Error('Failed to fetch config');
      return res.json() as Promise<EventConfig>;
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  // Fetch items with caching
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const res = await fetch('/api/items');
      if (!res.ok) throw new Error('Failed to fetch items');
      return res.json() as Promise<Item[]>;
    },
    staleTime: 10000,
    refetchOnWindowFocus: false,
  });

  // Fetch RSVPs with caching
  const { data: rsvps = [], isLoading: rsvpsLoading } = useQuery({
    queryKey: ['rsvps'],
    queryFn: async () => {
      const res = await fetch('/api/rsvps');
      if (!res.ok) throw new Error('Failed to fetch RSVPs');
      return res.json() as Promise<Rsvp[]>;
    },
    staleTime: 10000,
    refetchOnWindowFocus: false,
  });

  // Update config mutation with optimistic updates
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
    onMutate: async (newConfig) => {
      await queryClient.cancelQueries({ queryKey: ['config'] });
      const previousConfig = queryClient.getQueryData(['config']);
      queryClient.setQueryData(['config'], (old: EventConfig | undefined) => 
        old ? { ...old, ...newConfig } : old
      );
      return { previousConfig };
    },
    onError: (_err, _newConfig, context) => {
      if (context?.previousConfig) {
        queryClient.setQueryData(['config'], context.previousConfig);
      }
    },
  });

  // Debounced config update
  const updateConfig = useCallback((newConfig: Partial<EventConfig>) => {
    pendingConfigRef.current = { ...pendingConfigRef.current, ...newConfig };
    
    // Immediately update the UI optimistically
    queryClient.setQueryData(['config'], (old: EventConfig | undefined) => 
      old ? { ...old, ...newConfig } : old
    );
    
    // Debounce the actual API call
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      const configToSave = { ...pendingConfigRef.current };
      pendingConfigRef.current = {};
      updateConfigMutation.mutate(configToSave);
    }, 500);
  }, [queryClient, updateConfigMutation]);

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
    onSuccess: (newItem) => {
      queryClient.setQueryData(['items'], (old: Item[] | undefined) => 
        old ? [...old, newItem] : [newItem]
      );
    },
  });

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove item');
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['items'] });
      const previousItems = queryClient.getQueryData(['items']);
      queryClient.setQueryData(['items'], (old: Item[] | undefined) => 
        old ? old.filter(item => item.id !== id) : []
      );
      return { previousItems };
    },
    onError: (_err, _id, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(['items'], context.previousItems);
      }
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
    onMutate: async ({ id, assignee }) => {
      await queryClient.cancelQueries({ queryKey: ['items'] });
      const previousItems = queryClient.getQueryData(['items']);
      queryClient.setQueryData(['items'], (old: Item[] | undefined) => 
        old ? old.map(item => item.id === id ? { ...item, assignee } : item) : []
      );
      return { previousItems };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(['items'], context.previousItems);
      }
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
      queryClient.setQueryData(['rsvps'], (old: Rsvp[] | undefined) => 
        old ? [...old, newRsvp] : [newRsvp]
      );
      setCurrentUser(newRsvp);
    },
  });

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
    await addRSVPMutation.mutateAsync(newRSVP);
    
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
