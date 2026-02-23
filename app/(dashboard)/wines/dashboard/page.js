'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import WineCard from '@/components/wines/WineCard';
import WineFilters from '@/components/wines/WineFilters';
import Link from 'next/link';

export default function WinesPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchWines();
    }
  }, [isLoaded, isSignedIn, filters]);

  const fetchWines = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.country) params.append('country', filters.country);
      if (filters.search) params.append('search', filters.search);
      
      const response = await fetch(`/api/wines?${params}`);
      const data = await response.json();
      setWines(data);
    } catch (error) {
      console.error('Error fetching wines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (deletedId) => {
    setWines(wines.filter(wine => wine.id !== deletedId));
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">Se încarcă...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="mb-4">Te rugăm să te autentifici pentru a vedea colecția ta</p>
          <Link href="/sign-in" className="bg-vin-primary text-white px-4 py-2 rounded">
            Autentificare
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-vin-primary">
          Colecția mea de vinuri
        </h1>
        <Link
          href="/wines/add"
          className="bg-vin-primary text-white px-4 py-2 rounded-lg hover:bg-vin-secondary transition-colors"
        >
          + Adaugă vin
        </Link>
      </div>

      <WineFilters onFilterChange={setFilters} />

      {loading ? (
        <div className="text-center py-8">
          <p>Se încarcă vinurile...</p>
        </div>
      ) : wines.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">Nu ai încă niciun vin în colecție</p>
          <Link
            href="/wines/add"
            className="text-vin-primary hover:text-vin-secondary"
          >
            Adaugă primul tău vin
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wines.map((wine) => (
            <WineCard
              key={wine.id}
              wine={wine}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}