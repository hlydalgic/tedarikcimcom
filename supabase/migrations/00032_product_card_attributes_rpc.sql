-- Batch fetch show_on_card attribute values for product listing cards

CREATE OR REPLACE FUNCTION public.get_product_card_attributes(p_product_ids UUID[])
RETURNS TABLE (
  product_id UUID,
  attribute_name TEXT,
  display_value TEXT,
  sort_order INT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    pav.product_id,
    a.name AS attribute_name,
    CASE a.type
      WHEN 'BOOLEAN' THEN CASE WHEN pav.value_boolean THEN 'Evet' ELSE 'Hayır' END
      WHEN 'NUMBER' THEN TRIM(TRAILING '.' FROM TRIM(TRAILING '0' FROM pav.value_number::TEXT))
      WHEN 'NUMBER_WITH_UNIT' THEN
        TRIM(TRAILING '.' FROM TRIM(TRAILING '0' FROM pav.value_number::TEXT))
        || COALESCE(' ' || u.symbol, '')
      WHEN 'RANGE' THEN
        COALESCE(pav.value_json ->> 'min', '') || ' – ' || COALESCE(pav.value_json ->> 'max', '')
      WHEN 'SELECT' THEN ao.label
      WHEN 'MULTI_SELECT' THEN (
        SELECT string_agg(mo.label, ', ' ORDER BY mo.sort_order)
        FROM public.attribute_options mo
        WHERE mo.id = ANY (
          ARRAY(
            SELECT jsonb_array_elements_text(pav.value_json -> 'option_ids')::UUID
          )
        )
      )
      WHEN 'COLOR' THEN COALESCE(ao.label, pav.value_text)
      WHEN 'DATE' THEN to_char(pav.value_text::DATE, 'DD.MM.YYYY')
      WHEN 'YEAR' THEN pav.value_number::TEXT
      ELSE COALESCE(pav.value_text, ao.label)
    END AS display_value,
    a.sort_order
  FROM public.product_attribute_values pav
  JOIN public.attributes a ON a.id = pav.attribute_id
    AND a.status = 'active'
    AND a.archived_at IS NULL
    AND a.show_on_card = true
  JOIN public.products p ON p.id = pav.product_id
    AND p.status = 'ACTIVE'
    AND p.archived_at IS NULL
  LEFT JOIN public.units u ON u.id = a.unit_id
  LEFT JOIN public.attribute_options ao ON ao.id = pav.value_option_id
  WHERE pav.product_id = ANY(p_product_ids)
    AND (
      CASE a.type
        WHEN 'BOOLEAN' THEN pav.value_boolean IS NOT NULL
        WHEN 'NUMBER' THEN pav.value_number IS NOT NULL
        WHEN 'NUMBER_WITH_UNIT' THEN pav.value_number IS NOT NULL
        WHEN 'RANGE' THEN pav.value_json IS NOT NULL
        WHEN 'SELECT' THEN pav.value_option_id IS NOT NULL
        WHEN 'MULTI_SELECT' THEN pav.value_json IS NOT NULL
        WHEN 'COLOR' THEN pav.value_option_id IS NOT NULL OR pav.value_text IS NOT NULL
        WHEN 'DATE' THEN pav.value_text IS NOT NULL
        WHEN 'YEAR' THEN pav.value_number IS NOT NULL
        ELSE pav.value_text IS NOT NULL OR pav.value_option_id IS NOT NULL
      END
    )
  ORDER BY pav.product_id, a.sort_order, a.name;
$$;

GRANT EXECUTE ON FUNCTION public.get_product_card_attributes(UUID[])
  TO anon, authenticated, service_role;
