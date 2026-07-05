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

route('/', LandingPage);
route('/prihlaseni', LoginPage);
route('/registrace', RegisterPage);
route('/cenik', PricingPage);
route('/onboarding', OnboardingPage, { auth: true });
route('/dashboard', DashboardPage, { auth: true, onboarded: true });
route('/vyzva/:id', CallDetailPage, { auth: true, onboarded: true });
route('/ulozene', SavedPage, { auth: true, onboarded: true });
route('/nastaveni', SettingsPage, { auth: true, onboarded: true });
route('/admin', AdminPage, { auth: true, admin: true });

const root = document.getElementById('app');
startRouter(root);
