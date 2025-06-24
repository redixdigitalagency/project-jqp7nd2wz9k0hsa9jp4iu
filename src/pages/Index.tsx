import React, { useState, useEffect } from 'react';
import { Domain, User } from '@/entities';
import { DomainCard } from '@/components/DomainCard';
import { DomainListView } from '@/components/DomainListView';
import { AddDomainDialog } from '@/components/AddDomainDialog';
import { DomainMonitor } from '@/components/DomainMonitor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  Shield, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Server,
  Grid3X3,
  List,
  LogIn,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [domains, setDomains] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    sslIssues: 0,
    avgUptime: 0
  });
  const { toast } = useToast();

  // בדיקת משתמש מחובר
  useEffect(() => {
    checkUser();
  }, []);

  // טעינת דומיינים
  useEffect(() => {
    if (user) {
      loadDomains();
    }
  }, [user]);

  // עדכון סטטיסטיקות
  useEffect(() => {
    updateStats();
  }, [domains]);

  const checkUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.log('משתמש לא מחובר');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      await User.login();
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "שגיאה בהתחברות",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await User.logout();
      setUser(null);
      setDomains([]);
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "שגיאה בהתנתקות",
        variant: "destructive",
      });
    }
  };

  const loadDomains = async () => {
    try {
      setIsLoading(true);
      const domainsList = await Domain.list();
      setDomains(domainsList);
    } catch (error) {
      console.error('שגיאה בטעינת דומיינים:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בטעינת רשימת הדומיינים",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateStats = () => {
    const total = domains.length;
    const active = domains.filter(d => d.status === 'active').length;
    const inactive = domains.filter(d => d.status === 'inactive').length;
    const sslIssues = domains.filter(d => d.ssl_status !== 'valid').length;
    const avgUptime = total > 0 ? 
      domains.reduce((sum, d) => sum + d.uptime_percentage, 0) / total : 0;

    setStats({ total, active, inactive, sslIssues, avgUptime });
  };

  const handleAddDomain = async (newDomain: any) => {
    try {
      const created = await Domain.create(newDomain);
      setDomains(prev => [...prev, created]);
    } catch (error) {
      console.error('שגיאה בהוספת דומיין:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בהוספת הדומיין למסד הנתונים",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDomain = async (id: string) => {
    try {
      await Domain.delete(id);
      setDomains(prev => prev.filter(d => d.id !== id));
      toast({
        title: "דומיין נמחק",
        description: "הדומיין נמחק בהצלחה מהמערכת",
      });
    } catch (error) {
      console.error('שגיאה במחיקת דומיין:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה במחיקת הדומיין",
        variant: "destructive",
      });
    }
  };

  const handleToggleMonitoring = async (id: string, enabled: boolean) => {
    try {
      await Domain.update(id, { monitoring_enabled: enabled });
      setDomains(prev => prev.map(d => 
        d.id === id ? { ...d, monitoring_enabled: enabled } : d
      ));
      toast({
        title: enabled ? "ניטור הופעל" : "ניטור הושבת",
        description: `ניטור הדומיין ${enabled ? 'הופעל' : 'הושבת'} בהצלחה`,
      });
    } catch (error) {
      console.error('שגיאה בעדכון ניטור:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בעדכון הגדרות הניטור",
        variant: "destructive",
      });
    }
  };

  const handleUpdateDomain = async (domainId: string, updates: any) => {
    try {
      await Domain.update(domainId, updates);
      setDomains(prev => prev.map(d => 
        d.id === domainId ? { ...d, ...updates } : d
      ));
    } catch (error) {
      console.error('שגיאה בעדכון דומיין:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  // אם המשתמש לא מחובר
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center" dir="rtl">
        <Card className="w-full max-w-md card-gradient border-2">
          <CardHeader className="text-center">
            <div className="mx-auto p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg w-fit mb-4">
              <Globe className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">מערכת ניטור דומיינים</CardTitle>
            <p className="text-muted-foreground">
              התחבר כדי לנטר את הדומיינים שלך
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleLogin} 
              className="w-full gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <LogIn className="h-4 w-4" />
              התחבר עם Google
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              המערכת תשמור את הדומיינים שלך ותנטר אותם באופן רציף
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50" dir="rtl">
      {/* רכיב הניטור */}
      <DomainMonitor 
        domains={domains} 
        onUpdate={handleUpdateDomain}
      />

      {/* כותרת */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient">
                  מערכת ניטור דומיינים
                </h1>
                <p className="text-muted-foreground">
                  ניטור בזמן אמת של כל הדומיינים שלך
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* מידע משתמש */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserIcon className="h-4 w-4" />
                {user.full_name || user.email}
              </div>
              
              {/* כפתורי תצוגה */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              
              <AddDomainDialog onAdd={handleAddDomain} />
              
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 ml-2" />
                התנתק
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* סטטיסטיקות */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="card-gradient border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Server className="h-4 w-4" />
                סה"כ דומיינים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="card-gradient border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                פעילים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>

          <Card className="card-gradient border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                לא פעילים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
            </CardContent>
          </Card>

          <Card className="card-gradient border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4 text-yellow-500" />
                בעיות SSL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.sslIssues}</div>
            </CardContent>
          </Card>

          <Card className="card-gradient border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                זמינות ממוצעת
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.avgUptime.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* רשימת דומיינים */}
        {domains.length === 0 ? (
          <Card className="card-gradient border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Globe className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">אין דומיינים במערכת</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                התחל לנטר את הדומיינים שלך על ידי הוספת הדומיין הראשון למערכת
              </p>
              <AddDomainDialog onAdd={handleAddDomain} />
            </CardContent>
          </Card>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {domains.map((domain) => (
                  <DomainCard
                    key={domain.id}
                    domain={domain}
                    onDelete={handleDeleteDomain}
                    onToggleMonitoring={handleToggleMonitoring}
                  />
                ))}
              </div>
            ) : (
              <DomainListView
                domains={domains}
                onDelete={handleDeleteDomain}
                onToggleMonitoring={handleToggleMonitoring}
              />
            )}
          </>
        )}

        {/* מידע נוסף */}
        <div className="mt-12 text-center">
          <Card className="card-gradient border-2 max-w-2xl mx-auto">
            <CardContent className="py-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="font-semibold">ניטור אוטומטי</span>
              </div>
              <p className="text-muted-foreground">
                המערכת בודקת את כל הדומיינים כל 5 דקות ושולחת התראות במייל במקרה של בעיות
              </p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <Badge variant="outline" className="gap-1">
                  <Activity className="h-3 w-3" />
                  ניטור בזמן אמת
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3 w-3" />
                  בדיקת SSL
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Globe className="h-3 w-3" />
                  מעקב פקיעות
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;