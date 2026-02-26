'use client';

import Link from 'next/link';
 

export default function Navbar() {

  return (
    <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-vin-primary">
            VINERYS
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-vin-primary transition-colors"
            >
              Acasă
            </Link>
            
            {  (
              <>
                <Link 
                  href="/wines" 
                  className="text-gray-700 hover:text-vin-primary transition-colors"
                >
                  Vinurile mele
                </Link>
                <Link 
                  href="/dashboard" 
                  className="text-gray-700 hover:text-vin-primary transition-colors"
                >
                  Dashboard
                </Link>
              </>
            )}

   
          </div>
        </div>
      </div>
    </nav>
  );
}