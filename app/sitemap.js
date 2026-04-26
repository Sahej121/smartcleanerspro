export default function sitemap() {
  const baseUrl = 'https://smartcleaners.pro';
  
  // Base routes
  const routes = [
    '',
    '/pricing',
    '/features',
    '/contact',
    '/about',
    '/login',
    '/register',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));

  return routes;
}
