-- Hlídač dotací – Supabase schema
-- Spusťte celé v Supabase Dashboard → SQL Editor → New query → Run.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Tabulky
-- ---------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  plan text not null default 'FREE' check (plan in ('FREE', 'PRO', 'FIRMA')),
  obor text,
  kraj text,
  velikost_firmy text,
  onboarding_complete boolean not null default false,
  notification_prefs jsonb not null default '{
    "frequency": "tydenni",
    "poskytovatele": {"EU": true, "MPO": true, "MMR": true, "Kraj": true, "SFŽP": true, "MZe": true, "MPSV": true, "ČMZRB": true}
  }'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  nazev text not null,
  poskytovatel text not null,
  obory text[] not null default '{}',
  kraje text[] not null default '{}',
  velikosti text[] not null default '{}',
  min_castka numeric not null default 0,
  max_castka numeric not null default 0,
  deadline date not null,
  popis text not null default '',
  url text not null default '',
  stav text not null default 'aktivni' check (stav in ('aktivni', 'ukoncena')),
  created_at date not null default current_date
);

create table if not exists public.saved_calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  call_id uuid not null references public.calls(id) on delete cascade,
  poznamka text not null default '',
  saved_at timestamptz not null default now(),
  unique (user_id, call_id)
);

create table if not exists public.excluded (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  call_id uuid not null references public.calls(id) on delete cascade,
  poskytovatel text,
  obory text[],
  excluded_at timestamptz not null default now(),
  unique (user_id, call_id)
);

-- ---------------------------------------------------------------------
-- Pomocná funkce pro admin kontrolu (SECURITY DEFINER obchází RLS uvnitř sebe)
-- ---------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- Auto-vytvoření profilu při registraci (auth.users -> profiles)
-- ---------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.calls enable row level security;
alter table public.saved_calls enable row level security;
alter table public.excluded enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

drop policy if exists "calls_select_authenticated" on public.calls;
create policy "calls_select_authenticated" on public.calls
  for select using (auth.role() = 'authenticated');

drop policy if exists "calls_admin_write" on public.calls;
create policy "calls_admin_write" on public.calls
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "saved_select_own" on public.saved_calls;
create policy "saved_select_own" on public.saved_calls
  for select using (auth.uid() = user_id);

drop policy if exists "saved_insert_own" on public.saved_calls;
create policy "saved_insert_own" on public.saved_calls
  for insert with check (auth.uid() = user_id);

drop policy if exists "saved_update_own" on public.saved_calls;
create policy "saved_update_own" on public.saved_calls
  for update using (auth.uid() = user_id);

drop policy if exists "saved_delete_own" on public.saved_calls;
create policy "saved_delete_own" on public.saved_calls
  for delete using (auth.uid() = user_id);

drop policy if exists "excluded_select_own" on public.excluded;
create policy "excluded_select_own" on public.excluded
  for select using (auth.uid() = user_id);

drop policy if exists "excluded_insert_own" on public.excluded;
create policy "excluded_insert_own" on public.excluded
  for insert with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- Seed dat: 15 ukázkových výzev
-- ---------------------------------------------------------------------

