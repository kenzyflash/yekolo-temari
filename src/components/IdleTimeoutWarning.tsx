import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Clock, LogOut } from 'lucide-react';

interface IdleTimeoutWarningProps {
  isOpen: boolean;
  remainingTime: number;
  onStayLoggedIn: () => void;
  onLogout: () => void;
}

const IdleTimeoutWarning = ({
  isOpen,
  remainingTime,
  onStayLoggedIn,
  onLogout
}: IdleTimeoutWarningProps) => {
  const [displayTime, setDisplayTime] = useState('');

  useEffect(() => {
    const minutes = Math.floor(remainingTime / 60000);
    const seconds = Math.floor((remainingTime % 60000) / 1000);
    setDisplayTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
  }, [remainingTime]);

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="bg-brand-darker border-brand-green/30 max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            Session Timeout Warning
          </AlertDialogTitle>
          <AlertDialogDescription className="text-brand-green/80">
            Your session will expire due to inactivity. You will be automatically logged out in:
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-6 flex justify-center">
          <div className="bg-brand-dark rounded-lg px-8 py-4 border border-yellow-500/30">
            <span className="text-4xl font-mono font-bold text-yellow-500">
              {displayTime}
            </span>
          </div>
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel 
            onClick={onLogout}
            className="bg-transparent border-brand-red/50 text-brand-red hover:bg-brand-red/10 hover:text-brand-red"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log Out Now
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onStayLoggedIn}
            className="bg-brand-green text-brand-dark hover:bg-brand-green/90"
          >
            Stay Logged In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default IdleTimeoutWarning;
