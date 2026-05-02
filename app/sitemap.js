export default function sitemap() {
  const baseUrl = 'https://smartcleaners.pro';
  
  // Base routes
  const routes = [
    '',
    '/pricing',
    '/features',
    '/how-it-works',
    '/contact',
    '/login',
    '/register',
    '/policy/privacy',
    '/policy/terms',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: route.includes('policy') ? 'monthly' : 'weekly',
    priority: route === '' ? 1 : route.includes('policy') ? 0.3 : 0.8,
  }));

  return routes;
}