insert into public.calls (nazev, poskytovatel, obory, kraje, velikosti, min_castka, max_castka, deadline, popis, url, stav, created_at) values
('OP TAK – Digitální podnik', 'EU', '{"IT a technologie","Obchod a služby","Výroba a průmysl"}', '{"Celá ČR"}', '{"OSVČ","do 10 zaměstnanců","do 50 zaměstnanců"}', 100000, 3000000, '2026-09-30', 'Podpora zavádění pokročilých digitálních technologií (ERP, CRM, cloud, kybernetická bezpečnost) do provozu malých a středních podniků. Určeno firmám, které chtějí digitalizovat interní procesy nebo výrobu.', 'https://optak.cz/digitalni-podnik', 'aktivni', '2026-06-28'),
('OP TAK – Úspory energie', 'EU', '{"Výroba a průmysl","Zemědělství"}', '{"Celá ČR"}', '{"do 10 zaměstnanců","do 50 zaměstnanců","50+ zaměstnanců"}', 500000, 15000000, '2026-07-18', 'Dotace na snížení energetické náročnosti výrobních provozů – zateplení budov, rekuperace tepla, výměna technologií za úspornější varianty.', 'https://optak.cz/uspory-energie', 'aktivni', '2026-05-10'),
('OP Zaměstnanost+ – Rekvalifikace zaměstnanců', 'EU', '{"Obchod a služby","Výroba a průmysl","Doprava a logistika","Ostatní"}', '{"Celá ČR"}', '{"do 10 zaměstnanců","do 50 zaměstnanců","50+ zaměstnanců"}', 50000, 2000000, '2026-10-31', 'Podpora rekvalifikace a dalšího vzdělávání zaměstnanců v souvislosti se změnami na trhu práce a zaváděním nových technologií.', 'https://esfcr.cz/rekvalifikace', 'aktivni', '2026-04-01'),
('OP JAK – Podpora vzdělávání zaměstnanců', 'EU', '{"Vzdělávání","Zdravotnictví a sociální služby","Ostatní"}', '{"Celá ČR"}', '{"OSVČ","do 10 zaměstnanců","do 50 zaměstnanců"}', 30000, 800000, '2026-08-01', 'Finanční podpora vzdělávacích a školicích institucí a firem poskytujících odborné vzdělávání a rekvalifikační kurzy.', 'https://opjak.cz/vzdelavani', 'aktivni', '2026-03-15'),
('SFŽP – Nová zelená úsporám pro podnikatele', 'SFŽP', '{"Energetika a životní prostředí","Výroba a průmysl","Zemědělství"}', '{"Celá ČR"}', '{"OSVČ","do 10 zaměstnanců","do 50 zaměstnanců","50+ zaměstnanců"}', 100000, 5000000, '2026-12-15', 'Podpora instalace obnovitelných zdrojů energie, fotovoltaických elektráren a úsporných opatření v podnikatelských objektech.', 'https://sfzp.cz/nzu-podnikatele', 'aktivni', '2026-06-30'),
('Jihomoravský inovační voucher', 'Kraj', '{"IT a technologie","Výroba a průmysl","Kreativní průmysly"}', '{"Jihomoravský"}', '{"OSVČ","do 10 zaměstnanců","do 50 zaměstnanců"}', 20000, 300000, '2026-07-12', 'Podpora spolupráce malých a středních podniků s výzkumnými organizacemi na inovativních projektech v Jihomoravském kraji.', 'https://jic.cz/inovacni-voucher', 'aktivni', '2026-05-20'),
('Podpora cestovního ruchu – Jihočeský kraj', 'Kraj', '{"Cestovní ruch a pohostinství","Obchod a služby"}', '{"Jihočeský"}', '{"OSVČ","do 10 zaměstnanců","do 50 zaměstnanců"}', 50000, 500000, '2026-09-01', 'Dotace na rozvoj turistické infrastruktury, ubytovacích kapacit a doprovodných služeb cestovního ruchu v Jihočeském kraji.', 'https://kraj-jihocesky.cz/cestovni-ruch', 'aktivni', '2026-06-15'),
('MPO – Marketing pro malé a střední podniky', 'MPO', '{"Obchod a služby","Kreativní průmysly","Cestovní ruch a pohostinství"}', '{"Celá ČR"}', '{"OSVČ","do 10 zaměstnanců","do 50 zaměstnanců"}', 30000, 400000, '2026-07-16', 'Podpora účasti malých a středních podniků na zahraničních veletrzích a tvorby marketingových materiálů pro export.', 'https://mpo.cz/marketing-msp', 'aktivni', '2026-06-01'),
('PGRLF – Podpora zemědělských podnikatelů', 'MZe', '{"Zemědělství"}', '{"Celá ČR"}', '{"OSVČ","do 10 zaměstnanců","do 50 zaměstnanců","50+ zaměstnanců"}', 100000, 4000000, '2026-11-30', 'Zvýhodněné úvěry a podpory pro zemědělské podnikatele na investice do modernizace strojů a zemědělských staveb.', 'https://pgrlf.cz/podpora', 'aktivni', '2026-02-10'),
('ČMZRB – Záruka Expanze', 'ČMZRB', '{"Výroba a průmysl","Obchod a služby","Doprava a logistika","IT a technologie"}', '{"Celá ČR"}', '{"do 10 zaměstnanců","do 50 zaměstnanců"}', 500000, 20000000, '2026-12-31', 'Zvýhodněné záruky k úvěrům na investiční projekty malých a středních podniků realizované mimo Prahu.', 'https://cmzrb.cz/zaruka-expanze', 'aktivni', '2026-01-15'),
('MMR – Podpora obnovy venkova', 'MMR', '{"Stavebnictví","Zemědělství","Ostatní"}', '{"Celá ČR"}', '{"OSVČ","do 10 zaměstnanců"}', 50000, 1000000, '2026-08-31', 'Podpora obnovy a rozvoje venkovské infrastruktury a drobného podnikání v obcích do 3000 obyvatel.', 'https://mmr.cz/obnova-venkova', 'aktivni', '2026-06-29'),
('OP TAK – Inovace produktová a procesní', 'EU', '{"Výroba a průmysl","IT a technologie"}', '{"Celá ČR"}', '{"do 10 zaměstnanců","do 50 zaměstnanců","50+ zaměstnanců"}', 1000000, 25000000, '2026-10-15', 'Podpora zavádění inovovaných nebo zcela nových produktů a výrobních procesů s vyšší přidanou hodnotou.', 'https://optak.cz/inovace', 'aktivni', '2026-05-01'),
('Praha – Voucher na inovace', 'Kraj', '{"IT a technologie","Kreativní průmysly","Zdravotnictví a sociální služby"}', '{"Hlavní město Praha"}', '{"OSVČ","do 10 zaměstnanců","do 50 zaměstnanců"}', 50000, 1000000, '2026-07-25', 'Podpora pražských firem při vývoji nových produktů a služeb ve spolupráci s vysokými školami a výzkumnými centry.', 'https://praha.eu/voucher-inovace', 'aktivni', '2026-06-27'),
('OP TAK – Robotizace a automatizace výroby', 'EU', '{"Výroba a průmysl"}', '{"Celá ČR"}', '{"do 10 zaměstnanců","do 50 zaměstnanců","50+ zaměstnanců"}', 500000, 10000000, '2026-09-10', 'Podpora nasazení robotických a automatizačních technologií do výrobních linek za účelem zvýšení produktivity.', 'https://optak.cz/robotizace', 'aktivni', '2026-04-20'),
('MPSV – Podpora zaměstnávání OZP', 'MPSV', '{"Obchod a služby","Výroba a průmysl","Zdravotnictví a sociální služby","Ostatní"}', '{"Celá ČR"}', '{"OSVČ","do 10 zaměstnanců","do 50 zaměstnanců","50+ zaměstnanců"}', 20000, 500000, '2026-07-14', 'Příspěvek zaměstnavatelům na vytvoření a provoz pracovních míst pro osoby se zdravotním postižením.', 'https://mpsv.cz/podpora-ozp', 'aktivni', '2026-06-05')
on conflict do nothing;

-- ---------------------------------------------------------------------
-- Jak vytvořit admin účet:
-- 1. Zaregistrujte se v běžící aplikaci normálně (libovolný e-mail).
-- 2. Spusťte v SQL Editoru (nahraďte e-mail):
--    update public.profiles set role = 'admin' where email = 'admin@vasefirma.cz';
-- ---------------------------------------------------------------------
