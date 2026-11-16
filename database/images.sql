-- Run this whole file in Supabase SQL Editor after adding the JPGs under public/media/rooms.
-- sort_order 0 is the primary photo; sort_order 1 and 2 are gallery photos.

-- Create primary rows when missing, then ensure their local image paths are current.
INSERT INTO public.room_images (room_id, image_url, alt_text_en, sort_order)
SELECT room.id, '/media/rooms/standard-room.jpg', 'Standard room', 0
FROM public.rooms AS room
WHERE room.room_number = '101'
  AND NOT EXISTS (
      SELECT 1 FROM public.room_images AS image
      WHERE image.room_id = room.id AND image.sort_order = 0
  );

INSERT INTO public.room_images (room_id, image_url, alt_text_en, sort_order)
SELECT room.id, '/media/rooms/suite-room.jpg', 'Suite', 0
FROM public.rooms AS room
WHERE room.room_number = '301'
  AND NOT EXISTS (
      SELECT 1 FROM public.room_images AS image
      WHERE image.room_id = room.id AND image.sort_order = 0
  );

INSERT INTO public.room_images (room_id, image_url, alt_text_en, sort_order)
SELECT room.id, '/media/rooms/villa-room.jpg', 'Villa', 0
FROM public.rooms AS room
WHERE room.room_number = 'V01'
  AND NOT EXISTS (
      SELECT 1 FROM public.room_images AS image
      WHERE image.room_id = room.id AND image.sort_order = 0
  );

UPDATE public.room_images AS image
SET image_url = '/media/rooms/standard-room.jpg', alt_text_en = 'Standard room'
FROM public.rooms AS room
WHERE image.room_id = room.id AND room.room_number = '101' AND image.sort_order = 0;

UPDATE public.room_images AS image
SET image_url = '/media/rooms/suite-room.jpg', alt_text_en = 'Suite'
FROM public.rooms AS room
WHERE image.room_id = room.id AND room.room_number = '301' AND image.sort_order = 0;

UPDATE public.room_images AS image
SET image_url = '/media/rooms/villa-room.jpg', alt_text_en = 'Villa'
FROM public.rooms AS room
WHERE image.room_id = room.id AND room.room_number = 'V01' AND image.sort_order = 0;

-- Add the six gallery rows if the corresponding sort_order does not exist yet.
INSERT INTO public.room_images (room_id, image_url, alt_text_en, sort_order)
SELECT room.id, '/media/rooms/standard-room-2.jpg', 'Standard room gallery photo 2', 1
FROM public.rooms AS room
WHERE room.room_number = '101'
  AND NOT EXISTS (
      SELECT 1 FROM public.room_images AS image
      WHERE image.room_id = room.id AND image.sort_order = 1
  );

INSERT INTO public.room_images (room_id, image_url, alt_text_en, sort_order)
SELECT room.id, '/media/rooms/standard-room-3.jpg', 'Standard room gallery photo 3', 2
FROM public.rooms AS room
WHERE room.room_number = '101'
  AND NOT EXISTS (
      SELECT 1 FROM public.room_images AS image
      WHERE image.room_id = room.id AND image.sort_order = 2
  );

INSERT INTO public.room_images (room_id, image_url, alt_text_en, sort_order)
SELECT room.id, '/media/rooms/suite-room-2.jpg', 'Suite gallery photo 2', 1
FROM public.rooms AS room
WHERE room.room_number = '301'
  AND NOT EXISTS (
      SELECT 1 FROM public.room_images AS image
      WHERE image.room_id = room.id AND image.sort_order = 1
  );

INSERT INTO public.room_images (room_id, image_url, alt_text_en, sort_order)
SELECT room.id, '/media/rooms/suite-room-3.jpg', 'Suite gallery photo 3', 2
FROM public.rooms AS room
WHERE room.room_number = '301'
  AND NOT EXISTS (
      SELECT 1 FROM public.room_images AS image
      WHERE image.room_id = room.id AND image.sort_order = 2
  );

INSERT INTO public.room_images (room_id, image_url, alt_text_en, sort_order)
SELECT room.id, '/media/rooms/villa-room-2.jpg', 'Villa gallery photo 2', 1
FROM public.rooms AS room
WHERE room.room_number = 'V01'
  AND NOT EXISTS (
      SELECT 1 FROM public.room_images AS image
      WHERE image.room_id = room.id AND image.sort_order = 1
  );

INSERT INTO public.room_images (room_id, image_url, alt_text_en, sort_order)
SELECT room.id, '/media/rooms/villa-room-3.jpg', 'Villa gallery photo 3', 2
FROM public.rooms AS room
WHERE room.room_number = 'V01'
  AND NOT EXISTS (
      SELECT 1 FROM public.room_images AS image
      WHERE image.room_id = room.id AND image.sort_order = 2
  );
