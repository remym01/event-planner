import React from 'react';
import { useEvent } from '@/lib/event-context';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings, Plus, Trash, User, RefreshCw, Share2, Mail, Link as LinkIcon, Lock, Unlock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export function AdminControls() {
  const { 
    config, updateConfig, 
    items, addItem, removeItem, unclaimItem,
    rsvps, 
    resetEverything, resetSession 
  } = useEvent();
  
  const { toast } = useToast();

  const [newItemName, setNewItemName] = React.useState("");
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [pin, setPin] = React.useState("");
  
  // Hardcoded simple PIN for mockup
  const ADMIN_PIN = "1234";

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName.trim()) {
      addItem(newItemName);
      setNewItemName("");
    }
  };
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      setIsAdmin(true);
      setPin("");
    } else {
      toast({
        variant: "destructive",
        title: "Incorrect PIN",
        description: "Please try again. (Hint: 1234)",
      });
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied!",
      description: "Share this link with your guests.",
    });
  };

  const mailToGuests = () => {
    // Collect all emails (simulated for now since we don't ask for email in RSVP yet, but could be added)
    // Or just open a generic mailto
    const subject = encodeURIComponent(`You're invited: ${config.title}`);
    const body = encodeURIComponent(`Hi everyone,\n\nPlease RSVP for ${config.title} using this link:\n${window.location.href}\n\nBest,\nHost`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
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
          <SheetTitle className="font-serif text-2xl flex items-center gap-2">
            Host Controls 
            {isAdmin ? <Unlock className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
          </SheetTitle>
          <SheetDescription>
            {isAdmin ? "Configure your event details and manage the menu." : "Please enter the admin PIN to access settings."}
          </SheetDescription>
        </SheetHeader>

        {!isAdmin ? (
          <form onSubmit={handleLogin} className="space-y-4 py-8">
            <div className="space-y-2">
              <Label htmlFor="pin">Admin PIN</Label>
              <Input 
                id="pin" 
                type="password" 
                placeholder="Enter PIN (1234)" 
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="text-center tracking-widest text-lg"
              />
            </div>
            <Button type="submit" className="w-full">Unlock Settings</Button>
          </form>
        ) : (
          <div className="space-y-8 py-6">
            
            {/* Section: Share */}
            <div className="space-y-4">
              <h3 className="uppercase text-xs font-semibold tracking-widest text-muted-foreground border-b pb-2">Share Event</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={copyLink} className="w-full">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
                <Button variant="outline" onClick={mailToGuests} className="w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Invite
                </Button>
              </div>
            </div>

            {/* Section: Event Details */}
            <div className="space-y-4">
              <h3 className="uppercase text-xs font-semibold tracking-widest text-muted-foreground border-b pb-2">Event Details</h3>
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
              <h3 className="uppercase text-xs font-semibold tracking-widest text-muted-foreground border-b pb-2">Potluck Menu</h3>
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/20 border border-transparent hover:border-primary/20 transition-colors">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{item.name}</span>
                      {item.assignee ? (
                        <span className="text-xs text-primary flex items-center gap-1 font-medium">
                          <User className="w-3 h-3" /> Taken by {item.assignee}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Available</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {item.assignee && (
                        <Button variant="ghost" size="sm" onClick={() => unclaimItem(item.id)} title="Release item" className="h-8 text-xs">
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
              <h3 className="uppercase text-xs font-semibold tracking-widest text-muted-foreground border-b pb-2 flex items-center justify-between">
                Guest List 
                <Badge variant="outline" className="font-normal">{rsvps.length} Responses</Badge>
              </h3>
              <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-muted/20">
                {rsvps.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center italic py-4">No RSVPs yet.</p>
                ) : (
                  <div className="space-y-4">
                    {rsvps.map((rsvp, i) => (
                      <div key={i} className="text-sm space-y-1">
                        <div className="flex justify-between font-medium items-center">
                          <span>{rsvp.firstName} {rsvp.plusOne && <span className="text-muted-foreground font-normal">(+1)</span>}</span>
                          <Badge variant={rsvp.attending ? "default" : "destructive"} className="text-[10px] h-5">
                            {rsvp.attending ? "Attending" : "Declined"}
                          </Badge>
                        </div>
                        {rsvp.note && <p className="text-muted-foreground italic text-xs">"{rsvp.note}"</p>}
                        {rsvp.itemId && (
                          <p className="text-primary text-xs flex items-center gap-1 font-medium bg-primary/5 p-1 rounded w-fit px-2 mt-1">
                            <Utensils className="w-3 h-3"/> Bringing: {items.find(i => i.id === rsvp.itemId)?.name || "Unknown item"}
                          </p>
                        )}
                        {i < rsvps.length - 1 && <Separator className="mt-2 opacity-50" />}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Section: Testing Controls */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="uppercase text-xs font-semibold tracking-widest text-muted-foreground">Demo Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="default" onClick={resetSession} className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  New Guest
                </Button>
                <Button variant="outline" onClick={resetEverything} className="w-full text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive">
                  <Trash className="w-4 h-4 mr-2" />
                  Reset Data
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                "New Guest" clears your session so you can test as a second user. "Reset Data" clears all configuration and RSVPs.
              </p>
            </div>
            
            <div className="pt-2 flex justify-center">
               <Button variant="ghost" size="sm" onClick={() => setIsAdmin(false)} className="text-xs text-muted-foreground">
                 <Lock className="w-3 h-3 mr-1"/> Lock Controls
               </Button>
            </div>
          </div>
        )}
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
