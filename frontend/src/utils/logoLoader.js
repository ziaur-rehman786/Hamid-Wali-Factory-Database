let cachedLogoBase64 = null;

export async function loadLogoBase64(url = '/logo.png?v=2') {
  if (cachedLogoBase64) return cachedLogoBase64;

  const response = await fetch(url);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      cachedLogoBase64 = reader.result;
      resolve(cachedLogoBase64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function getLogoUrlFromFactory(factory) {
  const url = factory?.factory_logo;
  if (url && url.trim()) return url.startsWith('/') || url.startsWith('http') ? url : `/${url}`;
  return '/logo.png?v=2';
}
