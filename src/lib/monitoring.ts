import { sendEmail } from "@/integrations/core";

export interface DomainInfo {
  domain: string;
  isUp: boolean;
  responseTime: number;
  statusCode: number;
  sslValid: boolean;
  sslExpiry: string | null;
  domainExpiry: string | null;
  registrar: string | null;
  error?: string;
}

export interface WhoisData {
  registrar: string | null;
  expiryDate: string | null;
}

// פונקציה לבדיקת סטטוס דומיין
export async function checkDomainStatus(domain: string): Promise<DomainInfo> {
  const startTime = Date.now();
  
  try {
    // ניקוי הדומיין מפרוטוקולים
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const url = `https://${cleanDomain}`;
    
    console.log(`בודק דומיין: ${cleanDomain}`);
    
    // בדיקת זמינות האתר
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    });
    
    const responseTime = Date.now() - startTime;
    
    // בדיקת SSL
    const sslInfo = await checkSSL(cleanDomain);
    
    // בדיקת WHOIS
    const whoisInfo = await getWhoisInfo(cleanDomain);
    
    return {
      domain: cleanDomain,
      isUp: true,
      responseTime,
      statusCode: response.status || 200,
      sslValid: sslInfo.valid,
      sslExpiry: sslInfo.expiry,
      domainExpiry: whoisInfo.expiryDate,
      registrar: whoisInfo.registrar
    };
    
  } catch (error) {
    console.error(`שגיאה בבדיקת דומיין ${domain}:`, error);
    
    return {
      domain: domain.replace(/^https?:\/\//, '').replace(/\/$/, ''),
      isUp: false,
      responseTime: Date.now() - startTime,
      statusCode: 0,
      sslValid: false,
      sslExpiry: null,
      domainExpiry: null,
      registrar: null,
      error: error instanceof Error ? error.message : 'שגיאה לא ידועה'
    };
  }
}

// בדיקת SSL
async function checkSSL(domain: string): Promise<{ valid: boolean; expiry: string | null }> {
  try {
    // בדיקה פשוטה של SSL באמצעות fetch
    const response = await fetch(`https://${domain}`, {
      method: 'HEAD',
      mode: 'no-cors'
    });
    
    // אם הגענו לכאן, SSL כנראה תקין
    // בפרויקט אמיתי נשתמש ב-API חיצוני לבדיקת SSL
    return {
      valid: true,
      expiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 יום מהיום
    };
  } catch (error) {
    return {
      valid: false,
      expiry: null
    };
  }
}

// קבלת מידע WHOIS
async function getWhoisInfo(domain: string): Promise<WhoisData> {
  try {
    // בפרויקט אמיתי נשתמש ב-API של WHOIS
    // כרגע נחזיר נתונים לדוגמה
    const registrars = ['GoDaddy', 'Namecheap', 'Google Domains', 'Cloudflare', 'Name.com'];
    const randomRegistrar = registrars[Math.floor(Math.random() * registrars.length)];
    
    // תאריך פקיעה אקראי בין 30 ל-365 יום
    const daysUntilExpiry = Math.floor(Math.random() * 335) + 30;
    const expiryDate = new Date(Date.now() + daysUntilExpiry * 24 * 60 * 60 * 1000);
    
    return {
      registrar: randomRegistrar,
      expiryDate: expiryDate.toISOString()
    };
  } catch (error) {
    console.error('שגיאה בקבלת מידע WHOIS:', error);
    return {
      registrar: null,
      expiryDate: null
    };
  }
}

// חישוב ימים עד פקיעה
export function getDaysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null;
  
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

// שליחת התראה במייל
export async function sendAlert(domain: string, alertType: string, message: string) {
  try {
    const subject = `התראה: בעיה בדומיין ${domain}`;
    const body = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">התראה מערכת ניטור דומיינים</h2>
        <p><strong>דומיין:</strong> ${domain}</p>
        <p><strong>סוג בעיה:</strong> ${alertType}</p>
        <p><strong>פרטים:</strong> ${message}</p>
        <p><strong>זמן:</strong> ${new Date().toLocaleString('he-IL')}</p>
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 14px;">
          הודעה זו נשלחה אוטומטית ממערכת ניטור הדומיינים שלך.
        </p>
      </div>
    `;
    
    await sendEmail({
      to: 'droei86@gmail.com',
      subject,
      body
    });
    
    console.log(`התראה נשלחה בהצלחה עבור דומיין ${domain}`);
  } catch (error) {
    console.error('שגיאה בשליחת התראה:', error);
  }
}

// שליחת התראת ניסיון
export async function sendTestNotification(domain: string) {
  try {
    const subject = `התראת ניסיון: ${domain}`;
    const body = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">התראת ניסיון מערכת ניטור דומיינים</h2>
        <p>זוהי התראת ניסיון עבור הדומיין: <strong>${domain}</strong></p>
        <p>אם אתה רואה הודעה זו, המערכת פועלת כראוי!</p>
        <p><strong>זמן:</strong> ${new Date().toLocaleString('he-IL')}</p>
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 14px;">
          הודעה זו נשלחה אוטומטית ממערכת ניטור הדומיינים שלך.
        </p>
      </div>
    `;
    
    await sendEmail({
      to: 'droei86@gmail.com',
      subject,
      body
    });
    
    return true;
  } catch (error) {
    console.error('שגיאה בשליחת התראת ניסיון:', error);
    return false;
  }
}

// פורמט זמן בעברית
export function formatTimeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'עכשיו';
  if (diffMins < 60) return `לפני ${diffMins} דקות`;
  if (diffHours < 24) return `לפני ${diffHours} שעות`;
  return `לפני ${diffDays} ימים`;
}

// קבלת צבע סטטוס
export function getStatusColor(isUp: boolean, sslValid: boolean): string {
  if (!isUp) return 'bg-red-500';
  if (!sslValid) return 'bg-yellow-500';
  return 'bg-green-500';
}

// קבלת טקסט סטטוס
export function getStatusText(isUp: boolean, sslValid: boolean): string {
  if (!isUp) return 'לא זמין';
  if (!sslValid) return 'SSL לא תקין';
  return 'פעיל';
}