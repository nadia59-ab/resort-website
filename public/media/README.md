# Local resort media

Add the following files at these exact paths:

- `hero-video.mp4` — muted, wide hero video.
- `hero-poster.jpg` — hero fallback/poster image.
- `rooms/standard-room.jpg` — Standard primary photo (`sort_order = 0`).
- `rooms/standard-room-2.jpg` — Standard gallery photo (`sort_order = 1`).
- `rooms/standard-room-3.jpg` — Standard gallery photo (`sort_order = 2`).
- `rooms/suite-room.jpg` — Suite primary photo (`sort_order = 0`).
- `rooms/suite-room-2.jpg` — Suite gallery photo (`sort_order = 1`).
- `rooms/suite-room-3.jpg` — Suite gallery photo (`sort_order = 2`).
- `rooms/villa-room.jpg` — Villa primary photo (`sort_order = 0`).
- `rooms/villa-room-2.jpg` — Villa gallery photo (`sort_order = 1`).
- `rooms/villa-room-3.jpg` — Villa gallery photo (`sort_order = 2`).
- `experiences/<experience-folder>/` — each matching experience folder contains its five photos; the primary photo filename includes `primary`.

Experience folders are matched against the English experience names in Supabase. Images are discovered from the folders automatically; no image rows or schema changes are used for experiences.

Room and experience photos should be landscape images. The page shows a designed fallback when an image file is missing.
