'use client';

import { motion } from 'motion/react';
import { MessageSquare, Bell } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-text">Messages</h1>
        <p className="text-text-muted font-body mt-1">
          Envoie des messages automatiques à tes clients
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card padding="lg" className="flex flex-col items-center justify-center text-center py-20">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <MessageSquare className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-display font-bold text-text mb-2">
            Bientôt disponible
          </h2>
          <p className="text-text-muted font-body max-w-md mb-6">
            Tu pourras bientôt envoyer des emails et SMS automatiques à tes clients
            pour les fidéliser et les faire revenir.
          </p>
          <div className="flex items-center gap-2 text-sm text-primary font-medium bg-primary/5 px-4 py-2 rounded-full">
            <Bell className="w-4 h-4" />
            Tu seras notifié dès que c&apos;est prêt
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
