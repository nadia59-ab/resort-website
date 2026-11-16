import "server-only";

import { readdir } from "node:fs/promises";
import path from "node:path";

export type ExperienceRecord = {
  id: string;
  name_en: string;
};

export type ExperiencePhoto = {
  src: string;
  fileName: string;
};

export type ExperienceMedia = {
  experience_id: string;
  folder_name: string;
  primary: ExperiencePhoto | null;
  photos: ExperiencePhoto[];
};

export type ExperienceMediaResult = {
  media: ExperienceMedia[];
  unmatchedFolders: string[];
};

function normalizeName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export async function loadExperienceMedia(
  experiences: ExperienceRecord[],
): Promise<ExperienceMediaResult> {
  const root = path.join(process.cwd(), "public", "media", "experiences");
  let entries;

  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return { media: [], unmatchedFolders: [] };
  }

  const folders = entries.filter((entry) => entry.isDirectory());
  const unmatchedFolders: string[] = [];
  const media: ExperienceMedia[] = [];
  const claimedExperienceIds = new Set<string>();

  for (const folder of folders) {
    const folderName = folder.name;
    const normalizedFolder = normalizeName(folderName);
    const candidates = experiences.filter((experience) => {
      const normalizedExperience = normalizeName(experience.name_en);
      return (
        normalizedFolder === normalizedExperience ||
        (normalizedFolder.length >= 6 && normalizedExperience.includes(normalizedFolder))
      );
    });

    if (candidates.length !== 1 || claimedExperienceIds.has(candidates[0]?.id)) {
      unmatchedFolders.push(folderName);
      continue;
    }

    const experience = candidates[0];
    claimedExperienceIds.add(experience.id);

    let files;
    try {
      files = await readdir(path.join(root, folderName), { withFileTypes: true });
    } catch {
      unmatchedFolders.push(folderName);
      continue;
    }

    const photos = files
      .filter((file) => file.isFile() && /\.(jpe?g|png|webp|avif)$/i.test(file.name))
      .map((file) => ({
        src: `/media/experiences/${encodeURIComponent(folderName)}/${encodeURIComponent(file.name)}`,
        fileName: file.name,
      }))
      .sort((a, b) => a.fileName.localeCompare(b.fileName));

    const primary = photos.find((photo) => /primary/i.test(photo.fileName)) ?? null;
    const orderedPhotos = primary
      ? [primary, ...photos.filter((photo) => photo.fileName !== primary.fileName)]
      : photos;

    media.push({
      experience_id: experience.id,
      folder_name: folderName,
      primary,
      photos: orderedPhotos,
    });
  }

  return { media, unmatchedFolders };
}
