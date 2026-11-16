-- Database schema for a Red Sea beach resort booking website.
-- Run this in the Supabase SQL editor or with a PostgreSQL client.

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Room categories such as standard, suite, and villa.
CREATE TABLE room_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en text NOT NULL,
    name_ar text NOT NULL,
    description_en text NOT NULL,
    description_ar text NOT NULL,
    base_price numeric(10, 2) NOT NULL CHECK (base_price >= 0),
    currency text NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
    max_guests integer NOT NULL CHECK (max_guests > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Individual rooms guests can reserve.
CREATE TABLE rooms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_type_id uuid NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT,
    room_number text NOT NULL UNIQUE,
    floor_number integer,
    view_en text,
    view_ar text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Photos belonging to a room, stored as public or signed storage URLs.
CREATE TABLE room_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    image_url text NOT NULL,
    alt_text_en text,
    alt_text_ar text,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Contact details for people who make bookings.
CREATE TABLE guests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL UNIQUE,
    phone text,
    country text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- A guest's stay in one room; overlapping active stays in the same room are blocked below.
CREATE TABLE bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id uuid NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
    room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    offer_id uuid,
    check_in date NOT NULL,
    check_out date NOT NULL,
    status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    guests_count integer NOT NULL DEFAULT 1 CHECK (guests_count > 0),
    original_price numeric(10, 2) NOT NULL CHECK (original_price >= 0),
    discount_amount numeric(10, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    total_price numeric(10, 2) NOT NULL CHECK (total_price >= 0),
    currency text NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
    special_requests text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT bookings_valid_dates CHECK (check_out > check_in),
    CONSTRAINT bookings_no_room_date_overlap
        EXCLUDE USING gist (
            room_id WITH =,
            daterange(check_in, check_out, '[)') WITH &&
        ) WHERE (status IN ('pending', 'confirmed'))
);

-- Payments recorded against a booking.
CREATE TABLE payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount numeric(10, 2) NOT NULL CHECK (amount >= 0),
    currency text NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
    status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_method text,
    provider_reference text,
    paid_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Activities guests can add to their resort stay.
CREATE TABLE experiences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en text NOT NULL,
    name_ar text NOT NULL,
    description_en text NOT NULL,
    description_ar text NOT NULL,
    price numeric(10, 2) NOT NULL CHECK (price >= 0),
    currency text NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
    duration_minutes integer CHECK (duration_minutes > 0),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Discount offers guests may use when booking.
CREATE TABLE offers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en text NOT NULL,
    name_ar text NOT NULL,
    name_ru text,
    name_de text,
    description_en text NOT NULL,
    description_ar text NOT NULL,
    description_ru text,
    description_de text,
    discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value numeric(10, 2) NOT NULL CHECK (discount_value > 0),
    currency text NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
    starts_at timestamptz NOT NULL,
    ends_at timestamptz NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT offers_valid_dates CHECK (ends_at > starts_at),
    CONSTRAINT offers_percentage_range CHECK (discount_type <> 'percentage' OR discount_value <= 100)
);

-- Optional room restrictions for an offer. No rows means it applies to all room types.
CREATE TABLE offer_room_types (
    offer_id uuid NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    room_type_id uuid NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
    PRIMARY KEY (offer_id, room_type_id)
);

-- Experiences selected for a particular booking, including quantity and price at booking time.
CREATE TABLE booking_experiences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    experience_id uuid NOT NULL REFERENCES experiences(id) ON DELETE RESTRICT,
    quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price numeric(10, 2) NOT NULL CHECK (unit_price >= 0),
    currency text NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT booking_experiences_unique UNIQUE (booking_id, experience_id)
);

-- Guest feedback and ratings for completed stays.
CREATE TABLE reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    guest_id uuid NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
    rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title_en text,
    title_ar text,
    body_en text NOT NULL,
    body_ar text NOT NULL,
    is_published boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Resort staff accounts that can administer the booking website.
CREATE TABLE admins (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name text NOT NULL,
    email text NOT NULL UNIQUE,
    auth_user_id uuid UNIQUE,
    role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'manager')),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add the booking-to-offer foreign key after both tables exist.
ALTER TABLE bookings
    ADD CONSTRAINT bookings_offer_id_fkey
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE SET NULL;

CREATE INDEX rooms_room_type_id_idx ON rooms(room_type_id);
CREATE INDEX room_images_room_id_idx ON room_images(room_id);
CREATE INDEX bookings_guest_id_idx ON bookings(guest_id);
CREATE INDEX bookings_room_id_idx ON bookings(room_id);
CREATE INDEX payments_booking_id_idx ON payments(booking_id);
CREATE INDEX booking_experiences_experience_id_idx ON booking_experiences(experience_id);
