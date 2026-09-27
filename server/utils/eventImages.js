const getUploadedFilename = (value) => {
  if (typeof value !== 'string') return null;

  let pathname;
  try {
    pathname = new URL(value, 'http://localhost').pathname;
  } catch {
    return null;
  }

  const match = pathname.match(/(?:^|\/)uploads\/([^/]+)$/);
  if (!match) return null;

  let filename;
  try {
    filename = decodeURIComponent(match[1]);
  } catch {
    return null;
  }

  return /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\.(?:jpg|png|webp|gif)$/i.test(filename)
    ? filename
    : null;
};

const getEventUploadFilenames = (event) => [
  ...(Array.isArray(event?.images) ? event.images : []),
  event?.image,
].map(getUploadedFilename).filter(Boolean);

export const collectUnusedEventUploadFilenames = (event, otherEvents) => {
  const candidates = new Set(getEventUploadFilenames(event));
  const referenced = new Set(
    otherEvents
      .filter((otherEvent) => String(otherEvent.id) !== String(event.id))
      .flatMap(getEventUploadFilenames)
  );

  return [...candidates].filter((filename) => !referenced.has(filename));
};