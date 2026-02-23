'use client';

import { Menu } from 'lucide-react';
import { motion } from 'motion/react';
import { Logo } from '@/components/ui/logo';

interface TopbarProps {
  onMenuToggle: () => void;
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface/80 px-4 backdrop-blur-md lg:hidden">
      {/* Logo */}
      <Logo variant="dark" size="sm" />

      {/* Hamburger */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onMenuToggle}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-border/50 hover:text-text"
        aria-label="Ouvrir le menu"
      >
        <Menu size={20} />
      </motion.button>
    </header>
  );
}
