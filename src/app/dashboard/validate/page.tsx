'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ShieldCheck, Copy, Check, MessageCircle, Mail, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TEXTS, APP_URL } from '@/lib/constants';

export default function DashboardValidatePage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateBaseUrl = `${APP_URL}/validate/`;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleVerify() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    router.push(`/validate?code=${trimmed}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleVerify();
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(validateBaseUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  const shareText = 'Lien pour valider les lots woopla';
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}: ${validateBaseUrl}`)}`;
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(`${shareText}\n\n${validateBaseUrl}`)}`;

  return (
    <div className="space-y-6 max-w-xl">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-sky/10 flex items-center justify-center">
            <ShieldCheck size={20} className="text-sky" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-text">
              {TEXTS.dashboardValidate.title}
            </h1>
            <p className="text-sm font-body text-text-muted">
              {TEXTS.dashboardValidate.subtitle}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Code input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card padding="lg">
          <div className="space-y-4">
            <Input
              ref={inputRef}
              id="validate-code"
              label="Code de validation"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              placeholder={TEXTS.dashboardValidate.placeholder}
              icon={<ShieldCheck size={16} />}
            />
            <Button
              variant="primary"
              size="lg"
              onClick={handleVerify}
              disabled={!code.trim()}
              className="w-full"
            >
              <ShieldCheck size={18} />
              Vérifier
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Quick share section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Link2 size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-display font-semibold text-text">
                {TEXTS.dashboardValidate.shareTitle}
              </h2>
              <p className="text-xs font-body text-text-muted">
                {TEXTS.dashboardValidate.shareDesc}
              </p>
            </div>
          </div>

          {/* URL display */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-background border border-border/50 mb-4">
            <code className="flex-1 text-sm font-mono text-text-muted truncate">
              {validateBaseUrl}
            </code>
          </div>

          {/* Share buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex-1"
            >
              {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
              {copied ? 'Copié !' : 'Copier le lien'}
            </Button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button variant="outline" size="sm" className="w-full">
                <MessageCircle size={16} />
                WhatsApp
              </Button>
            </a>

            <a href={mailtoUrl} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Mail size={16} />
                Email
              </Button>
            </a>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
