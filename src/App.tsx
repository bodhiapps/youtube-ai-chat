import { useEffect, useRef } from 'react';
import { BodhiProvider, useBodhi, BodhiBadge } from '@bodhiapp/bodhi-js-react';
import { Toaster } from '@/components/ui/sonner';
import { AUTH_CLIENT_ID, AUTH_SERVER_URL } from './env';
import Layout from './components/Layout';

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
  return (
    <BodhiProvider
      authClientId={AUTH_CLIENT_ID}
      clientConfig={{
        ...(AUTH_SERVER_URL && { authServerUrl: AUTH_SERVER_URL }),
      }}
      basePath="/youtube-ai-chat/"
    >
      <AppContent />
      <div className="fixed bottom-4 right-6 z-50">
        <BodhiBadge size="md" variant="light" />
      </div>
    </BodhiProvider>
  );
}

export default App;
