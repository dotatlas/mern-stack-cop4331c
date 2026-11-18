import { useEffect, useState } from 'react';
import { apiRequest } from './api'; // Adjust this import to your actual API file location.

function NotificationTest() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [swStatus, setSwStatus] = useState('Checking...');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then(() => setSwStatus('Registered and ready'))
        .catch(() => setSwStatus('Registration failed'));
    } else {
      setSwStatus('Not supported');
    }
  }, []);

  // Convert the Base64 VAPID public key into a Uint8Array.
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);

    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);

    return Uint8Array.from(
      [...rawData].map((char) => char.charCodeAt(0))
    );
  };

  const enableNotifications = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setMessage('Your browser does not support push notifications.');
      return;
    }

    if (!localStorage.getItem('token')) {
      setMessage('Please log in before enabling notifications.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // 1. Request notification permission.
      const result = await Notification.requestPermission();

      setPermission(result);

      if (result !== 'granted') {
        setMessage(`Notification permission: ${result}`);
        return;
      }

      // 2. Get the existing registered Service Worker.
      const registration = await navigator.serviceWorker.ready;

      // 3. Get the public VAPID key from the backend.
      const keyResponse = await apiRequest('/api/push/public-key');

      if (!keyResponse?.publicKey) {
        throw new Error('Could not retrieve the VAPID public key.');
      }

      // 4. Create the browser push subscription.
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            keyResponse.publicKey
          ),
        });
      }

      // 5. Send the subscription to the backend using the existing JWT.
      await apiRequest(
        '/api/push/subscribe',
        'POST',
        subscription.toJSON()
      );

      setMessage('Notifications enabled and subscription saved successfully!');
    } catch (error) {
      console.error('Notification setup error:', error);

      setMessage(
        error instanceof Error
          ? error.message
          : 'Failed to enable notifications.'
      );
    } finally {
      setLoading(false);
    }
  };


    const sendTestNotification = async () => {
    if (!('Notification' in window)) {
        setMessage('Notifications are not supported.');
        return;
    }

    if (Notification.permission !== 'granted') {
        setMessage(`Notification permission is ${Notification.permission}.`);
        return;
    }

    try {
        const registration = await navigator.serviceWorker.ready;

        // Remove previous notifications with the same tag.
        const existing = await registration.getNotifications({
        tag: 'calendar-test',
        });

        existing.forEach(notification => notification.close());

        // Display a fresh notification.
        await registration.showNotification(
        'Calendar Test Reminder',
        {
            body: `Test notification sent at ${new Date().toLocaleTimeString()}`,
            icon: '/vite.svg',
            tag: 'calendar-test',
            renotify: true,
        }
        );

        setMessage('Test notification displayed successfully!');
    } catch (error) {
        console.error('Test notification error:', error);

        setMessage(
        error instanceof Error
            ? error.message
            : 'Failed to display notification.'
        );
    }
    };


  return (
    <div className="container py-5">
      <div className="card shadow-sm mx-auto p-4" style={{ maxWidth: 550 }}>
        <h2 className="mb-2">Browser Notification Tester</h2>

        <p className="text-muted">
          Test your calendar push notification registration.
        </p>

        <hr />

        <div className="mb-3">
          <strong>Service Worker:</strong> {swStatus}
        </div>

        <div className="mb-4">
          <strong>Notification Permission:</strong> {permission}
        </div>

        <button
          className="btn btn-primary mb-3"
          onClick={enableNotifications}
          disabled={loading}
        >
          {loading ? 'Enabling...' : 'Enable Notifications'}
        </button>

        <button
          className="btn btn-outline-primary"
          onClick={sendTestNotification}
          disabled={permission !== 'granted' || loading}
        >
          Send Local Test Notification
        </button>

        {message && (
          <div className="alert alert-info mt-4 mb-0">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationTest;
