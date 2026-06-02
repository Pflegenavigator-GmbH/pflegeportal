// src/types/tagebuch.ts
export interface TagebuchEintrag {
    content: string;
    date: string;
    mood: 'happy' | 'neutral' | 'sad';
    created_at: string;
}

export interface TagebuchData {
    [key: string]: TagebuchEintrag;
}