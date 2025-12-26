import React, { createContext, useContext, useState, useEffect } from 'react';
import { z } from 'zod';

// --- Types ---

export type Item = {
  id: string;
  name: string;
  assignee: string | null; // Name of person bringing it
};

export type EventConfig = {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  backgroundImageUrl?: string;
  themeColor?: string;
  fontStyle?: 'serif' | 'sans' | 'mono';
  confirmationMessage?: string;
};

export type RSVP = {
  id: string;
  firstName: string;
  attending: boolean;
  note?: string;
  plusOne: boolean;
  itemId?: string | null; // ID of the item they are bringing
};

type EventContextType = {
  config: EventConfig;
  updateConfig: (newConfig: Partial<EventConfig>) => void;
  
  items: Item[];
  addItem: (name: string) => void;
  removeItem: (id: string) => void;
  claimItem: (itemId: string, userName: string) => void;
  unclaimItem: (itemId: string) => void; // For admin or if user changes mind
  
  rsvps: RSVP[];
  addRSVP: (rsvp: Omit<RSVP, 'id'>) => void;
  
  // "Session" state for the current user filling the form
  currentUser: RSVP | null;
  setCurrentUser: (user: RSVP | null) => void;
  
  // Admin helpers
  resetEverything: () => void;
  resetSession: () => void;
};

// --- Mock Initial Data ---

const INITIAL_CONFIG: EventConfig = {
  title: "The Peterson's Annual Dinner",
  description: "Join us for an evening of good food, great company, and warm memories. Please let us know if you can make it!",
  date: "2024-12-20",
  time: "18:00",
  location: "123 Maple Avenue",
  backgroundImageUrl: "",
  themeColor: "hsl(145 20% 35%)", // Sage Green default
  fontStyle: "serif",
  confirmationMessage: "We're delighted you can join us. Your response has been recorded."
};

const INITIAL_ITEMS: Item[] = [
  { id: '1', name: 'Cabernet Sauvignon (2 bottles)', assignee: null },
  { id: '2', name: 'Fresh Fruit Tart', assignee: null },
  { id: '3', name: 'Cheese Platter', assignee: null },
  { id: '4', name: 'Artisan Bread', assignee: null },
  { id: '5', name: 'Sparkling Water', assignee: 'Aunt May' }, // Pre-filled example
];

// --- Context ---

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: React.ReactNode }) {
  // In a real app, this would come from a backend. 
  // We use localStorage to simulate persistence across refreshes so the user can test "refreshing" page.
  
  const [config, setConfig] = useState<EventConfig>(() => {
    const saved = localStorage.getItem('mock_event_config');
    return saved ? JSON.parse(saved) : INITIAL_CONFIG;
  });

  const [items, setItems] = useState<Item[]>(() => {
    const saved = localStorage.getItem('mock_event_items');
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });

  const [rsvps, setRsvps] = useState<RSVP[]>(() => {
    const saved = localStorage.getItem('mock_event_rsvps');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [currentUser, setCurrentUser] = useState<RSVP | null>(null);

  // Persistence Effects
  useEffect(() => localStorage.setItem('mock_event_config', JSON.stringify(config)), [config]);
  useEffect(() => localStorage.setItem('mock_event_items', JSON.stringify(items)), [items]);
  useEffect(() => localStorage.setItem('mock_event_rsvps', JSON.stringify(rsvps)), [rsvps]);

  // Actions
  const updateConfig = (newConfig: Partial<EventConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const addItem = (name: string) => {
    const newItem: Item = { id: Math.random().toString(36).substr(2, 9), name, assignee: null };
    setItems(prev => [...prev, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const claimItem = (itemId: string, userName: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, assignee: userName } : item
    ));
  };
  
  const unclaimItem = (itemId: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, assignee: null } : item
    ));
  };

  const addRSVP = (newRSVP: Omit<RSVP, 'id'>) => {
    const rsvpWithId = { ...newRSVP, id: Math.random().toString(36).substr(2, 9) };
    setRsvps(prev => [...prev, rsvpWithId]);
    setCurrentUser(rsvpWithId);
    
    // If they selected an item, claim it!
    if (newRSVP.itemId) {
      claimItem(newRSVP.itemId, newRSVP.firstName);
    }
  };

  const resetEverything = () => {
    setConfig(INITIAL_CONFIG);
    setItems(INITIAL_ITEMS);
    setRsvps([]);
    setCurrentUser(null);
    localStorage.clear();
  };

  const resetSession = () => {
    setCurrentUser(null);
  };

  return (
    <EventContext.Provider value={{
      config, updateConfig,
      items, addItem, removeItem, claimItem, unclaimItem,
      rsvps, addRSVP,
      currentUser, setCurrentUser,
      resetEverything, resetSession
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
