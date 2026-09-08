// src/components/ui/index.ts
// Barrel für alle UI-Primitive (Atomic Design). Verbraucher importieren aus
// '@/src/components/ui' und bleiben so von der internen Ordnerstruktur
// entkoppelt — künftige Umbauten ändern keine Import-Pfade mehr.

// Atoms
export * from './atoms/button';
export * from './atoms/input';
export * from './atoms/label';
export * from './atoms/textarea';
export * from './atoms/separator';
export * from './atoms/progress';

// Molecules
export * from './molecules/alert';
export * from './molecules/card';
export * from './molecules/radio-group';
export * from './molecules/select';
export * from './molecules/tabs';
export * from './molecules/error-boundary';

// Organisms
export * from './organisms/dialog';
export * from './organisms/dropdown-menu';
