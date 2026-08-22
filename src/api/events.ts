import client from './client';
import type { EventResponse } from '../types';

export function fetchEvents() {
  return client.get<EventResponse[]>('/events').then((res) => res.data);
}

export function fetchEvent(id: number) {
  return client.get<EventResponse>(`/events/${id}`).then((res) => res.data);
}
