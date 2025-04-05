import { fetchPaginatedData } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET(request) {
  // Get query parameters
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  // Build query
  const query = category ? { category } : {};

  try {
    // Fetch data from MongoDB
    const result = await fetchPaginatedData('news', query, page, limit);
    
    // Return the results
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
