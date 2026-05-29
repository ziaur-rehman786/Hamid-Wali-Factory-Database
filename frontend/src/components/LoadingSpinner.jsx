export default function LoadingSpinner({ size = 'md' }) {
  const sizes = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className="flex justify-center items-center p-8">
      <div className={`${sizes[size]} border-4 border-gold-200 border-t-gold-500 rounded-full animate-spin`} />
    </div>
  );
}
