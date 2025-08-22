import { Shield, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PrivacyDisclaimer = () => {
  return (
    <Alert className="flex items-center bg-primary/10 border-primary/30 mb-6">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary" />
        <Lock className="h-4 w-4 text-primary" />
      </div>
      <AlertDescription className="text-sm">
        <strong>100% Private & Secure:</strong> Your financial data never leaves your browser. 
        All processing happens locally on your device - no data is transmitted, stored, or saved on any server.
      </AlertDescription>
    </Alert>
  );
};

export default PrivacyDisclaimer;