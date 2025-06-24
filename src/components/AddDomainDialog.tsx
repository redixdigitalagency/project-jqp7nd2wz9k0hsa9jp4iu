import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { checkDomainStatus } from '@/lib/monitoring';

interface AddDomainDialogProps {
  onAdd: (domain: any) => void;
}

export function AddDomainDialog({ onAdd }: AddDomainDialogProps) {
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!domain.trim()) {
      toast({
        title: "שגיאה",
        description: "אנא הזן שם דומיין",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // בדיקה ראשונית של הדומיין
      const domainInfo = await checkDomainStatus(domain.trim());
      
      const newDomain = {
        domain_name: domainInfo.domain,
        status: domainInfo.isUp ? 'active' : 'inactive',
        ssl_status: domainInfo.sslValid ? 'valid' : 'invalid',
        ssl_expiry_date: domainInfo.sslExpiry || '',
        domain_expiry_date: domainInfo.domainExpiry || '',
        domain_registrar: domainInfo.registrar || '',
        uptime_percentage: domainInfo.isUp ? 100 : 0,
        response_time: domainInfo.responseTime,
        last_check: new Date().toISOString(),
        monitoring_enabled: true,
        notification_email: 'droei86@gmail.com',
        monitoring_interval: 5
      };

      onAdd(newDomain);
      
      toast({
        title: "דומיין נוסף בהצלחה",
        description: `הדומיין ${domainInfo.domain} נוסף למערכת הניטור`,
      });
      
      setDomain('');
      setOpen(false);
      
    } catch (error) {
      console.error('שגיאה בהוספת דומיין:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בהוספת הדומיין. אנא נסה שוב.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Plus className="h-4 w-4" />
          הוסף דומיין
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">הוספת דומיין חדש</DialogTitle>
          <DialogDescription className="text-right">
            הזן את שם הדומיין שברצונך לנטר. המערכת תבדוק אוטומטית את הסטטוס שלו.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="domain" className="text-right">
                שם דומיין
              </Label>
              <Input
                id="domain"
                placeholder="example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="text-right"
                disabled={isLoading}
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground text-right">
                הזן את שם הדומיין ללא http:// או https://
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              ביטול
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  בודק...
                </>
              ) : (
                'הוסף דומיין'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}