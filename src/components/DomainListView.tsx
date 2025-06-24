import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Send,
  Trash2,
  Activity
} from 'lucide-react';
import { getDaysUntilExpiry, formatTimeAgo, sendTestNotification } from '@/lib/monitoring';
import { useToast } from '@/hooks/use-toast';

interface DomainListViewProps {
  domains: any[];
  onDelete: (id: string) => void;
  onToggleMonitoring: (id: string, enabled: boolean) => void;
}

export function DomainListView({ domains, onDelete, onToggleMonitoring }: DomainListViewProps) {
  const { toast } = useToast();

  const handleSendTest = async (domain: string) => {
    try {
      const success = await sendTestNotification(domain);
      if (success) {
        toast({
          title: "התראת ניסיון נשלחה",
          description: `התראת ניסיון נשלחה בהצלחה עבור ${domain}`,
        });
      } else {
        throw new Error('שגיאה בשליחה');
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "שגיאה בשליחת התראת הניסיון",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (isUp: boolean, sslValid: boolean) => {
    if (isUp && sslValid) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (!isUp) return <XCircle className="h-5 w-5 text-red-500" />;
    return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  };

  const getUptimeColor = (uptime: number) => {
    if (uptime >= 99) return 'text-green-600';
    if (uptime >= 95) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getExpiryColor = (days: number | null) => {
    if (!days) return 'text-gray-500';
    if (days <= 7) return 'text-red-600';
    if (days <= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-4">
      {domains.map((domain) => {
        const isUp = domain.status === 'active';
        const sslValid = domain.ssl_status === 'valid';
        const domainDaysLeft = getDaysUntilExpiry(domain.domain_expiry_date);
        const sslDaysLeft = getDaysUntilExpiry(domain.ssl_expiry_date);

        return (
          <Card key={domain.id} className="card-gradient border-2 hover:border-primary/20 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                {/* מידע בסיסי */}
                <div className="flex items-center gap-4">
                  {getStatusIcon(isUp, sslValid)}
                  <div>
                    <h3 className="text-lg font-semibold">{domain.domain_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {domain.domain_registrar || 'לא ידוע'}
                    </p>
                  </div>
                </div>

                {/* סטטוס */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className={`text-lg font-bold ${getUptimeColor(domain.uptime_percentage)}`}>
                      {domain.uptime_percentage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">זמינות</div>
                  </div>

                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {domain.response_time}ms
                    </div>
                    <div className="text-xs text-muted-foreground">תגובה</div>
                  </div>

                  <div className="text-center">
                    <Badge variant={sslValid ? "default" : "destructive"}>
                      {sslValid ? 'SSL תקין' : 'SSL לא תקין'}
                    </Badge>
                    {sslDaysLeft && (
                      <div className={`text-xs mt-1 ${getExpiryColor(sslDaysLeft)}`}>
                        {sslDaysLeft} ימים
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    {domainDaysLeft ? (
                      <div className={`text-lg font-bold ${getExpiryColor(domainDaysLeft)}`}>
                        {domainDaysLeft} ימים
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">לא ידוע</div>
                    )}
                    <div className="text-xs text-muted-foreground">עד פקיעה</div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">
                      {formatTimeAgo(domain.last_check)}
                    </div>
                    <div className="text-xs text-muted-foreground">בדיקה אחרונה</div>
                  </div>
                </div>

                {/* פעולות */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={domain.monitoring_enabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => onToggleMonitoring(domain.id, !domain.monitoring_enabled)}
                  >
                    {domain.monitoring_enabled ? 'פעיל' : 'כבוי'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendTest(domain.domain_name)}
                  >
                    <Send className="h-4 w-4 ml-2" />
                    ניסיון
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(domain.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}