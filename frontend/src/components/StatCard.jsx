export default function StatCard({ title, value, icon: Icon, color = 'primary', subtitle }) {
  const colors = {
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-800 dark:text-gold-300',
    green: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/30',
    amber: 'bg-gold-100 text-gold-700 dark:bg-gold-900/30 dark:text-gold-400',
    purple: 'bg-primary-50 text-primary-700 dark:bg-primary-800/50',
  };

  return (
    <div className="card border-l-4 border-l-gold-500">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-primary-600 dark:text-gold-300/80 font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1 text-primary-900 dark:text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${colors[color]}`}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </div>
  );
}
