import client from './client';
import type { EventSeatResponse } from '../types';

export function fetchEventSeats(eventId: number) {
  return client.get<EventSeatResponse[]>(`/events/${eventId}/seats`).then((res) => res.data);
}

// Note: seatId here is the PHYSICAL seat id (EventSeatResponse.seatId), not
// the EventSeat row's own id — matches how the backend's
// EventSeatController is routed: /events/{eventId}/seats/{seatId}/hold.
export function holdSeat(eventId: number, seatId: number) {
  return client
    .post<EventSeatResponse>(`/events/${eventId}/seats/${seatId}/hold`)
    .then((res) => res.data);
}

export function releaseSeat(eventId: number, seatId: number) {
  return client.post(`/events/${eventId}/seats/${seatId}/release`);
}
