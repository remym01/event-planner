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
              ? "We're delighted you can join us. Your response has been recorded."
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
           <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {config.time}</span>
           <span>|</span>
           <span>{config.date}</span>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName" className="uppercase text-xs tracking-wider text-muted-foreground">Your Name</Label>
            <Input 
              id="firstName" 
              placeholder="e.g. Jane Doe" 
              {...form.register("firstName")}
              className="bg-transparent border-t-0 border-x-0 border-b-2 rounded-none focus-visible:ring-0 px-0 h-12 text-lg font-serif placeholder:font-sans placeholder:text-muted-foreground/50 border-input focus:border-primary transition-colors"
            />
            {form.formState.errors.firstName && (
              <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>
            )}
          </div>

          {/* Attendance */}
          <div className="space-y-3">
            <Label className="uppercase text-xs tracking-wider text-muted-foreground">Will you be attending?</Label>
            <RadioGroup 
              defaultValue="yes" 
              onValueChange={(val) => form.setValue("attending", val as "yes" | "no")}
              className="flex gap-4"
            >
              <div className="flex-1">
                <RadioGroupItem value="yes" id="yes" className="peer sr-only" />
                <Label
                  htmlFor="yes"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                >
                  <span className="text-lg font-serif mb-1">Joyfully Accept</span>
                  <Check className="h-4 w-4" />
                </Label>
              </div>
              <div className="flex-1">
                <RadioGroupItem value="no" id="no" className="peer sr-only" />
                <Label
                  htmlFor="no"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-destructive peer-data-[state=checked]:text-destructive cursor-pointer transition-all"
                >
                  <span className="text-lg font-serif mb-1">Regretfully Decline</span>
                  <span className="text-lg">✕</span>
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
                className="space-y-6 overflow-hidden"
              >
                <Separator className="bg-border/50" />

                {/* Plus One */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Bringing a Guest?</Label>
                    <p className="text-xs text-muted-foreground">Is someone joining you?</p>
                  </div>
                  <Switch 
                    checked={form.watch("plusOne")}
                    onCheckedChange={(checked) => form.setValue("plusOne", checked)}
                  />
                </div>

                {/* Items to Bring */}
                <div className="space-y-2">
                  <Label className="text-base flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-primary" />
                    Like to bring something?
                  </Label>
                  <Select onValueChange={(val) => form.setValue("itemId", val)}>
                    <SelectTrigger className="w-full bg-secondary/20 border-border">
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
                        <SelectItem key={item.id} value={item.id} disabled className="opacity-50">
                          {item.name} (Taken by {item.assignee})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Items claimed by others are shown as unavailable.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="note" className="uppercase text-xs tracking-wider text-muted-foreground">Any notes?</Label>
            <Textarea 
              id="note" 
              placeholder="Running late? Dietary restrictions?" 
              {...form.register("note")}
              className="resize-none bg-secondary/10 border-border focus:border-primary"
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
