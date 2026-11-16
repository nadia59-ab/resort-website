-- Add Russian and German catalog translations using the existing language-column pattern.
-- Safe to run more than once. Missing values remain NULL and fall back to English in the app.

ALTER TABLE public.room_types
    ADD COLUMN IF NOT EXISTS name_ru text,
    ADD COLUMN IF NOT EXISTS description_ru text,
    ADD COLUMN IF NOT EXISTS name_de text,
    ADD COLUMN IF NOT EXISTS description_de text;

ALTER TABLE public.experiences
    ADD COLUMN IF NOT EXISTS name_ru text,
    ADD COLUMN IF NOT EXISTS description_ru text,
    ADD COLUMN IF NOT EXISTS name_de text,
    ADD COLUMN IF NOT EXISTS description_de text;

ALTER TABLE public.offers
    ADD COLUMN IF NOT EXISTS name_ru text,
    ADD COLUMN IF NOT EXISTS description_ru text,
    ADD COLUMN IF NOT EXISTS name_de text,
    ADD COLUMN IF NOT EXISTS description_de text;

UPDATE public.room_types
SET name_ru = COALESCE(name_ru, 'Стандартный номер'),
    description_ru = COALESCE(description_ru, 'Уютный номер для спокойного отдыха на курорте.'),
    name_de = COALESCE(name_de, 'Standardzimmer'),
    description_de = COALESCE(description_de, 'Komfortables Zimmer für einen erholsamen Aufenthalt im Resort.')
WHERE name_en = 'Standard';

UPDATE public.room_types
SET name_ru = COALESCE(name_ru, 'Люкс'),
    description_ru = COALESCE(description_ru, 'Просторный люкс с отдельной гостиной зоной.'),
    name_de = COALESCE(name_de, 'Suite'),
    description_de = COALESCE(description_de, 'Großzügige Suite mit separatem Wohnbereich.')
WHERE name_en = 'Suite';

UPDATE public.room_types
SET name_ru = COALESCE(name_ru, 'Вилла'),
    description_ru = COALESCE(description_ru, 'Уединённая вилла с просторными внутренними и открытыми зонами.'),
    name_de = COALESCE(name_de, 'Villa'),
    description_de = COALESCE(description_de, 'Private Villa mit großzügigem Innen- und Außenbereich.')
WHERE name_en = 'Villa';

UPDATE public.experiences
SET name_ru = COALESCE(name_ru, 'Снорклинг в Красном море'),
    description_ru = COALESCE(description_ru, 'Исследуйте яркие коралловые рифы вместе с местным гидом.'),
    name_de = COALESCE(name_de, 'Schnorcheln im Roten Meer'),
    description_de = COALESCE(description_de, 'Entdecken Sie farbenprächtige Riffe mit einem ortskundigen Guide.')
WHERE name_en = 'Red Sea Snorkeling';

UPDATE public.experiences
SET name_ru = COALESCE(name_ru, 'Морская прогулка на закате'),
    description_ru = COALESCE(description_ru, 'Отправьтесь в спокойный круиз вдоль побережья на закате.'),
    name_de = COALESCE(name_de, 'Bootsfahrt bei Sonnenuntergang'),
    description_de = COALESCE(description_de, 'Genießen Sie eine entspannte Fahrt entlang der Küste bei Sonnenuntergang.')
WHERE name_en = 'Sunset Boat Cruise';

UPDATE public.experiences
SET name_ru = COALESCE(name_ru, 'Сафари по пустыне'),
    description_ru = COALESCE(description_ru, 'Пересеките пустыню и загляните в бедуинский лагерь.'),
    name_de = COALESCE(name_de, 'Wüstensafari'),
    description_de = COALESCE(description_de, 'Erkunden Sie die Wüste und besuchen Sie ein Beduinencamp.')
WHERE name_en = 'Desert Safari';

UPDATE public.experiences
SET name_ru = COALESCE(name_ru, 'Первое погружение с аквалангом'),
    description_ru = COALESCE(description_ru, 'Попробуйте первое погружение с инструктором.'),
    name_de = COALESCE(name_de, 'Einführung ins Tauchen'),
    description_de = COALESCE(description_de, 'Erleben Sie einen geführten ersten Tauchgang mit einem Tauchlehrer.')
WHERE name_en = 'Scuba Diving Intro';

UPDATE public.experiences
SET name_ru = COALESCE(name_ru, 'Ужин у моря'),
    description_ru = COALESCE(description_ru, 'Разделите ужин из морепродуктов на берегу Красного моря.'),
    name_de = COALESCE(name_de, 'Abendessen am Meer'),
    description_de = COALESCE(description_de, 'Genießen Sie ein Abendessen mit Meeresfrüchten direkt am Roten Meer.')
WHERE name_en = 'Beachside Dinner';

UPDATE public.offers
SET name_ru = COALESCE(name_ru, 'Ранний отдых'),
    description_ru = COALESCE(description_ru, 'Сэкономьте 15 % на проживании при выполнении условий предложения.'),
    name_de = COALESCE(name_de, 'Frühbucher-Auszeit'),
    description_de = COALESCE(description_de, 'Sparen Sie 15 Prozent bei einem Aufenthalt, der die Angebotsbedingungen erfüllt.')
WHERE name_en = 'Early Escape';

UPDATE public.offers
SET name_ru = COALESCE(name_ru, 'Бонус за неделю у моря'),
    description_ru = COALESCE(description_ru, 'Получите скидку 50 USD на бронирование, соответствующее условиям предложения.'),
    name_de = COALESCE(name_de, 'Guthaben für eine Woche am Meer'),
    description_de = COALESCE(description_de, 'Erhalten Sie 50 USD Rabatt auf eine Buchung, die die Angebotsbedingungen erfüllt.')
WHERE name_en = 'Sea Week Credit';
