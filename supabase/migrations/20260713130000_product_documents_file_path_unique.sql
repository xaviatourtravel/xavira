-- Ensure one Storage object path maps to at most one product_documents row.

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY file_path
      ORDER BY created_at ASC, id ASC
    ) AS row_num
  FROM public.product_documents
  WHERE file_path IS NOT NULL
)
DELETE FROM public.product_documents AS pd
USING ranked AS r
WHERE pd.id = r.id
  AND r.row_num > 1;

CREATE UNIQUE INDEX IF NOT EXISTS product_documents_file_path_unique_idx
  ON public.product_documents (file_path)
  WHERE file_path IS NOT NULL;
