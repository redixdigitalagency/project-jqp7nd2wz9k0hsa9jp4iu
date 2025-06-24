import React, { useEffect, useState } from 'react';
import { checkDomainStatus, sendAlert } from '@/lib/monitoring';
import { Domain } from '@/entities';

interface DomainMonitorProps {
  domains: any[];
  onUpdate: (domainId: string, updates: any) => void;
}

export function DomainMonitor({ domains, onUpdate }: DomainMonitorProps) {
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (domains.length === 0) return;

    const monitorDomains = async () => {
      if (isMonitoring) return;
      
      setIsMonitoring(true);
      console.log('מתחיל ניטור דומיינים...');

      for (const domain of domains) {
        if (!domain.monitoring_enabled) continue;

        try {
          console.log(`בודק דומיין: ${domain.domain_name}`);
          const result = await checkDomainStatus(domain.domain_name);
          
          const updates = {
            status: result.isUp ? 'active' : 'inactive',
            ssl_status: result.sslValid ? 'valid' : 'invalid',
            ssl_expiry_date: result.sslExpiry || domain.ssl_expiry_date,
            domain_expiry_date: result.domainExpiry || domain.domain_expiry_date,
            domain_registrar: result.registrar || domain.domain_registrar,
            response_time: result.responseTime,
            last_check: new Date().toISOString(),
            uptime_percentage: result.isUp ? 
              Math.min(100, domain.uptime_percentage + 0.1) : 
              Math.max(0, domain.uptime_percentage - 5)
          };

          // בדיקה אם יש בעיות שדורשות התראה
          const wasUp = domain.status === 'active';
          const wasSSLValid = domain.ssl_status === 'valid';

          if (wasUp && !result.isUp) {
            await sendAlert(
              domain.domain_name,
              'אתר לא זמין',
              `האתר ${domain.domain_name} לא זמין. קוד שגיאה: ${result.statusCode}`
            );
          }

          if (wasSSLValid && !result.sslValid) {
            await sendAlert(
              domain.domain_name,
              'בעיית SSL',
              `תעודת SSL של האתר ${domain.domain_name} לא תקינה`
            );
          }

          // בדיקת זמן תגובה איטי
          if (result.responseTime > 5000) {
            await sendAlert(
              domain.domain_name,
              'תגובה איטית',
              `זמן התגובה של האתר ${domain.domain_name} הוא ${result.responseTime}ms`
            );
          }

          onUpdate(domain.id, updates);
          
        } catch (error) {
          console.error(`שגיאה בניטור דומיין ${domain.domain_name}:`, error);
          
          onUpdate(domain.id, {
            status: 'error',
            last_check: new Date().toISOString()
          });
        }

        // המתנה קצרה בין בדיקות
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setIsMonitoring(false);
      console.log('ניטור דומיינים הושלם');
    };

    // ניטור ראשוני
    monitorDomains();

    // ניטור כל 5 דקות
    const interval = setInterval(monitorDomains, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [domains, onUpdate, isMonitoring]);

  return null; // רכיב זה לא מציג כלום, הוא רק מנטר
}