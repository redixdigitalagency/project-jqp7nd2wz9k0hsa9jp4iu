import React, { useEffect, useState } from 'react';
import { checkDomainStatus, sendAlert } from '@/lib/monitoring';

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

          // שלח התראה רק אם הסטטוס השתנה מטוב לרע
          if (wasUp && !result.isUp) {
            console.log(`שולח התראה: אתר ${domain.domain_name} לא זמין`);
            try {
              await sendAlert(
                domain.domain_name,
                'אתר לא זמין',
                `האתר ${domain.domain_name} לא זמין. ${result.error ? `שגיאה: ${result.error}` : ''}`
              );
            } catch (alertError) {
              console.error('שגיאה בשליחת התראה:', alertError);
            }
          }

          if (wasSSLValid && !result.sslValid) {
            console.log(`שולח התראה: בעיית SSL ב-${domain.domain_name}`);
            try {
              await sendAlert(
                domain.domain_name,
                'בעיית SSL',
                `תעודת SSL של האתר ${domain.domain_name} לא תקינה`
              );
            } catch (alertError) {
              console.error('שגיאה בשליחת התראה:', alertError);
            }
          }

          // בדיקת זמן תגובה איטי (רק אם האתר זמין)
          if (result.isUp && result.responseTime > 5000) {
            console.log(`שולח התראה: תגובה איטית ב-${domain.domain_name}`);
            try {
              await sendAlert(
                domain.domain_name,
                'תגובה איטית',
                `זמן התגובה של האתר ${domain.domain_name} הוא ${result.responseTime}ms`
              );
            } catch (alertError) {
              console.error('שגיאה בשליחת התראה:', alertError);
            }
          }

          onUpdate(domain.id, updates);
          console.log(`עדכון הושלם עבור ${domain.domain_name}:`, updates);
          
        } catch (error) {
          console.error(`שגיאה בניטור דומיין ${domain.domain_name}:`, error);
          
          // עדכן את הדומיין כ-error אבל שמור על הנתונים הקיימים
          try {
            onUpdate(domain.id, {
              status: 'error',
              last_check: new Date().toISOString()
            });
          } catch (updateError) {
            console.error('שגיאה בעדכון דומיין:', updateError);
          }
        }

        // המתנה קצרה בין בדיקות כדי לא להעמיס על הדפדפן
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      setIsMonitoring(false);
      console.log('ניטור דומיינים הושלם');
    };

    // ניטור ראשוני אחרי 3 שניות
    const initialTimeout = setTimeout(() => {
      monitorDomains().catch(error => {
        console.error('שגיאה בניטור ראשוני:', error);
        setIsMonitoring(false);
      });
    }, 3000);

    // ניטור כל 5 דקות
    const interval = setInterval(() => {
      monitorDomains().catch(error => {
        console.error('שגיאה בניטור תקופתי:', error);
        setIsMonitoring(false);
      });
    }, 5 * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [domains, onUpdate, isMonitoring]);

  return null; // רכיב זה לא מציג כלום, הוא רק מנטר
}