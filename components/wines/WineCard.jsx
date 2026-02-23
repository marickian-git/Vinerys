import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function WineCard({ wine, onDelete }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm('Sigur dorești să ștergi acest vin?')) {
      try {
        const response = await fetch(`/api/wines/${wine.id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          onDelete?.(wine.id);
        }
      } catch (error) {
        console.error('Error deleting wine:', error);
      }
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      RED: 'bg-red-100 text-red-800',
      WHITE: 'bg-yellow-100 text-yellow-800',
      ROSE: 'bg-pink-100 text-pink-800',
      SPARKLING: 'bg-purple-100 text-purple-800',
      DESSERT: 'bg-amber-100 text-amber-800',
      FORTIFIED: 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48 bg-gray-200">
        {wine.bottleImageUrl ? (
          <img
            src={wine.bottleImageUrl}
            alt={wine.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span>Fără imagine</span>
          </div>
        )}
        
        {wine.isFavorite && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-white p-1 rounded-full">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-800">{wine.name}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(wine.type)}`}>
            {wine.type}
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-2">
          {wine.producer} {wine.vintage && `· ${wine.vintage}`}
        </p>

        {wine.country && (
          <p className="text-sm text-gray-500 mb-3">
            {wine.country} {wine.region && `· ${wine.region}`}
          </p>
        )}

        <div className="flex justify-between items-center mb-3">
          {wine.price && (
            <span className="text-lg font-bold text-vin-primary">
              {wine.price} RON
            </span>
          )}
          <span className="text-sm bg-gray-100 px-2 py-1 rounded">
            {wine.quantity} {wine.quantity === 1 ? 'sticlă' : 'sticle'}
          </span>
        </div>

        {wine.rating && (
          <div className="flex items-center mb-3">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${
                  i < wine.rating ? 'text-yellow-400' : 'text-gray-300'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        )}

        <div className="flex justify-between gap-2">
          <Link
            href={`/wines/${wine.id}`}
            className="flex-1 text-center bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600 transition-colors text-sm"
          >
            Detalii
          </Link>
          <Link
            href={`/wines/edit/${wine.id}`}
            className="flex-1 text-center bg-gray-500 text-white px-3 py-1.5 rounded hover:bg-gray-600 transition-colors text-sm"
          >
            Editează
          </Link>
          <button
            onClick={handleDelete}
            className="flex-1 bg-red-500 text-white px-3 py-1.5 rounded hover:bg-red-600 transition-colors text-sm"
          >
            Șterge
          </button>
        </div>
      </div>
    </div>
  );
}