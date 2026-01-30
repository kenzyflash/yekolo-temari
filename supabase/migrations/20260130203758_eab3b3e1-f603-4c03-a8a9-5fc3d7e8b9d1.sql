-- Prevent audit log modifications - ensure log immutability
-- This prevents even admins from tampering with security records

CREATE POLICY "Prevent audit log modifications"
ON public.audit_logs
AS RESTRICTIVE
FOR UPDATE
USING (false);

CREATE POLICY "Prevent audit log deletion"
ON public.audit_logs
AS RESTRICTIVE
FOR DELETE
USING (false);