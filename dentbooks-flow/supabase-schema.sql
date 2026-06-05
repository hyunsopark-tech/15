-- DentBooks Flow — Supabase Schema
-- Paste this into Supabase SQL Editor and click Run

create table if not exists staff (
  id text primary key,
  name text not null,
  role text not null,
  color text not null,
  initials text not null,
  position integer not null default 0
);

create table if not exists patients (
  id text primary key,
  workflow text not null,
  data text not null
);
create index if not exists idx_patients_workflow on patients(workflow);

create table if not exists activity_log (
  id text primary key,
  staff_id text not null,
  date text not null,
  type text not null,
  description text not null,
  time_label text not null
);
create index if not exists idx_activity_staff_date on activity_log(staff_id, date);

create table if not exists completed_patients (
  patient_id text primary key
);

create table if not exists sop_blocks (
  id text primary key,
  title text not null,
  body text not null,
  position integer not null default 0
);

create table if not exists insurance_blocks (
  id text primary key,
  title text not null,
  body text not null,
  position integer not null default 0
);

create table if not exists custom_qa (
  id text primary key,
  data text not null
);

create table if not exists qa_overrides (
  qa_id text primary key,
  answer text not null
);

-- Disable RLS on all tables (private internal app, no end-user auth)
alter table staff disable row level security;
alter table patients disable row level security;
alter table activity_log disable row level security;
alter table completed_patients disable row level security;
alter table sop_blocks disable row level security;
alter table insurance_blocks disable row level security;
alter table custom_qa disable row level security;
alter table qa_overrides disable row level security;
