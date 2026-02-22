--1 users table
create table public.users (
  id uuid not null,
  avatar_url text null,
  user_id text null,
  token_identifier text not null,
  image text null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null,
  email text null,
  name text null,
  full_name text null,
  user_xp integer not null default 0,
  quest_preference text[] null,
  bio text null,
  website text null,
  notifications_enabled boolean null default true,
  constraint users_pkey primary key (id),
  constraint users_user_id_key unique (user_id),
  constraint users_name_not_empty check (
    (
      (name is null)
      or (
        length(
          TRIM(
            both
            from
              name
          )
        ) > 0
      )
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists users_name_unique on public.users using btree (name) TABLESPACE pg_default
where
  (name is not null);

create trigger trg_protect_username BEFORE
update on users for EACH row
execute FUNCTION protect_username ();

--2 user_surveys table
create table public.user_surveys (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  field_id uuid null,
  created_at timestamp with time zone null default now(),
  skill text not null,
  score integer not null,
  constraint user_surveys_pkey primary key (id),
  constraint user_surveys_field_id_fkey foreign KEY (field_id) references fields (id) on delete CASCADE,
  constraint user_surveys_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint user_surveys_score_check check (
    (
      (score >= 0)
      and (score <= 100)
    )
  )
) TABLESPACE pg_default;

--3 user_quest_progress
create table public.user_quest_progress (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  quest_id uuid null,
  progress integer not null default 0,
  completed boolean not null default false,
  completed_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  constraint user_quest_progress_pkey primary key (id),
  constraint uq_user_quest unique (user_id, quest_id),
  constraint user_quest_progress_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_quest_progress_quest_id on public.user_quest_progress using btree (quest_id) TABLESPACE pg_default;

create index IF not exists idx_user_quest_progress_user_id on public.user_quest_progress using btree (user_id) TABLESPACE pg_default;

--4 user_module_quest_progress
create table public.user_module_quest_progress (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  module_quest_template_id uuid not null,
  completed boolean not null default false,
  completed_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  constraint user_module_quest_progress_pkey primary key (id),
  constraint uq_user_module_quest unique (user_id, module_quest_template_id),
  constraint user_module_quest_template_id_fkey foreign KEY (module_quest_template_id) references module_quest_templates (id) on delete CASCADE,
  constraint user_module_quest_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_umqp_user_id on public.user_module_quest_progress using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_umqp_template_id on public.user_module_quest_progress using btree (module_quest_template_id) TABLESPACE pg_default;

create index IF not exists idx_umqp_completed on public.user_module_quest_progress using btree (completed) TABLESPACE pg_default
where
  (completed = true);

-- 5 user_levels
create table public.user_levels (
  level integer not null,
  xp_required integer not null,
  constraint user_levels_pkey primary key (level)
) TABLESPACE pg_default;

-- 6 user_global_progress
create table public.user_global_progress (
  user_id uuid not null,
  global_xp integer not null default 0,
  global_level integer not null default 1,
  league text not null default 'bronze'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_global_progress_pkey primary key (user_id),
  constraint user_global_progress_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

--7 user_follows
create table public.user_follows (
  follower_id uuid not null,
  following_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint user_follows_pkey primary key (follower_id, following_id),
  constraint user_follows_follower_id_fkey foreign KEY (follower_id) references users (id) on delete CASCADE,
  constraint user_follows_following_id_fkey foreign KEY (following_id) references users (id) on delete CASCADE,
  constraint no_self_follow check ((follower_id <> following_id))
) TABLESPACE pg_default;

--8 user_field_progress
create table public.user_field_progress (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  field_id uuid null,
  field_xp integer not null default 0,
  field_level integer not null default 1,
  unlocked boolean not null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_field_progress_pkey primary key (id),
  constraint user_field_progress_user_id_field_id_key unique (user_id, field_id),
  constraint user_field_progress_field_id_fkey foreign KEY (field_id) references fields (id) on delete CASCADE,
  constraint user_field_progress_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

--9 todos
create table public.todos (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  date date not null,
  text text not null,
  color text not null,
  completed boolean null default false,
  created_at timestamp without time zone null default now(),
  constraint todos_pkey primary key (id),
  constraint todos_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

--10 subscriptions
create table public.subscriptions (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  stripe_customer_id text null,
  stripe_subscription_id text null,
  status text null,
  plan_name text null,
  current_period_end timestamp with time zone null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null,
  constraint subscriptions_pkey primary key (id),
  constraint subscriptions_user_id_fkey foreign KEY (user_id) references users (id)
) TABLESPACE pg_default;

--11 sub_modules
create table public.sub_modules (
  id uuid not null default gen_random_uuid (),
  module_id uuid null,
  title text not null,
  description text null,
  order_index integer not null,
  unlock_field_level integer not null,
  created_at timestamp with time zone null default now(),
  constraint sub_modules_pkey primary key (id),
  constraint sub_modules_module_id_fkey foreign KEY (module_id) references modules (id) on delete CASCADE
) TABLESPACE pg_default;

--12 quests 
create table public.quests (
  id uuid not null default extensions.uuid_generate_v4 (),
  title text not null,
  description text not null,
  type text not null,
  xp_reward integer not null,
  deadline timestamp with time zone not null,
  created_at timestamp with time zone null default now(),
  is_active boolean null default true,
  user_id uuid null,
  progress integer null default 0,
  difficulty text null,
  status text null default 'active'::text,
  penalty_for_quest_id uuid null,
  quest_set_id uuid null,
  for_date date null,
  field_id uuid null,
  module_id uuid null,
  template_id uuid null,
  quest_category text null default 'side'::text,
  sub_module_id uuid null,
  is_mandatory boolean null default false,
  constraint quests_pkey primary key (id),
  constraint quests_module_id_fkey foreign KEY (module_id) references modules (id),
  constraint quests_penalty_for_quest_id_fkey foreign KEY (penalty_for_quest_id) references quests (id),
  constraint quests_field_id_fkey foreign KEY (field_id) references fields (id),
  constraint quests_user_id_fkey foreign KEY (user_id) references auth.users (id),
  constraint quests_quest_set_id_fkey foreign KEY (quest_set_id) references quest_sets (id),
  constraint quests_sub_module_id_fkey foreign KEY (sub_module_id) references sub_modules (id),
  constraint quests_template_id_fkey foreign KEY (template_id) references module_quest_templates (id),
  constraint quests_quest_category_check check (
    (
      quest_category = any (array['core'::text, 'side'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_quests_deadline on public.quests using btree (deadline) TABLESPACE pg_default;

create index IF not exists idx_quests_quest_set_id on public.quests using btree (quest_set_id) TABLESPACE pg_default;

create index IF not exists idx_quests_status on public.quests using btree (status) TABLESPACE pg_default;

create index IF not exists idx_quests_type on public.quests using btree (type) TABLESPACE pg_default;

create index IF not exists idx_quests_user_id on public.quests using btree (user_id) TABLESPACE pg_default;

create index IF not exists quests_user_id_idx on public.quests using btree (user_id) TABLESPACE pg_default;

--13 quest_sets
create table public.quest_sets (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint quest_sets_pkey primary key (id),
  constraint quest_sets_user_id_fkey foreign KEY (user_id) references users (id)
) TABLESPACE pg_default;

--14 modules
create table public.modules (
  id uuid not null default gen_random_uuid (),
  field_id uuid null,
  skill text not null,
  difficulty integer not null,
  unlock_field_level integer not null,
  description text null,
  created_at timestamp with time zone null default now(),
  constraint modules_pkey primary key (id),
  constraint modules_field_id_fkey foreign KEY (field_id) references fields (id) on delete CASCADE,
  constraint modules_difficulty_check check (
    (
      (difficulty >= 1)
      and (difficulty <= 10)
    )
  )
) TABLESPACE pg_default;

--15 module_quest_templates
create table public.module_quest_templates (
  id uuid not null default gen_random_uuid (),
  module_id uuid null,
  template_text text not null,
  base_xp integer not null default 10,
  created_at timestamp with time zone null default now(),
  title text not null default 'Untitled Quest'::text,
  description text not null default ''::text,
  xp_reward integer not null default 10,
  sub_module_id uuid null,
  constraint module_quest_templates_pkey primary key (id),
  constraint module_quest_templates_module_id_fkey foreign KEY (module_id) references modules (id) on delete CASCADE,
  constraint module_quest_templates_sub_module_id_fkey foreign KEY (sub_module_id) references sub_modules (id) on delete CASCADE
) TABLESPACE pg_default;

--16 journal_entries
create table public.journal_entries (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  content text not null,
  summary text null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint journal_entries_pkey primary key (id),
  constraint journal_entries_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists journal_entries_created_at_idx on public.journal_entries using btree (created_at) TABLESPACE pg_default;

create index IF not exists journal_entries_user_id_idx on public.journal_entries using btree (user_id) TABLESPACE pg_default;

--17 fields
create table public.fields (
  id uuid not null default gen_random_uuid (),
  slug text not null,
  name text not null,
  unlock_global_level integer not null,
  description text null,
  created_at timestamp with time zone null default now(),
  constraint fields_pkey primary key (id),
  constraint fields_slug_key unique (slug)
) TABLESPACE pg_default;

--18 daily_prompts
create table public.daily_prompts (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  prompt text not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  used_at timestamp with time zone null,
  is_favorite boolean null default false,
  constraint daily_prompts_pkey primary key (id),
  constraint daily_prompts_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists daily_prompts_created_at_idx on public.daily_prompts using btree (created_at) TABLESPACE pg_default;

create index IF not exists daily_prompts_user_id_idx on public.daily_prompts using btree (user_id) TABLESPACE pg_default;

--19 chat_messages
create table public.chat_messages (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  content text not null,
  response text not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint chat_messages_pkey primary key (id),
  constraint unique_message_per_user unique (user_id, content),
  constraint chat_messages_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists chat_messages_created_at_idx on public.chat_messages using btree (created_at) TABLESPACE pg_default;

create index IF not exists chat_messages_user_id_idx on public.chat_messages using btree (user_id) TABLESPACE pg_default;

--20 user_learning_paths
-- 1️⃣ User Learning Paths
create table public.user_learning_paths (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  field_id uuid not null references fields(id) on delete cascade,
  title text not null,
  description text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_user_learning_paths_user_id
on public.user_learning_paths(user_id);

create index idx_user_learning_paths_field_id
on public.user_learning_paths(field_id);


-- 2️⃣ User Learning Quests
create table public.user_learning_quests (
  id uuid primary key default gen_random_uuid(),
  learning_path_id uuid not null references user_learning_paths(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  field_id uuid not null references fields(id) on delete cascade,
  title text not null,
  description text null,
  xp_reward integer not null check (xp_reward > 0),
  completed boolean default false,
  completed_at timestamptz null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_user_learning_quests_user_id
on public.user_learning_quests(user_id);

create index idx_user_learning_quests_learning_path
on public.user_learning_quests(learning_path_id);

create index idx_user_learning_quests_field_id
on public.user_learning_quests(field_id);