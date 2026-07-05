export const SUPABASE_URL = 'https://bvxrkptutjwcjvfccwwl.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_AMIDk1ABhxzeG22e2_Fh4g_wc1gTSjq';
export const STRIPE_PUBLISHABLE_KEY = 'pk_test_51TpphiCsp5VZTDhKRFPN0IorxCitj96ze3gexljKM9Y3zJbe3ejmsoFwoPw0XJ8P5zf3n3YIQRpgJYncpxpRghJb00RlaNXQvC';

export const DEMO_MODE = !SUPABASE_URL || !SUPABASE_ANON_KEY;

export const CZ_NACE = [
  'Výroba a průmysl',
  'Stavebnictví',
  'IT a technologie',
  'Zemědělství',
  'Obchod a služby',
  'Doprava a logistika',
  'Cestovní ruch a pohostinství',
  'Zdravotnictví a sociální služby',
  'Vzdělávání',
  'Energetika a životní prostředí',
  'Kreativní průmysly',
  'Ostatní',
];

export const KRAJE = [
  'Hlavní město Praha',
  'Středočeský',
  'Jihočeský',
  'Plzeňský',
  'Karlovarský',
  'Ústecký',
  'Liberecký',
  'Královéhradecký',
  'Pardubický',
  'Vysočina',
  'Jihomoravský',
  'Olomoucký',
  'Zlínský',
  'Moravskoslezský',
];

export const VELIKOSTI = ['OSVČ', 'do 10 zaměstnanců', 'do 50 zaměstnanců', '50+ zaměstnanců'];

export const PLANY = {
  FREE: { id: 'FREE', nazev: 'FREE', cena: 0, limitVyzevMesicne: 3, notifikace: 'týdenní souhrn' },
  PRO: { id: 'PRO', nazev: 'PRO', cena: 490, limitVyzevMesicne: Infinity, notifikace: 'okamžité' },
  FIRMA: { id: 'FIRMA', nazev: 'FIRMA', cena: 1490, limitVyzevMesicne: Infinity, notifikace: 'okamžité' },
};

export const POSKYTOVATELE = ['EU', 'MPO', 'MMR', 'Kraj', 'SFŽP', 'MZe', 'MPSV', 'ČMZRB'];
