-- =============================================================================
-- 00035_guard_users_self_update_admin_roles.sql
-- Allow admins to change other users' roles; block self role changes.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.guard_users_self_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_privileged BOOLEAN :=
    current_setting('role', true) IN ('service_role', 'postgres', 'supabase_admin');
  v_is_self BOOLEAN := (NEW.id = auth.uid());
BEGIN
  -- Service role / DB owners bypass (server-side admin clients).
  IF v_is_privileged THEN
    RETURN NEW;
  END IF;

  -- Nobody may change their own privileged fields (including admins).
  IF v_is_self THEN
    IF NEW.roles IS DISTINCT FROM OLD.roles THEN
      RAISE EXCEPTION 'roles cannot be changed by user';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'status cannot be changed by user';
    END IF;
    IF NEW.archived_at IS DISTINCT FROM OLD.archived_at THEN
      RAISE EXCEPTION 'archived_at cannot be changed by user';
    END IF;
    RETURN NEW;
  END IF;

  -- Updating another user: only admins may change roles / status / archived_at.
  IF NEW.roles IS DISTINCT FROM OLD.roles
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.archived_at IS DISTINCT FROM OLD.archived_at THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'roles cannot be changed by user';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.guard_users_self_update() IS
  'Blocks self-elevation of roles/status/archived_at; admins may change other users.';
