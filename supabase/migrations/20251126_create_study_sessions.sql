create table if not exists study_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  duration integer not null, -- in seconds
  subject text,
  created_at timestamptz default now()
);

alter table study_sessions enable row level security;

create policy "Users can insert their own study sessions"
  on study_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own study sessions"
  on study_sessions for select
  using (auth.uid() = user_id);
