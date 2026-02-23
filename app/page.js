import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-vin-primary mb-4">
          VINERYS
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Gestionează-ți colecția de vinuri într-un mod simplu și elegant
        </p>
        
        <div className="space-x-4">
          <Link 
            href="/wines" 
            className="bg-vin-primary text-white px-6 py-3 rounded-lg hover:bg-vin-secondary transition-colors"
          >
            Vezi colecția
          </Link>
          <Link 
            href="/wines/add" 
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Adaugă vin
          </Link>
        </div>
      </div>
    </div>
  );
}