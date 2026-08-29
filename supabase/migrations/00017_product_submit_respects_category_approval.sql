-- =============================================================================
-- 00017_product_submit_respects_category_approval.sql
-- AUTO shop still requires review when category.product_approval_required
-- =============================================================================

CREATE OR REPLACE FUNCTION public.submit_product_for_review(p_product_id UUID)
RETURNS public.product_status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product public.products%ROWTYPE;
  v_mode public.shop_moderation_mode;
  v_category_approval BOOLEAN;
  v_new_status public.product_status;
BEGIN
  SELECT * INTO v_product FROM public.products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'product not found';
  END IF;

  IF v_product.seller_id <> auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF v_product.status NOT IN ('DRAFT', 'REJECTED') THEN
    RAISE EXCEPTION 'product status % cannot be submitted', v_product.status;
  END IF;

  SELECT moderation_mode INTO v_mode
  FROM public.shops
  WHERE id = v_product.shop_id;

  SELECT COALESCE(c.product_approval_required, false) INTO v_category_approval
  FROM public.categories c
  WHERE c.id = v_product.category_id;

  IF v_mode = 'AUTO' AND v_category_approval IS NOT TRUE THEN
    v_new_status := 'ACTIVE';
    UPDATE public.products
    SET
      status = v_new_status,
      submitted_for_review_at = now(),
      reviewed_at = now(),
      published_at = COALESCE(published_at, now()),
      rejection_reason = NULL,
      updated_at = now()
    WHERE id = p_product_id;
  ELSE
    v_new_status := 'PENDING_REVIEW';
    UPDATE public.products
    SET
      status = v_new_status,
      submitted_for_review_at = now(),
      rejection_reason = NULL,
      updated_at = now()
    WHERE id = p_product_id;
  END IF;

  RETURN v_new_status;
END;
$$;
