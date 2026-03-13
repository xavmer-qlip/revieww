'use client';

import { motion } from 'motion/react';
import { MessageSquare, Mail, Smartphone, Users, Bell } from 'lucide-react';

export default function MessagesPage() {
  return (
    <div className="max-w-2xl mx-auto mt-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-2xl border border-border/40 p-8 text-center"
      >
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
          <MessageSquare className="w-8 h-8 text-primary" />
        </div>

        <h1 className="text-2xl font-display font-bold text-text mb-3">
          Messages
        </h1>

        <p className="text-sm font-body text-text-muted leading-relaxed max-w-md mx-auto mb-6">
          Envoyez des campagnes email et SMS à vos clients directement depuis woopla.
          Fidélisez vos clients et faites-les revenir avec des offres personnalisées.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-left max-w-lg mx-auto">
          {[
            { icon: Mail, text: 'Campagnes email automatiques vers vos contacts' },
            { icon: Smartphone, text: 'SMS ciblés pour des offres flash et rappels' },
            { icon: Users, text: 'Segmentation de vos clients par fréquence de visite' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-start gap-2 bg-background rounded-xl p-3">
                <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs font-body text-text-muted leading-relaxed">{item.text}</p>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-primary font-medium bg-primary/5 px-4 py-2.5 rounded-full w-fit mx-auto">
          <Bell className="w-4 h-4" />
          Bientôt disponible
        </div>
      </motion.div>
    </div>
  );
}
