import { NextRequest, NextResponse } from 'next/server';

interface FeedbackData {
  type: 'bug' | 'feature' | 'praise' | 'other';
  rating: number;
  message: string;
  email?: string;
  context?: string;
  timestamp: string;
  userAgent: string;
  url: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: FeedbackData = await request.json();
    
    // Validierung
    if (!data.message || data.message.trim().length < 10) {
      return NextResponse.json(
        { error: 'Nachricht zu kurz (mindestens 10 Zeichen)' },
        { status: 400 }
      );
    }
    
    if (!['bug', 'feature', 'praise', 'other'].includes(data.type)) {
      return NextResponse.json(
        { error: 'Ungueltiger Feedback-Typ' },
        { status: 400 }
      );
    }
    
    // Ergaenze Metadaten
    const feedbackEntry = {
      ...data,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent') || 'unknown',
      url: request.headers.get('referer') || 'unknown',
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    };
    
    // In Produktion: Speichere in Datenbank
    // Fuer Demo: Logge nur
    console.log('Feedback received:', {
      type: feedbackEntry.type,
      rating: feedbackEntry.rating,
      messageLength: feedbackEntry.message.length,
      hasEmail: !!feedbackEntry.email,
      timestamp: feedbackEntry.timestamp
    });
    
    // Optional: Sende E-Mail Benachrichtigung
    if (process.env.FEEDBACK_EMAIL) {
      // E-Mail Logik hier implementieren
      // await sendFeedbackEmail(feedbackEntry);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Feedback erfolgreich erhalten',
      id: `feedback-${Date.now()}`
    });
    
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Verarbeiten des Feedbacks' },
      { status: 500 }
    );
  }
}

// GET: Feedback-Statistik (fuer Admin)
export async function GET(request: NextRequest) {
  // In Produktion: Authentifizierung pruefen
  // const session = await getSession();
  // if (!session?.user?.isAdmin) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }
  
  // Demo-Statistik
  const stats = {
    total: 0,
    byType: {
      bug: 0,
      feature: 0,
      praise: 0,
      other: 0
    },
    averageRating: 0,
    last7Days: 0
  };
  
  return NextResponse.json(stats);
}
