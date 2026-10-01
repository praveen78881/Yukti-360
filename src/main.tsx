import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from './routes';
import { purgeLegacyAppDataOnce } from '@/lib/purgeLegacyAppData';
import { initSagarCompanyOnce } from '@/lib/initSagarCompany';
import { initIndhicCompanyOnce } from '@/lib/initIndhicCompany';
import { installNumberInputGuard } from '@/lib/numberInputGuard';
import './app/globals.css';

// Amounts change only by typing — no mouse-wheel or ↑/↓ stepping on number fields.
installNumberInputGuard();

try { purgeLegacyAppDataOnce(); } catch (e) { console.error('purge error:', e); }
try { initSagarCompanyOnce(); } catch (e) { console.error('sagar init error:', e); }
try { initIndhicCompanyOnce(); } catch (e) { console.error('indhic init error:', e); }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
    <Toaster richColors position="top-right" closeButton />
  </StrictMode>
);
