const DEFAULT_LOGO = '/logo.png?v=2';

export function getLogoUrl(factoryOrSettings) {
  const url = factoryOrSettings?.factory_logo || factoryOrSettings?.logo;
  if (url && url.trim()) return url.startsWith('/') || url.startsWith('http') ? url : `/${url}`;
  return DEFAULT_LOGO;
}

export default function FactoryLogo({ src, size = 'md', className = '' }) {
  const logoSrc = src || DEFAULT_LOGO;
  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
    sidebar: 'w-[4.5rem] h-[4.5rem] min-w-[4.5rem]',
    invoice: 'w-24 h-24',
  };

  return (
    <img
      src={logoSrc}
      alt="Hamid Wali Shoe Factory"
      className={`${sizes[size] || sizes.md} object-contain rounded-full ${className}`}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = DEFAULT_LOGO;
      }}
    />
  );
}
