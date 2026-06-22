const COPY_SUFFIX = " - Salinan";

export function buildDuplicatePackageName(
  originalName: string,
  existingNames: string[],
) {
  const baseName = originalName.trim();
  const existing = new Set(existingNames.map((name) => name.trim()));

  const firstCandidate = `${baseName}${COPY_SUFFIX}`;
  if (!existing.has(firstCandidate)) {
    return firstCandidate;
  }

  let counter = 2;
  while (existing.has(`${baseName}${COPY_SUFFIX} ${counter}`)) {
    counter += 1;
  }

  return `${baseName}${COPY_SUFFIX} ${counter}`;
}
