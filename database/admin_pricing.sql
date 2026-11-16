-- Room prices can be edited by server actions; this migration also records
-- booking price snapshots so existing reservations keep their original totals.
ALTER TABLE public.room_types
  ADD COLUMN IF NOT EXISTS name_ru text,
  ADD COLUMN IF NOT EXISTS name_de text;

ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS name_ru text,
  ADD COLUMN IF NOT EXISTS name_de text,
  ADD COLUMN IF NOT EXISTS description_ru text,
  ADD COLUMN IF NOT EXISTS description_de text;

-- Older offers can omit descriptions in the owner form. Public rendering falls
-- back to the English content, while new offers are saved with translated copy.
ALTER TABLE public.offers
  ALTER COLUMN description_en DROP NOT NULL,
  ALTER COLUMN description_ar DROP NOT NULL,
  ALTER COLUMN description_ru DROP NOT NULL,
  ALTER COLUMN description_de DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.offer_room_types (
  offer_id uuid NOT NULL REFERENCES public.offers (id) ON DELETE CASCADE,
  room_type_id uuid NOT NULL REFERENCES public.room_types (id) ON DELETE CASCADE,
  PRIMARY KEY (offer_id, room_type_id)
);

ALTER TABLE public.offer_room_types ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.offer_room_types FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.offer_room_types TO service_role;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS original_price numeric(10, 2),
  ADD COLUMN IF NOT EXISTS discount_amount numeric(10, 2) NOT NULL DEFAULT 0;

UPDATE public.bookings
SET original_price = total_price
WHERE original_price IS NULL;

ALTER TABLE public.bookings
  ALTER COLUMN original_price SET NOT NULL;

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_original_price_nonnegative,
  DROP CONSTRAINT IF EXISTS bookings_discount_amount_nonnegative;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_original_price_nonnegative CHECK (original_price >= 0),
  ADD CONSTRAINT bookings_discount_amount_nonnegative CHECK (discount_amount >= 0);
