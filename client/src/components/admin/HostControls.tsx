import React from 'react';
import { useEvent } from '@/lib/event-context';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings, Plus, Trash, User, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function AdminControls() {
  const { 
    config, updateConfig, 
    items, addItem, removeItem, unclaimItem,
    rsvps, 
    resetEverything, resetSession 
  } = useEvent();

  const [newItemName, setNewItemName] = React.useState("");

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName.trim()) {
      addItem(newItemName);
      setNewItemName("");
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="fixed bottom-4 right-4 z-50 rounded-full h-12 w-12 shadow-lg bg-white border-primary/20 hover:bg-primary hover:text-white transition-colors">
          <Settings className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl">Host Controls</SheetTitle>
          <SheetDescription>
            Configure your event details and manage the menu.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8 py-6">
          {/* Section: Event Details */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-medium border-b pb-2">Event Details</h3>
            <div className="grid gap-2">
              <Label htmlFor="title">Event Title</Label>
              <Input 
                id="title" 
                value={config.title} 
                onChange={(e) => updateConfig({ title: e.target.value })} 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea 
                id="desc" 
                value={config.description} 
                onChange={(e) => updateConfig({ description: e.target.value })} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input 
                  id="date" 
                  value={config.date} 
                  onChange={(e) => updateConfig({ date: e.target.value })} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="time">Time</Label>
                <Input 
                  id="time" 
                  value={config.time} 
                  onChange={(e) => updateConfig({ time: e.target.value })} 
                />
              </div>
            </div>
          </div>

          {/* Section: Menu Items */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-medium border-b pb-2">Potluck Menu</h3>
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/20">
                  <div className="flex flex-col">
                    <span className="font-medium">{item.name}</span>
                    {item.assignee ? (
                      <span className="text-xs text-primary flex items-center gap-1">
                        <User className="w-3 h-3" /> Taken by {item.assignee}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Available</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {item.assignee && (
                      <Button variant="ghost" size="sm" onClick={() => unclaimItem(item.id)} title="Release item">
                         Unclaim
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => removeItem(item.id)}>
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <form onSubmit={handleAddItem} className="flex gap-2 pt-2">
              <Input 
                placeholder="Add new item (e.g. Red Wine)" 
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!newItemName.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </form>
          </div>

          {/* Section: Guest List */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-medium border-b pb-2 flex items-center justify-between">
              Guest List 
              <Badge variant="secondary">{rsvps.length} Responses</Badge>
            </h3>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              {rsvps.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center italic py-4">No RSVPs yet.</p>
              ) : (
                <div className="space-y-4">
                  {rsvps.map((rsvp, i) => (
                    <div key={i} className="text-sm space-y-1">
                      <div className="flex justify-between font-medium">
                        <span>{rsvp.firstName} {rsvp.plusOne && <span className="text-muted-foreground">(+1)</span>}</span>
                        <Badge variant={rsvp.attending ? "default" : "destructive"}>
                          {rsvp.attending ? "Attending" : "Declined"}
                        </Badge>
                      </div>
                      {rsvp.note && <p className="text-muted-foreground italic">"{rsvp.note}"</p>}
                      {rsvp.itemId && (
                        <p className="text-primary text-xs flex items-center gap-1">
                          <Utensils className="w-3 h-3"/> Bringing: {items.find(i => i.id === rsvp.itemId)?.name || "Unknown item"}
                        </p>
                      )}
                      <Separator className="mt-2" />
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Section: Testing Controls */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-serif text-lg font-medium">Demo Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={resetSession} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                New Guest (Refresh)
              </Button>
              <Button variant="destructive" onClick={resetEverything} className="w-full">
                <Trash className="w-4 h-4 mr-2" />
                Reset Data
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              "New Guest" clears your session so you can test as a second user. "Reset Data" clears all configuration and RSVPs.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Utensils({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" viewBox="0 0 24 24" 
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
      className={className}
    >
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  );
}
