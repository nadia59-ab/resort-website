-- Example catalog data for the Red Sea beach resort.
-- This seed inserts 3 room types, 10 rooms, 5 experiences, and 2 offers.

INSERT INTO room_types (id, name_en, name_ar, description_en, description_ar, base_price, currency, max_guests)
VALUES
    ('10000000-0000-4000-8000-000000000001', 'Standard', 'قياسية', 'Comfortable room for a relaxing resort stay.', 'غرفة مريحة لإقامة هادئة في المنتجع.', 120.00, 'USD', 2),
    ('10000000-0000-4000-8000-000000000002', 'Suite', 'جناح', 'Spacious suite with a separate sitting area.', 'جناح واسع مع منطقة جلوس منفصلة.', 240.00, 'USD', 4),
    ('10000000-0000-4000-8000-000000000003', 'Villa', 'فيلا', 'Private villa with generous indoor and outdoor space.', 'فيلا خاصة بمساحات داخلية وخارجية واسعة.', 420.00, 'USD', 6);

INSERT INTO rooms (id, room_type_id, room_number, floor_number, view_en, view_ar)
VALUES
    ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '101', 1, 'Garden view', 'إطلالة على الحديقة'),
    ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '102', 1, 'Pool view', 'إطلالة على المسبح'),
    ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '103', 1, 'Sea view', 'إطلالة على البحر'),
    ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', '201', 2, 'Garden view', 'إطلالة على الحديقة'),
    ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000002', '301', 3, 'Sea view', 'إطلالة على البحر'),
    ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000002', '302', 3, 'Sea view', 'إطلالة على البحر'),
    ('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000002', '401', 4, 'Garden view', 'إطلالة على الحديقة'),
    ('20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000003', 'V01', 0, 'Private beach view', 'إطلالة على الشاطئ الخاص'),
    ('20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000003', 'V02', 0, 'Sea view', 'إطلالة على البحر'),
    ('20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000003', 'V03', 0, 'Garden view', 'إطلالة على الحديقة');

INSERT INTO experiences (id, name_en, name_ar, description_en, description_ar, price, currency, duration_minutes)
VALUES
    ('30000000-0000-4000-8000-000000000001', 'Red Sea Snorkeling', 'الغطس في البحر الأحمر', 'Explore colorful reefs with a local guide.', 'اكتشف الشعاب المرجانية الملونة برفقة مرشد محلي.', 45.00, 'USD', 180),
    ('30000000-0000-4000-8000-000000000002', 'Sunset Boat Cruise', 'رحلة بحرية وقت الغروب', 'Enjoy a relaxed cruise along the coast at sunset.', 'استمتع برحلة بحرية هادئة على طول الساحل وقت الغروب.', 65.00, 'USD', 120),
    ('30000000-0000-4000-8000-000000000003', 'Desert Safari', 'سفاري الصحراء', 'Ride across the desert and visit a Bedouin camp.', 'انطلق عبر الصحراء وزر مخيماً بدوياً.', 80.00, 'USD', 240),
    ('30000000-0000-4000-8000-000000000004', 'Scuba Diving Intro', 'مقدمة في الغوص', 'Try a guided introductory dive with an instructor.', 'جرّب غوصاً تمهيدياً بإشراف مدرب.', 95.00, 'USD', 150),
    ('30000000-0000-4000-8000-000000000005', 'Beachside Dinner', 'عشاء على الشاطئ', 'Share a seafood dinner beside the Red Sea.', 'استمتع بعشاء من المأكولات البحرية بجوار البحر الأحمر.', 110.00, 'USD', 120);

INSERT INTO offers (id, name_en, name_ar, description_en, description_ar, discount_type, discount_value, currency, starts_at, ends_at)
VALUES
    ('40000000-0000-4000-8000-000000000001', 'Early Escape', 'إقامة مبكرة', 'Save 15 percent on an eligible resort stay.', 'وفّر ١٥٪ على الإقامة المؤهلة في المنتجع.', 'percentage', 15.00, 'USD', '2026-01-01 00:00:00+00', '2027-01-01 00:00:00+00'),
    ('40000000-0000-4000-8000-000000000002', 'Sea Week Credit', 'رصيد أسبوع البحر', 'Get 50 USD off an eligible booking.', 'احصل على خصم بقيمة ٥٠ دولاراً على الحجز المؤهل.', 'fixed', 50.00, 'USD', '2026-01-01 00:00:00+00', '2027-01-01 00:00:00+00');
