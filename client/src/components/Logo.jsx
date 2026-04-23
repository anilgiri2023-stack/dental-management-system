import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react'; // Activity icon (heartbeat/medical cross style)

export default function Logo({ className = '', lightText = false }) {
  return (
    <Link to="/" className={`flex items-center gap-3 group ${className}`}>
      {/* Logo Icon Container */}
      <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 group-hover:-translate-y-0.5 transition-all duration-300">
        <Activity className="w-6 h-6 text-white" strokeWidth={2.5} />
      </div>
      
      {/* Text Container */}
      <span className="text-2xl font-bold tracking-tight">
        <span className={lightText ? "text-white" : "text-gray-900"}>Clinical</span>{' '}
        <span className={lightText ? "text-primary-light" : "text-primary"}>Serenity</span>
      </span>
    </Link>
  );
}
