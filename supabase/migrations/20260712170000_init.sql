-- =====================================================================
-- Stanford Climate Week — full schema (idempotent-ish init migration)
-- Mirrors the migrations applied to project gtrfhkndwawugqalsonv.
-- Sections: 1 enums · 2 core tables · 3 registration/messaging/surveys
--           4 helpers/triggers · 5 views · 6 RLS · 7 storage · 8 hardening
-- =====================================================================

-- ---------- 1. Extensions + enums ----------
create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "citext" with schema extensions;

create type public.involvement_role as enum ('organizer','event_lead','attendee','speaker');
create type public.degree_type      as enum ('undergrad','masters','phd');
create type public.external_sector  as enum ('academia','govt_policy','nonprofit_public','private_company','vc_investment','independent');
create type public.climate_identity as enum ('inspire_indifferent','empower_engaged','mobilize_motivated');
create type public.climate_pain_point as enum ('lack_knowledge','lack_connections','lack_skillset','other');
create type public.registration_status as enum ('registered','cancelled','checked_in');
create type public.blast_audience    as enum ('all_attendees','event_registrants');
create type public.survey_category   as enum ('industry_knowledge','peer_connections','directed_skillset');

-- ---------- 2. Core tables ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  location text,
  involvement public.involvement_role[] not null default '{}',
  is_stanford_student boolean,
  degree public.degree_type,
  stanford_year integer check (stanford_year between 2026 and 2032),
  area_of_study text,
  external_sector public.external_sector,
  background_affiliation text,
  climate_identity public.climate_identity,
  climate_pain_point public.climate_pain_point,
  climate_pain_point_other text,
  avatar_url text,
  is_admin boolean not null default false,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stanford_fields_ck check (
    is_stanford_student is null
    or (is_stanford_student = true  and degree is not null and stanford_year is not null and area_of_study is not null)
    or (is_stanford_student = false and external_sector is not null)
  ),
  constraint pain_point_other_ck check (
    climate_pain_point is distinct from 'other' or climate_pain_point_other is not null
  )
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text check (char_length(description) <= 400),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text not null,
  cover_art_url text,
  format_tags text[] not null default '{}',
  sector_tags text[] not null default '{}',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_time_ck check (ends_at > starts_at)
);
create index events_starts_at_idx on public.events (starts_at);

create table public.event_speakers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  role text,
  profile_id uuid references public.profiles(id) on delete set null,
  sort_order integer not null default 0
);
create index event_speakers_event_idx on public.event_speakers (event_id);

create table public.event_leads (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id  uuid not null references public.profiles(id) on delete cascade,
  primary key (event_id, user_id)
);

-- ---------- 3. Registration / messaging / surveys ----------
create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id  uuid not null references public.profiles(id) on delete cascade,
  status public.registration_status not null default 'registered',
  registered_at timestamptz not null default now(),
  checked_in_at timestamptz,
  cancelled_at timestamptz,
  unique (event_id, user_id)
);
create index event_registrations_event_idx on public.event_registrations (event_id);
create index event_registrations_user_idx  on public.event_registrations (user_id);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (conversation_id, user_id)
);
create index conv_participants_user_idx on public.conversation_participants (user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);

create table public.blasts (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  audience public.blast_audience not null,
  event_id uuid references public.events(id) on delete cascade,
  subject text,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  constraint blast_audience_ck check (
    (audience = 'event_registrants' and event_id is not null) or
    (audience = 'all_attendees'     and event_id is null)
  )
);
create index blasts_event_idx on public.blasts (event_id);
create index blasts_created_idx on public.blasts (created_at desc);

create table public.post_event_surveys (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id  uuid not null references public.profiles(id) on delete cascade,
  learning_scale smallint not null check (learning_scale between 1 and 5),
  most_helpful public.survey_category not null,
  other_thoughts text,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);
create index post_event_surveys_event_idx on public.post_event_surveys (event_id);

create table public.post_scw_surveys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  responses jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- 4. Helper functions + triggers ----------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.has_role(target public.involvement_role)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select target = any(involvement) from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_event_lead(target_event uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.event_leads where event_id = target_event and user_id = auth.uid());
$$;

create or replace function public.is_registered(target_event uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.event_registrations
    where event_id = target_event and user_id = auth.uid() and status in ('registered','checked_in'));
$$;

create or replace function public.is_conversation_participant(target_conv uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.conversation_participants
    where conversation_id = target_conv and user_id = auth.uid());
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_touch  before update on public.profiles         for each row execute function public.touch_updated_at();
create trigger events_touch    before update on public.events           for each row execute function public.touch_updated_at();
create trigger post_scw_touch  before update on public.post_scw_surveys for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'))
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.guard_profile_privileges()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_admin is distinct from old.is_admin and not public.is_admin() then
    raise exception 'not authorized to change admin status';
  end if;
  return new;
end; $$;
create trigger profiles_guard_privileges before update on public.profiles for each row execute function public.guard_profile_privileges();

create or replace function public.bump_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end; $$;
create trigger messages_bump_conversation after insert on public.messages for each row execute function public.bump_conversation();

-- ---------- 5. Views (limited directory + aggregate counts) ----------
create view public.directory_profiles with (security_invoker = false) as
  select id, full_name, avatar_url, involvement, is_stanford_student
  from public.profiles where onboarding_completed = true;

create view public.event_registration_counts with (security_invoker = false) as
  select e.id as event_id,
    count(*) filter (where r.status in ('registered','checked_in')) as registered_count,
    count(*) filter (where r.status = 'checked_in')                 as checked_in_count
  from public.events e
  left join public.event_registrations r on r.event_id = e.id
  group by e.id;

