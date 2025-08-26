{\rtf1\ansi\ansicpg1252\cocoartf2865
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\froman\fcharset0 Times-Roman;}
{\colortbl;\red255\green255\blue255;\red0\green0\blue0;}
{\*\expandedcolortbl;;\cssrgb\c0\c0\c0;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\deftab720
\pard\pardeftab720\partightenfactor0

\f0\fs24 \cf0 \expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 -- ==========================\
-- 0) Preparaci\'f3n\
-- ==========================\
create extension if not exists pgcrypto;\
create schema if not exists crm;\
\
-- (Opcional en sesiones RPC:)\
-- select set_config('search_path','crm, public', true);\
\
-- ==========================\
-- 1) Cat\'e1logos / Pipelines\
-- ==========================\
create table if not exists crm.sources (\
id smallserial primary key,\
name text unique not null check (char_length(name) between 3 and 40)\
);\
insert into crm.sources (id, name)\
values (1,'Ads'),(2,'Referido'),(3,'Alianza'),(4,'Org\'e1nico')\
on conflict (id) do nothing;\
\
create table if not exists crm.pipelines (\
id uuid primary key default gen_random_uuid(),\
name text not null,\
is_default boolean not null default false\
);\
insert into crm.pipelines (name, is_default)\
values ('Ahorro/GMM', true)\
on conflict do nothing;\
\
create table if not exists crm.stages (\
id uuid primary key default gen_random_uuid(),\
pipeline_id uuid references crm.pipelines(id) on delete cascade,\
name text not null,\
position int not null,\
probability int not null default 0 check (probability between 0 and 100),\
unique (pipeline_id, position)\
);\
insert into crm.stages (pipeline_id, name, position, probability)\
select p.id, s.name, s.pos, s.prob\
from crm.pipelines p\
join (values\
('Nuevo',1,5),\
('Contactado',2,15),\
('Agendado',3,35),\
('Diagn\'f3stico',4,50),\
('Propuesta',5,70),\
('Seguimiento',6,80),\
('Cierre',7,100)\
) as s(name,pos,prob) on true\
where p.is_default = true\
on conflict do nothing;\
\
-- ==========================\
-- 2) Entidades\
-- ==========================\
\
create table if not exists crm.companies (\
\
last_name text,\
phone text,\
email text,\
city text,\
source_id smallint references crm.sources(id),\
notes text,\
is_client boolean default false,\
tags text[] default '\{\}'\
);\
create index if not exists idx_crm_contacts_phone on crm.contacts (phone);\
create index if not exists idx_crm_contacts_email on crm.contacts (email);\
\
create table if not exists crm.opportunities (\
id uuid primary key default gen_random_uuid(),\
created_at timestamptz default now(),\
owner uuid references auth.users(id) on delete set null,\
contact_id uuid references crm.contacts(id) on delete cascade,\
company_id uuid references crm.companies(id) on delete set null,\
pipeline_id uuid references crm.pipelines(id) on delete set null,\
stage_id uuid references crm.stages(id) on delete set null,\
interest text not null check (interest in ('Ahorro','GMM','Ambos')),\
amount_estimated numeric(14,2),\
probability int default 0,\
next_step_at timestamptz,\
source_id smallint references crm.sources(id),\
status text not null default 'open' check (status in ('open','won','lost')),\
lost_reason text\
);\
create index if not exists idx_crm_opps_stage on crm.opportunities (stage_id);\
create index if not exists idx_crm_opps_owner on crm.opportunities (owner);\
\
create table if not exists crm.activities (\
id uuid primary key default gen_random_uuid(),\
created_at timestamptz default now(),\
owner uuid references auth.users(id) on delete set null,\
opportunity_id uuid references crm.opportunities(id) on delete cascade,\
contact_id uuid references crm.contacts(id) on delete set null,\
kind text not null check (kind in ('call','whatsapp','meeting','note')),\
summary text,\
happened_at timestamptz default now()\
);\
\
create table if not exists crm.tasks (\
id uuid primary key default gen_random_uuid(),\
created_at timestamptz default now(),\
owner uuid references auth.users(id) on delete set null,\
contact_id uuid references crm.contacts(id) on delete set null,\
opportunity_id uuid references crm.opportunities(id) on delete set null,\
title text not null,\
due_at timestamptz not null,\
priority text not null default 'normal' check (priority in ('low','normal','high')),\
status text not null default 'open' check (status in ('open','done','cancelled'))\
);\
create index if not exists idx_crm_tasks_due on crm.tasks (due_at);\
\
create table if not exists crm.referrals (\
id uuid primary key default gen_random_uuid(),\
created_at timestamptz default now(),\
referrer_contact_id uuid references crm.contacts(id) on delete set null,\
referred_contact_id uuid references crm.contacts(id) on delete set null,\
opportunity_id uuid references crm.opportunities(id) on delete set null,\
reward_status text default 'pending' check (reward_status in ('pending','approved','sent')),\
reward_note text\
);\
\
-- ==========================\
-- 3) Vistas\
-- ==========================\
create or replace view crm.v_opps_kanban as\
select o.id, o.created_at, o.owner, o.interest, o.amount_estimated,\
s.name as stage, s.position, c.first_name || ' ' || coalesce(c.last_name,'') as contact,\
coalesce(o.next_step_at, now()) as next_step_at\
from crm.opportunities o\
join crm.stages s on s.id = o.stage_id\
join crm.contacts c on c.id = o.contact_id;\
\
create or replace view crm.v_funnel_by_source as\
select so.name as source,\
count(*) filter (where o.stage_id is not null) as leads,\
count(*) filter (where s.position >= 3) as agendados,\
count(*) filter (where s.position >= 5) as propuestas,\
count(*) filter (where o.status = 'won') as cierres\
from crm.opportunities o\
left join crm.stages s on s.id = o.stage_id\
left join crm.sources so on so.id = o.source_id\
group by so.name;\
\
-- ==========================\
-- 4) Funciones RPC (schema crm)\
-- ==========================\
create or replace function crm.upsert_contact(\
p_first text,\
p_last text,\
p_phone text,\
p_email text,\
p_city text,\
p_source smallint,\
p_owner uuid\
) returns uuid language plpgsql as $$\
declare v_id uuid;\
begin\
select id into v_id from crm.contacts\
where (p_phone is not null and phone = p_phone)\
or (p_email is not null and email = p_email)\
limit 1;\
if v_id is null then\
insert into crm.contacts(first_name,last_name,phone,email,city,source_id,owner)\
values (p_first,p_last,p_phone,p_email,p_city,p_source,p_owner)\
returning id into v_id;\
else\
update crm.contacts\
set first_name = coalesce(p_first, first_name),\
last_name = coalesce(p_last, last_name),\
city = coalesce(p_city, city),\
source_id = coalesce(p_source, source_id),\
owner = coalesce(p_owner, owner)\
where id = v_id;\
end if;\
return v_id;\
end$$;\
\
create or replace function crm.create_opportunity(\
p_contact_id uuid,\
p_interest text,\
p_amount numeric,\
p_source smallint,\
p_owner uuid\
) returns uuid language plpgsql as $$\
declare v_id uuid; v_stage uuid; v_pipeline uuid;\
begin\
select id into v_pipeline from crm.pipelines where is_default = true limit 1;\
select id into v_stage from crm.stages where pipeline_id = v_pipeline and position = 1 limit 1;\
insert into crm.opportunities(contact_id,interest,amount_estimated,source_id,owner,pipeline_id,stage_id,probability)\
values (p_contact_id, p_interest, p_amount, p_source, p_owner, v_pipeline, v_stage, 5)\
returning id into v_id;\
return v_id;\
end$$;\
\
create or replace function crm.advance_stage(\
p_opportunity uuid,\
p_next_stage uuid,\
p_next_step_at timestamptz default null\
) returns void language sql as $$\
update crm.opportunities\
set stage_id = p_next_stage,\
next_step_at = coalesce(p_next_step_at, next_step_at)\
where id = p_opportunity;\
$$;\
\
-- ==========================\
-- 5) Trigger SLA autom\'e1tico\
-- ==========================\
create or replace function crm.trg_create_task_on_stage() returns trigger language plpgsql as $$\
begin\
if (tg_op = 'UPDATE') then\
if new.stage_id is distinct from old.stage_id then\
if exists (select 1 from crm.stages s where s.id=new.stage_id and s.name in ('Agendado','Propuesta')) then\
insert into crm.tasks(owner, contact_id, opportunity_id, title, due_at, priority)\
values (\
new.owner,\
new.contact_id,\
new.id,\
case when (select name from crm.stages where id=new.stage_id)='Agendado'\
then 'Confirmar cita'\
else 'Dar seguimiento a propuesta' end,\
now() + interval '24 hours',\
'normal'\
);\
end if;\
end if;\
end if;\
return new;\
end$$;\
\
drop trigger if exists t_crm_opps_stage_task on crm.opportunities;\
create trigger t_crm_opps_stage_task after update on crm.opportunities\
for each row execute function crm.trg_create_task_on_stage();\
\
-- ==========================\
-- 6) RLS\
-- ==========================\
alter table crm.contacts enable row level security;\
alter table crm.opportunities enable row level security;\
alter table crm.activities enable row level security;\
alter table crm.tasks enable row level security;\
alter table crm.referrals enable row level security;\
\
create or replace function crm.is_admin() returns boolean language sql stable as $$\
select coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)\
$$;\
\
drop policy if exists p_contacts_owner on crm.contacts;\
create policy p_contacts_owner on crm.contacts\
for all using (owner = auth.uid() or crm.is_admin())\
with check (owner = auth.uid() or crm.is_admin());\
\
\
drop policy if exists p_opps_owner on crm.opportunities;\
create policy p_opps_owner on crm.opportunities\
for all using (owner = auth.uid() or crm.is_admin())\
with check (owner = auth.uid() or crm.is_admin());\
\
drop policy if exists p_acts_owner on crm.activities;\
create policy p_acts_owner on crm.activities\
for all using (owner = auth.uid() or crm.is_admin())\
with check (owner = auth.uid() or crm.is_admin());\
\
\
drop policy if exists p_tasks_owner on crm.tasks;\
create policy p_tasks_owner on crm.tasks\
for all using (owner = auth.uid() or crm.is_admin())\
with check (owner = auth.uid() or crm.is_admin());\
\
\
drop policy if exists p_refs_owner on crm.referrals;\
create policy p_refs_owner on crm.referrals\
for all using (\
crm.is_admin() or exists(\
select 1 from crm.contacts c\
where c.id = referrer_contact_id and c.owner = auth.uid()\
)\
)\
with check (true);\
\
-- ==========================\
-- 7) Helper admin por email (opcional)\
-- ==========================\
create or replace function crm.assign_admin(p_email text) returns void language plpgsql security definer as $$\
begin\
update auth.users\
set raw_user_meta_data = coalesce(raw_user_meta_data, '\{\}'::jsonb) || jsonb_build_object('role','admin')\
where email = p_email;\
end$$;\
-- Uso: select crm.assign_admin('carlos@grupotreshermosillo.com');\
\
-- ==========================\
-- 8) Seeds de prueba (opcional)\
-- ==========================\
-- do $$\
-- declare v_owner uuid := auth.uid(); v_contact uuid; v_opp uuid; begin\
-- select crm.upsert_contact('Mar\'eda','P\'e9rez','6140000000','maria@example.com','Chihuahua',2,v_owner) into v_contact;\
-- select crm.create_opportunity(v_contact,'GMM',35000,2,v_owner) into v_opp;\
-- end $$;\
}