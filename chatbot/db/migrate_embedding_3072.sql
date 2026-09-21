-- ============================================================
-- Откат match_products обратно под vector(768)
-- (колонка embedding в таблице осталась vector(768))
-- ============================================================

DROP FUNCTION IF EXISTS match_products;

CREATE OR REPLACE FUNCTION match_products(
  query_embedding vector(768),
  match_count     int DEFAULT 5
)
RETURNS TABLE (
  id                uuid,
  sku               text,
  name              text,
  category          text,
  specifications    jsonb,
  price             numeric,
  stock_quantity    int,
  reserved_quantity int,
  related_skus      text[],
  similarity        float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    p.id,
    p.sku,
    p.name,
    p.category,
    p.specifications,
    p.price,
    p.stock_quantity,
    p.reserved_quantity,
    p.related_skus,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM products p
  WHERE p.embedding IS NOT NULL
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
$$;

NOTIFY pgrst, 'reload schema';
