import { RSVPForm } from "@/components/forms/RSVPForm";
import { AdminControls } from "@/components/admin/HostControls";
import { useEvent } from "@/lib/event-context";
import bgImage from "@assets/generated_images/elegant_dinner_party_table_setting_with_soft_lighting.png";
import { useEffect } from "react";

export default function Home() {
  const { config } = useEvent();
  
  const fontStyle = config?.fontStyle || 'serif';
  
  // Apply theme color dynamically
  useEffect(() => {
    if (config?.themeColor) {
      document.documentElement.style.setProperty('--primary', config.themeColor);
      document.documentElement.style.setProperty('--ring', config.themeColor);
    }
    
    // Apply font style to root element
    const root = document.getElementById('root');
    if (root) {
      root.classList.remove('font-serif', 'font-sans', 'font-mono');
      root.classList.add(`font-${fontStyle}`);
    }
  }, [config?.themeColor, fontStyle]);

  return (
    <div className={`min-h-screen w-full bg-background flex flex-col items-center justify-center relative overflow-hidden font-${fontStyle}`}>
      {/* Background Layer with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={config?.backgroundImageUrl || bgImage} 
          alt="Background" 
          className="w-full h-full object-cover opacity-90 transition-opacity duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-primary/10 mix-blend-multiply transition-colors duration-500" />
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
  );
}
