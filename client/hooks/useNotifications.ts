import { useCallback, useEffect } from 'react';

export interface Notification {
  id: string;
  type: 'signal' | 'trade' | 'alert' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export function useNotifications() {
  // Request notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Send browser notification
  const sendBrowserNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: '/icon.svg',
          ...options,
        });
      } catch (err) {
        console.error('[v0] Error sending notification:', err);
      }
    }
  }, []);

  // Send email notification (API call)
  const sendEmailNotification = useCallback(
    async (to: string, subject: string, message: string) => {
      try {
        const apiUrl = import.meta.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/notifications/email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to,
            subject,
            message,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send email notification');
        }

        return await response.json();
      } catch (err) {
        console.error('[v0] Error sending email:', err);
        throw err;
      }
    },
    []
  );

  // Notify on new signal
  const notifySignal = useCallback(
    (symbol: string, type: 'BUY' | 'SELL', strength: number, confidence: number) => {
      const title = `${type} Signal - ${symbol}`;
      const message = `Strength: ${strength}/10, Confidence: ${confidence}%`;

      // Browser notification
      sendBrowserNotification(title, {
        body: message,
        tag: `signal-${symbol}`,
        badge: '/icon.svg',
      });

      // Log for demo
      console.log('[v0] Signal notification sent:', { symbol, type, strength, confidence });
    },
    [sendBrowserNotification]
  );

  // Notify on trade execution
  const notifyTrade = useCallback(
    (symbol: string, side: 'LONG' | 'SHORT', price: number, quantity: number) => {
      const title = `Trade Executed - ${symbol}`;
      const message = `${side} ${quantity} @ $${price.toFixed(2)}`;

      sendBrowserNotification(title, {
        body: message,
        tag: `trade-${Date.now()}`,
        badge: '/icon.svg',
      });

      console.log('[v0] Trade notification sent:', { symbol, side, price, quantity });
    },
    [sendBrowserNotification]
  );

  // Notify on alert trigger
  const notifyAlert = useCallback(
    (symbol: string, condition: string) => {
      const title = `Alert Triggered - ${symbol}`;
      const message = condition;

      sendBrowserNotification(title, {
        body: message,
        tag: `alert-${symbol}`,
        badge: '/icon.svg',
      });

      console.log('[v0] Alert notification sent:', { symbol, condition });
    },
    [sendBrowserNotification]
  );

  return {
    sendBrowserNotification,
    sendEmailNotification,
    notifySignal,
    notifyTrade,
    notifyAlert,
  };
}
