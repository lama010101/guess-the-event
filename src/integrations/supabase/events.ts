
import { supabase } from './client';
import type { HistoricalEvent } from '@/types/game';

/**
 * Fetches all historical events from the database
 */
export const fetchAllHistoricalEvents = async (): Promise<HistoricalEvent[]> => {
  try {
    const { data, error } = await supabase
      .from('historical_events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!data) return [];

    // Convert database format to application format
    return data.map(event => ({
      id: event.id,
      year: event.year,
      description: event.description,
      imageUrl: event.image_url,
      location: {
        name: event.location_name,
        lat: Number(event.latitude),
        lng: Number(event.longitude)
      }
    }));
  } catch (error) {
    console.error('Error fetching historical events:', error);
    return [];
  }
};

/**
 * Fetches a random set of historical events from the database
 * @param limit - Maximum number of events to return
 */
export const fetchRandomHistoricalEvents = async (limit: number = 5): Promise<HistoricalEvent[]> => {
  try {
    const { data, error } = await supabase
      .from('historical_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    if (!data) return [];

    // Convert database format to application format
    return data.map(event => ({
      id: event.id,
      year: event.year,
      description: event.description,
      imageUrl: event.image_url,
      location: {
        name: event.location_name,
        lat: Number(event.latitude),
        lng: Number(event.longitude)
      }
    }));
  } catch (error) {
    console.error('Error fetching random historical events:', error);
    return [];
  }
};
