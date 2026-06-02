export type ToolCategory =
    | 'documentation'
    | 'ai'
    | 'medication'
    | 'communication'
    | 'legal';

export interface Tool {
    id: string;
    name: string;
    provider: string;
    description: string;
    features: string[];
    url: string;
    category: ToolCategory;
}

export const tools: Tool[] = [
    {
        id: 'pflegegpt',
        name: 'PflegeGPT',
        provider: 'DaphOS',
        description:
            'KI-Assistent für die Pflege. Erstellt Pflegepläne, fasst Pflegedokumentation zusammen und erkennt unvollständige Leistungsnachweise.',
        features: [
            'Automatische Pflegeplan-Strukturierung',
            'Zusammenfassung langer Übergabeberichte',
            'SIS-Kontext-Abgleich',
        ],
        url: 'https://www.daphos.ai/pflegegpt/',
        category: 'ai',
    },
    {
        id: 'dexter-health',
        name: 'Dexter Health',
        provider: 'Dexter Health',
        description:
            'KI-basierte Sprachdokumentation und sichere Team-Kommunikation optimiert für stationäre Pflegeeinrichtungen.',
        features: ['Sprachbasierte Verlaufsberichte', 'Smarte Schichtübergabe', 'Echtzeit-Dokumentations-Bypass'],
        url: 'https://www.dexter-health.com/',
        category: 'ai',
    },
    {
        id: 'curasoft-ki',
        name: 'CuraSoft KI',
        provider: 'CuraSoft',
        description:
            'KI-gestützte Dokumentationshilfe für ambulante Pflegedienste. Spart wertvolle Zeit bei der täglichen Tourenberichterstattung.',
        features: ['Textvorschläge für Berichte', 'SIS-konforme Formulierungen', 'Direkte Software-Schnittstelle'],
        url: 'https://www.curasoft.de/ki/',
        category: 'ai',
    },
    {
        id: 'carecloud',
        name: 'CareCloud',
        provider: 'CareCloud',
        description: 'Intelligente, cloudbasierte Pflegedokumentation direkt aus der Praxis für den modernen Pflegeprozess.',
        features: ['Echtzeit-Synchronisation', 'Intelligente Tourenführung', 'Papierlose Prozessbegleitung'],
        url: 'https://www.carecloud.de/',
        category: 'documentation',
    },
    {
        id: 'md-ambulant',
        name: 'MD Ambulant',
        provider: 'MediFox Dan',
        description:
            'Umfassendes Softwaresystem für ambulante Pflegedienste. Lückenlose Dokumentation und MD-Prüfsicherheit.',
        features: ['Umfangreiche Abrechnungsmodule', 'Betreuungsdokumentation', 'Digitale Leistungsnachweise'],
        url: 'https://www.medifoxdan.de/',
        category: 'documentation',
    },
    {
        id: 'mytherapy',
        name: 'MyTherapy',
        provider: 'SmartPatient',
        description:
            'Professionelle App-Infrastruktur für sichere Medikamenteneinnahme, Dokumentation und Arztberichte.',
        features: ['Zuverlässige Einnahmeerinnerung', 'Detailliertes Einnahme-Tracking', 'Exportierbare Medikationsberichte'],
        url: 'https://www.mytherapyapp.com/de',
        category: 'medication',
    },
    {
        id: 'ti-messenger',
        name: 'TI-Messenger',
        provider: 'Gematik',
        description:
            'Sichere, DSGVO-konforme Echtzeit-Kommunikation im Gesundheitswesen über die Telematikinfrastruktur (TI).',
        features: ['Ende-zu-Ende-Verschlüsselung', 'Schnittstelle zu KIM-Diensten', 'Sicherer Arzt-Pflege-Austausch'],
        url: 'https://www.kompetenzzentrum-pflege.digital/digitale-anwendungen/kommunikation-im-medizinwesen-kim',
        category: 'communication',
    },
    {
        id: 'pflegeleitlinien-zqp',
        name: 'Pflegeleitlinien ZQP',
        provider: 'ZQP',
        description: 'Wissenschaftliches Recherche-Portal für pflegerische Qualitätsstandards, Leitlinien und Evidenzberichte.',
        features: ['Evidenzbasierte Standards', 'Schnelle Leitlinien-Recherche', 'Praxisnahe HTA-Berichte'],
        url: 'https://lls.zqp.de/',
        category: 'legal',
    },
];