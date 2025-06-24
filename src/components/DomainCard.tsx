import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface DomainCardProps {
  domain: {
    id: string;
    domain_name: string;
    status: string;
    ssl_status: string;
    ssl_expiry_date: string;
    domain_expiry_date: string;
    domain_registrar: string;
    uptime_percentage: number;
    response_time: number;
    last_check: string;
    monitoring_enabled: boolean;
  };
  onDelete: (id: string) => void;
  onToggleMonitoring: (id: string, enabled: boolean) => void;
}

export function DomainCard({ domain, onDelete, onToggleMonitoring }: DomainCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isUp = domain.status === 'active';
  const sslValid = domain.ssl_status === 'valid';
  const domainDaysLeft = getDaysUntilExpiry(domain.domain_expiry_date);
  const sslDaysLeft = getDaysUntilExpiry(domain.ssl_expiry_date);

  const handleSendTest = async () => {
    setIsLoading(true);
    try {
      const success = await sendTestNotification(domain.domain_name);
      if (success) {
        toast({
          title: "התראת ניסיון נשלחה",
          description: `התראת ניסיון נשלחה בהצלחה עבור ${domain.domain_name}`,
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
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
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
    <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-lg font-semibold text-right">
                {domain.domain_name}
              </CardTitle>
              <p className="text-sm text-muted-foreground text-right">
                {domain.domain_registrar || 'לא ידוע'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendTest}
              disabled={isLoading}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Send className="h-4 w-4 ml-2" />
              {isLoading ? 'שולח...' : 'התראת ניסיון'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(domain.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* סטטוס כללי */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="text-sm font-medium">סטטוס</span>
          </div>
          <Badge variant={isUp ? "default" : "destructive"}>
            {isUp ? 'פעיל' : 'לא זמין'}
          </Badge>
        </div>

        {/* זמינות */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className={`text-2xl font-bold ${getUptimeColor(domain.uptime_percentage)}`}>
              {domain.uptime_percentage.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">זמינות</div>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {domain.response_time}ms
            </div>
            <div className="text-xs text-muted-foreground">זמן תגובה</div>
          </div>
        </div>

        {/* SSL */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">SSL</span>
          </div>
          <div className="text-left">
            <Badge variant={sslValid ? "default" : "destructive"}>
              {sslValid ? 'תקין' : 'לא תקין'}
            </Badge>
            {sslDaysLeft && (
              <div className={`text-xs mt-1 ${getExpiryColor(sslDaysLeft)}`}>
                {sslDaysLeft} ימים עד פקיעה
              </div>
            )}
          </div>
        </div>

        {/* פקיעת דומיין */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="text-sm font-medium">פקיעת דומיין</span>
          </div>
          <div className="text-left">
            {domainDaysLeft ? (
              <div className={`text-sm font-medium ${getExpiryColor(domainDaysLeft)}`}>
                {domainDaysLeft} ימים
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">לא ידוע</div>
            )}
          </div>
        </div>

        {/* בדיקה אחרונה */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">בדיקה אחרונה</span>
          </div>
          <div className="text-sm text-muted-foreground text-left">
            {formatTimeAgo(domain.last_check)}
          </div>
        </div>

        {/* מתג ניטור */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm font-medium">ניטור פעיל</span>
          <Button
            variant={domain.monitoring_enabled ? "default" : "outline"}
            size="sm"
            onClick={() => onToggleMonitoring(domain.id, !domain.monitoring_enabled)}
          >
            {domain.monitoring_enabled ? 'פעיל' : 'כבוי'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}