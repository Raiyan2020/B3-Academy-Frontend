# Static images

## `logo.png` — placeholder in place, replace with the real asset

This one file is the fallback for **every** image the backend has not supplied
(book covers, course thumbnails, clinic and trip photos, encyclopedia entries,
community posts, podcast artwork). The path is defined once in
`src/lib/images.ts` as `LOGO_IMAGE`; nothing else hardcodes it.

What is committed here today is a generated placeholder wordmark, not brand
artwork. It exists because the fallback has to resolve: while the file was
missing, `/_next/image?url=/images/logo.png` answered 400 and every page that
fell back to it rendered a broken image instead of a neutral one.

**Replace it** by overwriting `logo.png` with the real B3 Academy logo. Nothing
else needs to change — no code references the placeholder specifically.

Keep the same filename. A square or wide PNG both work; every call site sizes it
with `object-fit`, so the source aspect ratio is not critical.

The backend keeps its own copy of the same fallback at
`backend/public/storage/images/logo/logo.png` (see `UploadTrait::LOGO_IMAGE_PATH`).
Replace that one too.
