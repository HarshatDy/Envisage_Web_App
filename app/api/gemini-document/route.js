import { fetchFromCollection } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Find documents with the Summary field
    const documents = await fetchFromCollection(
      'gemini_api', 
      { 'Summary': { $exists: true } },
      {},
      process.env.MONGODB_URI,
      process.env.MONGODB_DB
    );
    
    if (!documents || documents.length === 0) {
      return NextResponse.json({ message: 'No documents with Summary field found' }, { status: 404 });
    }
    
    // Look for the specific date in the Summary field
    for (const doc of documents) {
      if (doc.Summary && doc.Summary['2025-04-06_18:00']) {
        // Extract just the specific date value
        const summaryValue = doc.Summary['2025-04-06_18:00'];
        
        // Print to server console
        console.log('Found Summary["2025-04-06_18:00"] value:');
        console.log('-'.repeat(50));
        console.log(summaryValue);
        console.log('-'.repeat(50));
        
        // Return just the summary value as the response
        return NextResponse.json({ 
          summary: summaryValue,
          date: '2025-04-06_18:00' 
        });
      }
    }
    
    // If we get here, we found documents with Summary but not the specific date
    return NextResponse.json({ 
      message: 'No document contains Summary["2025-04-06_18:00"]',
      availableDates: documents[0].Summary ? Object.keys(documents[0].Summary) : []
    }, { status: 404 });
    
  } catch (error) {
    console.error('Error fetching gemini_api document:', error);
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
  }
}
