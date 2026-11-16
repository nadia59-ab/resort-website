-- Anonymous access rules for the resort website.
-- Review this file before running it in Supabase. This file is not run by the app.

BEGIN;

-- Enable row-level security on every table declared in schema.sql.
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Remove anonymous table permissions first, then grant read-only access to
-- the three public content tables below.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.room_types, public.experiences, public.offers TO anon;

-- Remove and recreate this script's policies so it can be applied again.
DROP POLICY IF EXISTS room_types_anon_select ON public.room_types;
DROP POLICY IF EXISTS room_types_anon_select_limit ON public.room_types;
DROP POLICY IF EXISTS experiences_anon_select_active ON public.experiences;
DROP POLICY IF EXISTS experiences_anon_select_active_limit ON public.experiences;
DROP POLICY IF EXISTS offers_anon_select_active ON public.offers;
DROP POLICY IF EXISTS offers_anon_select_active_limit ON public.offers;

-- Room type information is public.
CREATE POLICY room_types_anon_select
    ON public.room_types
    FOR SELECT
    TO anon
    USING (true);

-- Anonymous users can read only active experiences.
CREATE POLICY experiences_anon_select_active
    ON public.experiences
    FOR SELECT
    TO anon
    USING (is_active = true);

-- Anonymous users can read only active offers.
CREATE POLICY offers_anon_select_active
    ON public.offers
    FOR SELECT
    TO anon
    USING (is_active = true);

-- Restrictive filters keep any other permissive SELECT policy from exposing
-- inactive experiences or offers to anonymous users.
CREATE POLICY experiences_anon_select_active_limit
    ON public.experiences
    AS RESTRICTIVE
    FOR SELECT
    TO anon
    USING (is_active = true);

CREATE POLICY offers_anon_select_active_limit
    ON public.offers
    AS RESTRICTIVE
    FOR SELECT
    TO anon
    USING (is_active = true);

COMMIT;
