import { route, startRouter } from './router.js';
import { LandingPage } from './pages/landing.js';
import { LoginPage } from './pages/login.js';
import { RegisterPage } from './pages/register.js';
import { OnboardingPage } from './pages/onboarding.js';
import { DashboardPage } from './pages/dashboard.js';
import { CallDetailPage } from './pages/callDetail.js';
import { SavedPage } from './pages/saved.js';
import { SettingsPage } from './pages/settings.js';
import { PricingPage } from './pages/pricing.js';
import { AdminPage } from './pages/admin.js';
import { TermsPage, PrivacyPage } from './pages/legal.js';
import { ForgotPasswordPage } from './pages/forgotPassword.js';
import { ResetPasswordPage } from './pages/resetPassword.js';
import { DEMO_MODE } from './config.js';
import { getSupabase } from './supabaseClient.js';

route('/', LandingPage);
route('/prihlaseni', LoginPage);
route('/registrace', RegisterPage);
route('/zapomenute-heslo', ForgotPasswordPage);
route('/nove-heslo', ResetPasswordPage);
route('/cenik', PricingPage);
route('/obchodni-podminky', TermsPage);
route('/zasady-zpracovani-udaju', PrivacyPage);
route('/onboarding', OnboardingPage, { auth: true });
route('/dashboard', DashboardPage, { auth: true, onboarded: true });
route('/vyzva/:id', CallDetailPage, { auth: true, onboarded: true });
route('/ulozene', SavedPage, { auth: true, onboarded: true });
route('/nastaveni', SettingsPage, { auth: true, onboarded: true });
route('/admin', AdminPage, { auth: true, admin: true });

const root = document.getElementById('app');
const render = startRouter(root);

if (!DEMO_MODE) {
  getSupabase().then((supabase) => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        window.location.hash = '/nove-heslo';
        render();
      }
    });
  });
}
