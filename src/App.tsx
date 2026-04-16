import { useEffect, useMemo, useRef } from 'react';
import { BodhiProvider, useBodhi, BodhiBadge, WebUIClient } from '@bodhiapp/bodhi-js-react';
import { Toaster } from '@/components/ui/sonner';
import { AUTH_CLIENT_ID, AUTH_SERVER_URL, BODHI_SERVER_URL } from './env';
import Layout from './components/Layout';

const BASE_PATH = import.meta.env.BASE_URL;

function AppContent() {
  const { clientState, showSetup } = useBodhi();
  const hasAutoOpenedRef = useRef(false);

  useEffect(() => {
    const shouldAutoOpen =
      clientState.status === 'direct-not-connected' || clientState.status === 'extension-not-found';

    if (shouldAutoOpen && !hasAutoOpenedRef.current) {
      showSetup();
      hasAutoOpenedRef.current = true;
    }
  }, [clientState.status, showSetup]);

  return (
    <>
      <Layout />
      <Toaster />
    </>
  );
}

function App() {
  const client = useMemo(() => {
    if (!BODHI_SERVER_URL) return undefined;
    const c = new WebUIClient(AUTH_CLIENT_ID, {
      ...(AUTH_SERVER_URL && { authServerUrl: AUTH_SERVER_URL }),
      basePath: BASE_PATH,
    });
    c.init({ serverUrl: BODHI_SERVER_URL, testConnection: true }).catch(err => {
      console.error('[bodhi] direct-mode init failed:', err);
    });
    return c;
  }, []);

  if (client) {
    return (
      <BodhiProvider client={client} basePath={BASE_PATH}>
        <AppContent />
        <div className="fixed bottom-4 right-6 z-50">
          <BodhiBadge size="md" variant="light" />
        </div>
      </BodhiProvider>
    );
  }

  return (
    <BodhiProvider
      authClientId={AUTH_CLIENT_ID}
      clientConfig={{
        ...(AUTH_SERVER_URL && { authServerUrl: AUTH_SERVER_URL }),
      }}
      basePath={BASE_PATH}
    >
      <AppContent />
      <div className="fixed bottom-4 right-6 z-50">
        <BodhiBadge size="md" variant="light" />
      </div>
    </BodhiProvider>
  );
}

export default App;
