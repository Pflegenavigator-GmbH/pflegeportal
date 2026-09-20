// scripts/fallcode-hash-backfill.mjs
//
// Füllt `cases.case_code_hash` aus dem noch vorhandenen Klartext (#153).
//
// Warum ein Skript und keine SQL-Migration: Der Pepper liegt bewusst nicht in
// PostgreSQL. Die Datenbank kann den Suchschlüssel also gar nicht berechnen.
//
// Aufruf (Node 22, aus dem Projektverzeichnis):
//
//   node --env-file=.env.local scripts/fallcode-hash-backfill.mjs --dry-run
//   node --env-file=.env.local scripts/fallcode-hash-backfill.mjs
//
// Gebraucht werden NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY und
// CASE_CODE_PEPPER. Der Service-Role-Key umgeht RLS — das Skript gehört
// deshalb auf einen vertrauenswürdigen Rechner, nicht in eine CI-Pipeline.
//
// Das Skript ist wiederholbar: Es fasst nur Zeilen ohne Suchschlüssel an und
// prüft am Ende, ob jeder Fall genau einen eindeutigen Hash hat.

import { createHmac } from 'node:crypto';

import { createClient } from '@supabase/supabase-js';

const CASE_CODE_PATTERN = /^PF-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const MIN_PEPPER_LAENGE = 32;

const trockenlauf = process.argv.includes('--dry-run');

function pflicht(name) {
  const wert = process.env[name];
  if (!wert) {
    console.error(`FEHLT: ${name}`);
    process.exit(1);
  }
  return wert;
}

const supabaseUrl = pflicht('NEXT_PUBLIC_SUPABASE_URL');
const serviceKey = pflicht('SUPABASE_SERVICE_ROLE_KEY');
const pepper = pflicht('CASE_CODE_PEPPER');

if (pepper.length < MIN_PEPPER_LAENGE) {
  console.error(`CASE_CODE_PEPPER ist zu kurz (mindestens ${MIN_PEPPER_LAENGE} Zeichen).`);
  process.exit(1);
}

/** Dieselbe Ableitung wie `berechneCaseCodeHash` in src/lib/case-code-server.ts. */
function hash(fallcode) {
  return createHmac('sha256', pepper).update(fallcode, 'utf8').digest('hex');
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

const { data: faelle, error } = await supabase
  .from('cases')
  .select('id, case_code, case_code_hash')
  .order('created_at', { ascending: true });

if (error) {
  console.error('Lesen fehlgeschlagen:', error.message);
  process.exit(1);
}

const offen = faelle.filter((fall) => !fall.case_code_hash);
const nichtNormalisierbar = offen.filter(
  (fall) => !CASE_CODE_PATTERN.test((fall.case_code ?? '').trim().toUpperCase())
);

console.log(`Fälle gesamt: ${faelle.length}`);
console.log(`ohne Suchschlüssel: ${offen.length}`);
console.log(`nicht normalisierbar: ${nichtNormalisierbar.length}`);

if (nichtNormalisierbar.length > 0) {
  // Kein Fall wird migriert, dessen Code sich nicht eindeutig normalisieren
  // lässt — so steht es im Ticket. Lieber abbrechen als jemanden aussperren.
  console.error('Abbruch. Betroffene case_id:', nichtNormalisierbar.map((f) => f.id).join(', '));
  process.exit(1);
}

// Kollisionen VOR dem Schreiben erkennen: Zwei Codes, die auf denselben Hash
// fallen, wären nach der Umstellung ein einziger Fall.
const gesehen = new Map();
for (const fall of offen) {
  const schluessel = hash(fall.case_code.trim().toUpperCase());
  if (gesehen.has(schluessel)) {
    console.error(`Abbruch: Kollision zwischen ${gesehen.get(schluessel)} und ${fall.id}.`);
    process.exit(1);
  }
  gesehen.set(schluessel, fall.id);
}

if (trockenlauf) {
  console.log('Trockenlauf — es wurde nichts geschrieben.');
  process.exit(0);
}

let geschrieben = 0;
for (const fall of offen) {
  const { error: schreibFehler } = await supabase
    .from('cases')
    .update({ case_code_hash: hash(fall.case_code.trim().toUpperCase()) })
    .eq('id', fall.id)
    .is('case_code_hash', null);

  if (schreibFehler) {
    console.error(`Schreiben fehlgeschlagen für ${fall.id}:`, schreibFehler.message);
    process.exit(1);
  }
  geschrieben += 1;
}

// Verifikation über den GESAMTEN Bestand, nicht nur über das eben Geschriebene.
const { data: nachher, error: pruefFehler } = await supabase
  .from('cases')
  .select('id, case_code_hash');

if (pruefFehler) {
  console.error('Verifikation fehlgeschlagen:', pruefFehler.message);
  process.exit(1);
}

const ohneHash = nachher.filter((fall) => !fall.case_code_hash);
const eindeutig = new Set(nachher.map((fall) => fall.case_code_hash));

console.log(`geschrieben: ${geschrieben}`);
console.log(`ohne Suchschlüssel danach: ${ohneHash.length}`);
console.log(`eindeutige Suchschlüssel: ${eindeutig.size} von ${nachher.length}`);

if (ohneHash.length > 0 || eindeutig.size !== nachher.length) {
  console.error(
    'Verifikation NICHT bestanden — die Klartextspalte darf noch nicht entfernt werden.'
  );
  process.exit(1);
}

console.log('Verifikation bestanden. Jetzt die Anwendung deployen, danach Migration 202609170001.');
