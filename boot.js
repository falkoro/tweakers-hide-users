try {
  document.documentElement.classList.add("thu-on");
  if (
    /\/direct-messaging(?:\/|$)/i.test(location.pathname) ||
    /\/list_dmmessages(?:\/|$)/i.test(location.pathname)
  ) {
    document.documentElement.classList.add("thu-dm");
  }
} catch (_) {}
