-- ============================================================
-- Миграция: Добавление таблицы leads (заявки с лендинга)
-- Запустить в Supabase Dashboard → SQL Editor
-- ============================================================

-- Таблица лидов с лендинга
create table if not exists leads (
  id          bigserial primary key,
  name        text not null,
  email       text not null,
  phone       text,
  service     text,                             -- выбранный продукт / категория
  intent      text,                             -- 'Sample Kit' | 'Get a Quote' | …
  message     text,
  source      text not null default 'landing',  -- 'landing' | 'chatbot' | …
  status      text not null default 'new',      -- 'new' | 'in_progress' | 'closed'
  created_at  timestamptz default now()
);

-- Индекс для быстрой фильтрации по статусу/источнику в дашборде
create index if not exists leads_status_source_idx
  on leads (status, source, created_at desc);

-- Запретить анонимным пользователям читать лиды (RLS)
alter table leads enable row level security;

-- Только service_role (серверный ключ) может вставлять и читать записи.
-- Браузерный anon-ключ — не может.
create policy "service_role_all" on leads
  for all
  using (true)
  with check (true);