grant select on public.directory_profiles to authenticated;
grant select on public.event_registration_counts to authenticated;

-- ---------- 6. Row-Level Security ----------
alter table public.profiles                  enable row level security;
alter table public.events                    enable row level security;
alter table public.event_speakers            enable row level security;
alter table public.event_leads               enable row level security;
alter table public.event_registrations       enable row level security;
alter table public.conversations             enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages                  enable row level security;
alter table public.blasts                    enable row level security;
alter table public.post_event_surveys        enable row level security;
alter table public.post_scw_surveys          enable row level security;

create policy profiles_select on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy profiles_insert on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

create policy events_select on public.events for select to authenticated using (true);
create policy events_write  on public.events for all to authenticated using (public.is_admin() or public.has_role('organizer')) with check (public.is_admin() or public.has_role('organizer'));
create policy speakers_select on public.event_speakers for select to authenticated using (true);
create policy speakers_write  on public.event_speakers for all to authenticated using (public.is_admin() or public.has_role('organizer')) with check (public.is_admin() or public.has_role('organizer'));
create policy leads_select on public.event_leads for select to authenticated using (true);
create policy leads_write  on public.event_leads for all to authenticated using (public.is_admin() or public.has_role('organizer')) with check (public.is_admin() or public.has_role('organizer'));

create policy reg_select on public.event_registrations for select to authenticated using (user_id = auth.uid() or public.is_admin() or public.has_role('organizer') or public.is_event_lead(event_id));
create policy reg_insert on public.event_registrations for insert to authenticated with check (user_id = auth.uid());
create policy reg_update on public.event_registrations for update to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy reg_delete on public.event_registrations for delete to authenticated using (user_id = auth.uid() or public.is_admin());

create policy conv_select on public.conversations for select to authenticated using (public.is_conversation_participant(id) or public.is_admin());
create policy conv_insert on public.conversations for insert to authenticated with check (created_by = auth.uid());
create policy cp_select on public.conversation_participants for select to authenticated using (user_id = auth.uid() or public.is_conversation_participant(conversation_id));
create policy cp_insert on public.conversation_participants for insert to authenticated with check (
  user_id = auth.uid() or exists (select 1 from public.conversations c where c.id = conversation_id and c.created_by = auth.uid())
);
create policy msg_select on public.messages for select to authenticated using (public.is_conversation_participant(conversation_id) or public.is_admin());
create policy msg_insert on public.messages for insert to authenticated with check (sender_id = auth.uid() and public.is_conversation_participant(conversation_id));
create policy msg_update on public.messages for update to authenticated using (public.is_conversation_participant(conversation_id)) with check (public.is_conversation_participant(conversation_id));

create policy blasts_select on public.blasts for select to authenticated using (
  public.is_admin() or sender_id = auth.uid() or audience = 'all_attendees'
  or (audience = 'event_registrants' and public.is_registered(event_id))
);
create policy blasts_insert on public.blasts for insert to authenticated with check (
  sender_id = auth.uid() and (
    (audience = 'all_attendees' and public.has_role('organizer')) or
    (audience = 'event_registrants' and (public.has_role('organizer') or public.is_event_lead(event_id)))
  )
);
create policy blasts_delete on public.blasts for delete to authenticated using (sender_id = auth.uid() or public.is_admin());

create policy pes_select on public.post_event_surveys for select to authenticated using (user_id = auth.uid() or public.is_admin() or public.has_role('organizer') or public.is_event_lead(event_id));
create policy pes_insert on public.post_event_surveys for insert to authenticated with check (user_id = auth.uid() and public.is_registered(event_id));
create policy pes_update on public.post_event_surveys for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy pss_select on public.post_scw_surveys for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy pss_insert on public.post_scw_surveys for insert to authenticated with check (user_id = auth.uid());
create policy pss_update on public.post_scw_surveys for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- 7. Storage buckets ----------
insert into storage.buckets (id, name, public)
values ('avatars','avatars',true), ('event-covers','event-covers',true)
on conflict (id) do nothing;

create policy "avatars_owner_write"  on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_owner_update" on storage.objects for update to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_owner_delete" on storage.objects for delete to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "covers_organizer_write"  on storage.objects for insert to authenticated with check (bucket_id = 'event-covers' and (public.is_admin() or public.has_role('organizer')));
create policy "covers_organizer_update" on storage.objects for update to authenticated using (bucket_id = 'event-covers' and (public.is_admin() or public.has_role('organizer')));

-- ---------- 8. Hardening ----------
revoke all on function public.handle_new_user()          from public, anon, authenticated;
revoke all on function public.bump_conversation()        from public, anon, authenticated;
revoke all on function public.guard_profile_privileges() from public, anon, authenticated;
revoke all on function public.is_admin()                           from public, anon;
revoke all on function public.has_role(public.involvement_role)    from public, anon;
revoke all on function public.is_event_lead(uuid)                  from public, anon;
revoke all on function public.is_registered(uuid)                  from public, anon;
revoke all on function public.is_conversation_participant(uuid)    from public, anon;
grant execute on function public.is_admin()                        to authenticated;
grant execute on function public.has_role(public.involvement_role) to authenticated;
grant execute on function public.is_event_lead(uuid)               to authenticated;
grant execute on function public.is_registered(uuid)               to authenticated;
grant execute on function public.is_conversation_participant(uuid) to authenticated;
revoke all on public.directory_profiles        from anon;
revoke all on public.event_registration_counts from anon;
