import { RSVPForm } from "@/components/forms/RSVPForm";
import { AdminControls } from "@/components/admin/HostControls";
import { EventProvider } from "@/lib/event-context";
import bgImage from "@assets/generated_images/elegant_dinner_party_table_setting_with_soft_lighting.png";

export default function Home() {
  return (
    <EventProvider>
      <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Layer with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={bgImage} 
            alt="Background" 
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
        </div>

        {/* Content Layer */}
        <div className="relative z-10 w-full px-4 py-12 flex flex-col items-center">
          <div className="w-full max-w-md mb-8 text-center animate-in fade-in zoom-in duration-1000">
             {/* Decorative element or logo could go here */}
          </div>
          
          <div className="w-full animate-in slide-in-from-bottom-8 duration-700 delay-200">
            <RSVPForm />
          </div>
          
          <div className="mt-8 text-white/60 text-xs font-light tracking-widest text-center">
            SECURE RSVP SYSTEM © 2024
          </div>
        </div>

        {/* Admin Layer */}
        <AdminControls />
      </div>
    </EventProvider>
  );
}
