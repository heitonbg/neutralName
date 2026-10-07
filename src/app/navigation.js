export const TAB_PATHS = {
  feed: "/",
  map: "/map",
  create: "/events/new",
  my: "/my",
  friends: "/friends",
  profile: "/profile",
};

const TAB_BY_PATH = Object.fromEntries(
  Object.entries(TAB_PATHS).map(([tab, path]) => [path, tab]),
);

function parseProfileId(value) {
  return /^\d+$/.test(value) ? Number(value) : value;
}

export function getMainPath(location) {
  let current = location;
  while (current.state?.background?.pathname) {
    current = current.state.background;
  }

  if (
    current.pathname === "/tourist" ||
    /^\/events\/\d+(?:\/participants)?$/.test(current.pathname) ||
    /^\/organizers\/[A-Za-z0-9_-]+$/.test(current.pathname) ||
    /^\/users\/\d+$/.test(current.pathname)
  ) {
    return "/";
  }

  return current.pathname;
}

export function getActiveTab(location) {
  if (/^\/events\/\d+\/edit$/.test(location.pathname)) return "create";
  const path = getMainPath(location);
  if (path === "/events/new" || /^\/events\/\d+\/edit$/.test(path))
    return "create";
  return TAB_BY_PATH[path] || "feed";
}

export function isKnownRoute(pathname) {
  return (
    Object.values(TAB_PATHS).includes(pathname) ||
    pathname === "/tourist" ||
    pathname === "/events/new" ||
    /^\/events\/\d+(?:\/(?:edit|participants))?$/.test(pathname) ||
    /^\/organizers\/[A-Za-z0-9_-]+$/.test(pathname) ||
    /^\/users\/\d+$/.test(pathname)
  );
}

export function getEventIdFromPath(pathname) {
  const match = pathname.match(/^\/events\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

export function getEditEventIdFromPath(pathname) {
  const match = pathname.match(/^\/events\/(\d+)\/edit$/);
  return match ? Number(match[1]) : null;
}

export function getParticipantsEventIdFromPath(pathname) {
  const match = pathname.match(/^\/events\/(\d+)\/participants$/);
  return match ? Number(match[1]) : null;
}

export function getOrganizerIdFromPath(pathname) {
  const match = pathname.match(/^\/organizers\/([A-Za-z0-9_-]+)$/);
  return match ? parseProfileId(match[1]) : null;
}

export function getUserIdFromPath(pathname) {
  const match = pathname.match(/^\/users\/(\d+)$/);
  return match ? Number(match[1]) : null;
}
