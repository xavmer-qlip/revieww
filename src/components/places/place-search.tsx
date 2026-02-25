'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  Link as LinkIcon,
  HelpCircle,
  Store,
  Search,
  MapPin,
  Loader2,
  StarIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { TEXTS } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlacePrediction {
  place_id: string;
  name: string;
  formatted_address: string;
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  address: string;
  rating: number | null;
  review_count: number;
  category: string | null;
  google_review_link: string;
  phone?: string | null;
  website?: string | null;
}

interface PlaceSearchProps {
  onPlaceSelect: (details: PlaceDetails) => void;
  onNameChange: (value: string) => void;
  onLinkChange: (value: string) => void;
  onReset?: () => void;
  /** Compact mode hides the title/subtitle (for use inside signup form) */
  compact?: boolean;
  businessName?: string;
  googleReviewLink?: string;
}

// ---------------------------------------------------------------------------
// PlaceSearch component
// ---------------------------------------------------------------------------

export function PlaceSearch({
  onPlaceSelect,
  onNameChange,
  onLinkChange,
  onReset,
  compact = false,
  businessName = '',
  googleReviewLink = '',
}: PlaceSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/places?input=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        setPredictions(data.predictions ?? []);
        setShowDropdown(true);
      } catch {
        setPredictions([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // Handle place selection
  const handleSelect = async (prediction: PlacePrediction) => {
    setShowDropdown(false);
    setSearchQuery(prediction.name);
    setLoadingDetails(true);

    try {
      const res = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId: prediction.place_id }),
      });
      const details: PlaceDetails = await res.json();

      setSelectedPlace(details);
      onNameChange(details.name);
      onLinkChange(details.google_review_link);
      onPlaceSelect(details);
    } catch {
      // Fallback: use prediction data
      onNameChange(prediction.name);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Reset selection
  const handleReset = () => {
    setSelectedPlace(null);
    setSearchQuery('');
    onNameChange('');
    onLinkChange('');
    onReset?.();
  };

  return (
    <div className="space-y-5">
      {!compact && (
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-text">
            {TEXTS.onboarding.step1Title}
          </h2>
          <p className="mt-2 text-text-muted font-body">
            Trouvez votre commerce sur Google
          </p>
        </div>
      )}

      <div className={compact ? 'space-y-4' : 'max-w-md mx-auto space-y-5'}>
        {/* Selected place card */}
        {selectedPlace ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border-2 border-primary bg-primary/5 p-3 sm:p-4 space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <MapPin size={18} className="text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold text-text text-sm sm:text-base leading-tight">{selectedPlace.name}</p>
                  <p className="text-xs text-text-muted font-body truncate mt-0.5">{selectedPlace.address}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-text-muted hover:text-danger transition-colors font-display font-medium cursor-pointer shrink-0 mt-0.5"
              >
                Changer
              </button>
            </div>

            {/* Rating */}
            {selectedPlace.rating && (
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon
                      key={i}
                      size={14}
                      className={i < Math.round(selectedPlace.rating!) ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <span className="text-xs font-body text-text font-medium">
                  {selectedPlace.rating}
                </span>
                <span className="text-xs font-body text-text-muted">
                  ({selectedPlace.review_count} avis)
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Check size={14} className="text-success" />
              <span className="text-xs font-body text-success font-medium">
                Lien Google Review configuré
              </span>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Search input */}
            <div className="relative" ref={dropdownRef}>
              <Input
                id="business-search"
                label={compact ? 'Votre commerce' : 'Rechercher votre commerce'}
                placeholder={TEXTS.onboarding.step1Placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              />

              {/* Dropdown results */}
              <AnimatePresence>
                {showDropdown && predictions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-20 top-full mt-1 w-full bg-surface rounded-xl border border-border shadow-lg overflow-hidden"
                  >
                    {predictions.map((p) => (
                      <button
                        key={p.place_id}
                        type="button"
                        onClick={() => handleSelect(p)}
                        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-primary/5 transition-colors cursor-pointer border-b border-border/30 last:border-0"
                      >
                        <MapPin size={16} className="text-text-muted mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-display font-semibold text-text truncate">
                            {p.name}
                          </p>
                          <p className="text-xs text-text-muted font-body truncate">
                            {p.formatted_address}
                          </p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Loading details overlay */}
            {loadingDetails && (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 size={18} className="animate-spin text-primary" />
                <span className="text-sm font-body text-text-muted">
                  Chargement des informations...
                </span>
              </div>
            )}

            {/* Manual fallback — hidden in compact/signup mode */}
            {!compact && (
              <>
                <button
                  type="button"
                  onClick={() => setShowManual(!showManual)}
                  className="flex items-center gap-2 text-sm text-primary font-medium font-display hover:underline cursor-pointer"
                >
                  <HelpCircle size={14} />
                  {TEXTS.onboarding.step1Fallback}
                </button>

                <AnimatePresence>
                  {showManual && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden space-y-4"
                    >
                      <Input
                        id="business-name-manual"
                        label="Nom de votre commerce"
                        placeholder="Cafe du Marche"
                        value={businessName}
                        onChange={(e) => onNameChange(e.target.value)}
                        icon={<Store size={16} />}
                      />
                      <Input
                        id="google-review-link"
                        label="Lien Google Review"
                        placeholder="https://search.google.com/local/writereview?placeid=..."
                        value={googleReviewLink}
                        onChange={(e) => onLinkChange(e.target.value)}
                        icon={<LinkIcon size={16} />}
                      />
                      <p className="text-xs text-text-muted font-body">
                        Trouvez votre commerce sur Google Maps, cliquez &quot;Laisser un avis&quot; et copiez l&apos;URL
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
