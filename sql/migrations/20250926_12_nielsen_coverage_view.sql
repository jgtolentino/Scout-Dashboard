SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name=N'gold') EXEC('CREATE SCHEMA gold');
GO

CREATE OR ALTER VIEW gold.v_nielsen_coverage_summary
AS
WITH prod AS (
  SELECT COUNT(*) AS total_products FROM dbo.Products
), mapped AS (
  SELECT COUNT(DISTINCT product_id) AS mapped_products FROM ref.ProductNielsenMap
), items AS (
  SELECT COUNT(*) AS total_lines FROM dbo.TransactionItems
), items_mapped AS (
  SELECT COUNT(*) AS mapped_lines
  FROM dbo.TransactionItems i
  LEFT JOIN dbo.Products p ON p.product_id=i.product_id
  LEFT JOIN ref.ProductNielsenMap m ON m.product_id=p.product_id
  WHERE m.product_id IS NOT NULL
)
SELECT
  p.total_products,
  m.mapped_products,
  CAST(100.0 * m.mapped_products / NULLIF(p.total_products,0) AS decimal(5,2)) AS product_coverage_pct,
  i.total_lines,
  im.mapped_lines,
  CAST(100.0 * im.mapped_lines / NULLIF(i.total_lines,0) AS decimal(5,2)) AS line_coverage_pct
FROM prod p CROSS JOIN mapped m CROSS JOIN items i CROSS JOIN items_mapped im;
GO