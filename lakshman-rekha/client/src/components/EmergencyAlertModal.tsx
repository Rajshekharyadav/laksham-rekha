import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmergencyAlertModalProps {
  open: boolean;
  onClose: () => void;
  location?: { lat: number; lng: number };
}

export function EmergencyAlertModal({ open, onClose, location }: EmergencyAlertModalProps) {
  const [countdown, setCountdown] = useState(30);
  const [alarmActive, setAlarmActive] = useState(false);
  const [status, setStatus] = useState<'pending' | 'safe' | 'emergency'>('pending');
  const [autoSosCountdown, setAutoSosCountdown] = useState(20);

  useEffect(() => {
    if (!open) {
      setCountdown(30);
      setAlarmActive(false);
      setStatus('pending');
      setAutoSosCountdown(20);
      // Stop any playing audio
      if ((window as any).emergencyAudio) {
        (window as any).emergencyAudio.pause();
        (window as any).emergencyAudio = null;
      }
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open]);

  // Define triggerSOS before it's used in effects
  const triggerSOS = useCallback(() => {
    // This would trigger actual emergency call
    console.log('SOS TRIGGERED - Emergency services contacted');
    alert('Emergency services have been notified. Help is on the way!');
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (countdown === 0 && !alarmActive) {
      // Play police sound after countdown reaches zero
      const audio = new Audio('/Police.mp3');
      audio.loop = true;
      audio.play().catch(console.error);
      
      // Store audio reference to stop it later
      (window as any).emergencyAudio = audio;
      
      // Set alarm active AFTER starting the audio
      setAlarmActive(true);
    }
  }, [countdown, alarmActive]);

  // Auto SOS escalation timer - triggers SOS call automatically after 20 seconds of alarm
  useEffect(() => {
    if (!alarmActive || status === 'safe') {
      return;
    }

    const interval = setInterval(() => {
      setAutoSosCountdown((prev) => {
        if (prev <= 1) {
          // Auto-trigger SOS call
          triggerSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [alarmActive, status, triggerSOS]);

  const handleSafe = () => {
    setStatus('safe');
    setAutoSosCountdown(20); // Reset auto SOS countdown
    setTimeout(() => onClose(), 1000);
  };

  const handleNotSafe = () => {
    setStatus('emergency');
    
    // Play emergency sound immediately
    if (!(window as any).emergencyAudio) {
      const audio = new Audio('/Police.mp3');
      audio.loop = true;
      audio.play().catch(console.error);
      (window as any).emergencyAudio = audio;
    }
    
    setAlarmActive(true);
  };

  const stopAlarm = () => {
    setAlarmActive(false);
    setAutoSosCountdown(20); // Reset auto SOS countdown
    // Stop police sound
    if ((window as any).emergencyAudio) {
      (window as any).emergencyAudio.pause();
      (window as any).emergencyAudio = null;
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "sm:max-w-md border-2",
          alarmActive ? "border-emergency animate-pulse" : "border-warning"
        )}
        data-testid="modal-emergency-alert"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              alarmActive ? "bg-emergency/20 emergency-pulse" : "bg-warning/20"
            )}>
              <AlertTriangle className={cn(
                "w-6 h-6",
                alarmActive ? "text-emergency" : "text-warning"
              )} />
            </div>
            <div>
              <DialogTitle className="text-xl tracking-wide-emergency">
                {alarmActive ? "⚠️ EMERGENCY ALARM ACTIVE" : "⚠️ You are in a Danger Zone"}
              </DialogTitle>
              <DialogDescription>
                {alarmActive 
                  ? "Stop the alarm or emergency services will be contacted" 
                  : "Are you safe? Please respond immediately"
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Countdown Timer */}
          {!alarmActive && status === 'pending' && (
            <div className="text-center">
              <div className="text-6xl font-mono font-bold text-warning mb-2">
                {countdown}
              </div>
              <p className="text-sm text-muted-foreground">seconds to respond</p>
            </div>
          )}

          {/* Alarm Active */}
          {alarmActive && status !== 'safe' && (
            <div className="text-center space-y-4">
              <div className="text-2xl font-bold text-emergency emergency-pulse">
                🚨 EMERGENCY ALARM 🚨
              </div>
              <div className="h-24 flex items-center justify-center">
                <div className="w-full h-16 bg-emergency/10 rounded-lg flex items-center justify-center">
                  <div className="flex gap-2">
                    {[...Array(5)].map((_, i) => (
                      <div 
                        key={i} 
                        className="w-3 h-12 bg-emergency rounded-sm animate-pulse"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-lg font-semibold text-warning">
                Auto SOS in: {autoSosCountdown}s
              </div>
            </div>
          )}

          {/* Success Message */}
          {status === 'safe' && (
            <div className="text-center p-4 bg-safe/10 rounded-lg">
              <p className="text-lg font-semibold text-safe">✓ Marked as Safe</p>
              <p className="text-sm text-muted-foreground mt-1">Stay vigilant and safe</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {!alarmActive && status === 'pending' && (
              <>
                <Button 
                  onClick={handleSafe} 
                  className="h-12 bg-safe hover:bg-safe/90 text-white font-semibold"
                  data-testid="button-mark-safe"
                >
                  I'm Safe
                </Button>
                <Button 
                  onClick={handleNotSafe}
                  variant="destructive"
                  className="h-12 font-semibold"
                  data-testid="button-mark-unsafe"
                >
                  I Need Help
                </Button>
              </>
            )}

            {alarmActive && (
              <>
                <Button 
                  onClick={stopAlarm}
                  className="h-12 bg-safe hover:bg-safe/90 text-white font-semibold"
                  data-testid="button-stop-alarm"
                >
                  Stop Alarm - I'm Safe
                </Button>
                <Button 
                  onClick={triggerSOS}
                  variant="destructive"
                  className="h-12 font-semibold"
                  data-testid="button-trigger-sos"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Emergency SOS Call
                </Button>
              </>
            )}
          </div>

          {location && (
            <p className="text-xs text-center text-muted-foreground">
              Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
