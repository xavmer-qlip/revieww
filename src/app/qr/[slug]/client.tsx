'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ExternalLink } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils';

interface QrPageClientProps {
  business: {
    name: string;
    slug: string;
    logo_url: string | null;
    google_place_id: string | null;
  };
  playUrl: string;
  qrImageUrl: string;
}

export function QrPageClient({ business, playUrl, qrImageUrl }: QrPageClientProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center px-4 py-8">
      {/* Business identity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center mb-6"
      >
        {business.logo_url ? (
          <img
            src={business.logo_url}
            alt={business.name}
            className="w-16 h-16 rounded-2xl object-cover border border-gray-200 shadow-sm mb-3"
          />
        ) : business.google_place_id ? (
          <img
            src={`/api/places/photo?placeId=${business.google_place_id}`}
            alt={business.name}
            className="w-16 h-16 rounded-2xl object-cover border border-gray-200 shadow-sm mb-3"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 border border-gray-200">
            <span className="text-xl font-display font-bold text-primary">
              {getInitials(business.name)}
            </span>
          </div>
        )}

        <h1 className="text-xl font-display font-bold text-gray-900">
          {business.name}
        </h1>
        <p className="text-sm font-body text-gray-500 mt-1">
          Laissez un avis et gagnez un cadeau !
        </p>
      </motion.div>

      {/* QR Code */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="bg-white p-5 rounded-3xl shadow-lg border border-gray-100 mb-6"
      >
        <img
          src={qrImageUrl}
          alt={`QR Code pour ${business.name}`}
          className="w-56 h-56"
        />
      </motion.div>

      {/* Direct link button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <Link href={playUrl}>
          <Button variant="primary" size="lg">
            <ExternalLink size={16} />
            Participer maintenant
          </Button>
        </Link>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8"
      >
        <Logo size="sm" animate />
      </motion.div>
    </div>
  );
}
