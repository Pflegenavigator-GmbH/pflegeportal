// src/components/modal/PaywallModal.tsx
'use client';

import { CreditCard } from 'lucide-react';

import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/src/components/ui';

interface Product {
  id: string;
  name: string;
  price_cents: number;
}

interface PaywallModalProps {
  caseCode: string;
  isExpired: boolean;
  products: Product[];
  onCheckout: (paketId: string) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}

export function PaywallModal({
  caseCode,
  isExpired,
  products,
  onCheckout,
  onClose,
  loading,
}: PaywallModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-slate-900 border-blue-500/40 text-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <CardHeader className="text-center">
            <div className="mx-auto p-3 bg-blue-500/20 rounded-full w-12 h-12 flex items-center justify-center mb-3">
              <CreditCard className="w-6 h-6 text-blue-400" />
            </div>
            <CardTitle className="text-2xl text-white">
              {isExpired ? 'Ihre Beta-Phase ist abgelaufen' : 'Premium-Zugang freischalten'}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {isExpired
                ? 'Ihre 12-monatige Testphase ist vorüber. Wählen Sie ein Paket, um erweiterte Funktionen zu nutzen.'
                : `Aktivieren Sie Zusatzfunktionen für den Fallcode ${caseCode}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-300 text-center">
              Die Standard-Pflegegrad-Einschätzung ist und bleibt für Sie **kostenlos**. Hier können
              Sie optionale Premium-Funktionen oder den PDF-Export freischalten.
            </p>
            <div className="grid gap-4 mt-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-white">{product.name}</p>
                    <p className="text-xs text-gray-400">Inklusive vollem Funktionsumfang</p>
                  </div>
                  <Button
                    onClick={() => onCheckout(product.id)}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold"
                  >
                    {(product.price_cents / 100).toFixed(2)} €
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full text-gray-400 hover:text-white"
            >
              Zurück zur Übersicht (Kostenlos fortfahren)
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
