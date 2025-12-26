import React from 'react';
import { useEvent, Item } from '@/lib/event-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Check, Utensils, Clock, Users, Gift, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const formSchema = z.object({
  firstName: z.string().min(2, "Name is required"),
  attending: z.enum(["yes", "no"]),
  plusOne: z.boolean().default(false),
  note: z.string().optional(),
  itemId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function RSVPForm() {
  const { config, items, addRSVP, currentUser } = useEvent();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      attending: "yes",
      plusOne: false,
      note: "",
      itemId: "none",
    },
  });

  const attending = form.watch("attending");
  const availableItems = items.filter(i => !i.assignee);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    // Simulate network delay for "Secure" feel
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    addRSVP({
      firstName: data.firstName,
      attending: data.attending === "yes",
      plusOne: data.plusOne,
      note: data.note,
      itemId: data.itemId === "none" ? undefined : data.itemId,
    });
    
    setIsSubmitting(false);
  };

  if (currentUser) {
    return (
      <Card className="w-full max-w-md mx-auto overflow-hidden border-none shadow-soft bg-white/90 backdrop-blur-sm">
        <CardContent className="pt-6 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif text-primary">Thank you, {currentUser.firstName}!</h2>
          <p className="text-muted-foreground">
            {currentUser.attending 
              ? (config.confirmationMessage || "We're delighted you can join us. Your response has been recorded.")
              : "We're sorry you can't make it, but thank you for letting us know!"}
          </p>
          
          {currentUser.attending && currentUser.itemId && (
            <div className="bg-secondary/50 p-4 rounded-lg mt-4">
              <p className="text-sm text-secondary-foreground font-medium">You are bringing:</p>
              <p className="text-lg font-serif text-primary">
                {items.find(i => i.id === currentUser.itemId)?.name}
              </p>
            </div>
          )}
          
          <div className="pt-6">
             <p className="text-xs text-muted-foreground">Detailed location and reminders will be sent closer to the date.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto border-none shadow-soft bg-white/95 backdrop-blur-sm">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-3xl font-serif text-primary">{config.title}</CardTitle>
        <CardDescription className="text-base mt-2 font-light">{config.description}</CardDescription>
        
        <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground uppercase tracking-widest">
           <span>{config.date}</span>
           <span>|</span>
           <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {config.time}</span>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Name */}
          <div className="space-y-3">
            <Label htmlFor="firstName" className="uppercase text-xs font-semibold tracking-widest text-muted-foreground/80 pl-1">Your Name</Label>
            <Input 
              id="firstName" 
              placeholder="e.g. Jane Doe" 
              {...form.register("firstName")}
              className="bg-secondary/10 border-transparent hover:bg-secondary/20 focus:bg-white focus:border-primary/20 rounded-lg h-12 text-lg font-serif placeholder:font-sans placeholder:text-muted-foreground/40 placeholder:font-normal transition-all duration-300"
            />
            {form.formState.errors.firstName && (
              <p className="text-xs text-destructive pl-1">{form.formState.errors.firstName.message}</p>
            )}
          </div>

          {/* Attendance */}
          <div className="space-y-3">
            <Label className="uppercase text-xs font-semibold tracking-widest text-muted-foreground/80 pl-1">Will you be attending?</Label>
            <RadioGroup 
              defaultValue="yes" 
              onValueChange={(val) => form.setValue("attending", val as "yes" | "no")}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              <div>
                <RadioGroupItem value="yes" id="yes" className="peer sr-only" />
                <Label
                  htmlFor="yes"
                  className="flex flex-row items-center justify-between px-4 py-3 rounded-lg border bg-white border-border hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:shadow-md cursor-pointer transition-all duration-200 group"
                >
                  <span className="text-base font-medium font-serif">Joyfully Accept</span>
                  <Check className="h-4 w-4 opacity-0 group-hover:opacity-50 peer-data-[state=checked]:opacity-100 transition-opacity" />
                </Label>
              </div>
              <div>
                <RadioGroupItem value="no" id="no" className="peer sr-only" />
                <Label
                  htmlFor="no"
                  className="flex flex-row items-center justify-between px-4 py-3 rounded-lg border bg-white border-border hover:border-destructive/50 peer-data-[state=checked]:border-destructive peer-data-[state=checked]:bg-destructive peer-data-[state=checked]:text-destructive-foreground peer-data-[state=checked]:shadow-md cursor-pointer transition-all duration-200 group"
                >
                  <span className="text-base font-medium font-serif">Regretfully Decline</span>
                  <span className="text-lg leading-none opacity-0 group-hover:opacity-50 peer-data-[state=checked]:opacity-100 transition-opacity">✕</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <AnimatePresence>
            {attending === "yes" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onAnimationComplete={(definition: any) => {
                  // Remove overflow hidden after animation completes to allow dropdowns to pop out
                  if (definition.height === "auto" || (typeof definition === "object" && definition.height === "auto")) {
                    const el = document.getElementById('attending-section');
                    if (el) el.style.overflow = 'visible';
                  }
                }}
                id="attending-section"
                className="space-y-6 overflow-hidden pt-2"
              >
                {/* Plus One */}
                <div className="flex items-center justify-between bg-secondary/5 p-3 rounded-lg border border-transparent hover:border-border/50 transition-colors">
                  <div className="space-y-1">
                    <Label className="text-base font-serif text-primary">Bringing a Guest?</Label>
                    <p className="text-xs text-muted-foreground">Is someone joining you?</p>
                  </div>
                  <Switch 
                    checked={form.watch("plusOne")}
                    onCheckedChange={(checked) => form.setValue("plusOne", checked)}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>

                {/* Items to Bring */}
                <div className="space-y-2">
                  <Label className="uppercase text-xs font-semibold tracking-widest text-muted-foreground/80 pl-1 flex items-center gap-2">
                    <Utensils className="w-3 h-3 text-primary" />
                    Potluck Contribution
                  </Label>
                  <Select onValueChange={(val) => form.setValue("itemId", val)}>
                    <SelectTrigger className="w-full h-12 bg-white border-border focus:ring-1 focus:ring-primary/20 text-base px-4">
                      <SelectValue placeholder="Select a dish to bring (Optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">I'll just bring myself</SelectItem>
                      {availableItems.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                      {/* Show unavailable items as disabled so user sees they are taken */}
                      {items.filter(i => i.assignee).map(item => (
                        <SelectItem key={item.id} value={item.id} disabled className="opacity-50 italic">
                          {item.name} (Taken by {item.assignee})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notes */}
          <div className="space-y-2 pt-2">
            <Label htmlFor="note" className="uppercase text-xs font-semibold tracking-widest text-muted-foreground/80 pl-1 flex items-center justify-between">
              <span>Special Requests</span>
              <span className="text-[10px] opacity-60 font-normal normal-case">(Optional)</span>
            </Label>
            <Textarea 
              id="note" 
              placeholder="Let us know if you'll be running late, need help with location, or have dietary restrictions..." 
              {...form.register("note")}
              className="resize-none bg-secondary/10 border-transparent focus:bg-white focus:border-primary/20 min-h-[100px] text-base placeholder:text-muted-foreground/40 placeholder:font-sans transition-all duration-300"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-lg font-serif bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm RSVP"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
