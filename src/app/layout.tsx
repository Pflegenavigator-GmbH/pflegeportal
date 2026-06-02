// src/app/layout.tsx
import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}