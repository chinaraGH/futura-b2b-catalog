-- ============================================================
-- Futura Chatbot — Supabase DDL
-- Запустить один раз в SQL Editor вашего проекта Supabase
-- ============================================================

-- 1. Расширение для векторного поиска
create extension if not exists vector;

-- ============================================================
-- 2. Клиенты
-- ============================================================
create table if not exists clients (
  id           uuid primary key default gen_random_uuid(),
  platform     text not null,          -- 'web' | 'telegram' | 'vk'
  external_id  text not null,          -- user_id в платформе или sessionId
  qr_source    text,                   -- 'box_scan' если пришёл с QR
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique (platform, external_id)
);

-- ============================================================
-- 3. История диалога
-- ============================================================
create table if not exists interactions (
  id           bigserial primary key,
  session_id   text not null,          -- platform:external_id
  role         text not null,          -- 'user' | 'model'
  content      text not null,
  created_at   timestamptz default now()
);

create index if not exists interactions_session_created
  on interactions (session_id, created_at desc);

-- ============================================================
-- 4. Продукты с векторным эмбеддингом
-- ============================================================
create table if not exists products (
  id               bigserial primary key,
  sku              text unique not null,
  name             text not null,
  description      text,
  price            numeric(10,2),
  stock_quantity   int default 0,
  reserved_quantity int default 0,
  related_skus     text[],             -- SKU крепежа / аксессуаров
  embedding        vector(768),        -- text-embedding-004
  created_at       timestamptz default now()
);

create index if not exists products_embedding_idx
  on products using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ============================================================
-- 5. Рекламации / отзывы
-- ============================================================
create table if not exists reviews (
  id            bigserial primary key,
  session_id    text not null,
  order_number  text,
  batch_number  text,
  defect_desc   text,
  photo_url     text,
  status        text default 'new',   -- 'new' | 'in_progress' | 'resolved'
  created_at    timestamptz default now()
);

-- ============================================================
-- 6. Хранимая процедура резервирования (атомарная)
-- ============================================================
create or replace function reserve_product(
  p_sku       text,
  p_qty       int,
  p_client_id uuid
)
returns json
language plpgsql
as $$
declare
  v_product  products%rowtype;
  v_avail    int;
begin
  -- Блокируем строку
  select * into v_product
    from products
   where sku = p_sku
     for update;

  if not found then
    return json_build_object('success', false, 'error', 'SKU не найден');
  end if;

  v_avail := v_product.stock_quantity - v_product.reserved_quantity;

  if v_avail < p_qty then
    return json_build_object(
      'success', false,
      'error', 'Недостаточно остатка',
      'available', v_avail
    );
  end if;

  update products
     set reserved_quantity = reserved_quantity + p_qty
   where sku = p_sku;

  return json_build_object(
    'success', true,
    'sku', p_sku,
    'reserved', p_qty,
    'remaining', v_avail - p_qty
  );
end;
$$;

-- ============================================================
-- 7. RPC для векторного поиска
-- ============================================================
create or replace function match_products(
  query_embedding vector(768),
  match_count     int default 5
)
returns table (
  id          bigint,
  sku         text,
  name        text,
  description text,
  price       numeric,
  stock_quantity   int,
  reserved_quantity int,
  related_skus text[],
  similarity  float
)
language sql stable
as $$
  select
    p.id,
    p.sku,
    p.name,
    p.description,
    p.price,
    p.stock_quantity,
    p.reserved_quantity,
    p.related_skus,
    1 - (p.embedding <=> query_embedding) as similarity
  from products p
  where p.embedding is not null
  order by p.embedding <=> query_embedding
  limit match_count;
$$;

-- ============================================================
-- 8. Лиды с лендинга (заявки через веб-форму)
-- ============================================================
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
