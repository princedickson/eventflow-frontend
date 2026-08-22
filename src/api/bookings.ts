import client from './client';
import type { BookingResponse } from '../types';

// eventSeatIds here means the EventSeat row's OWN id (not the physical
// seat id) — matches ConfirmBookingRequest.java on the backend.
export function confirmBooking(eventId: number, eventSeatIds: number[]) {
  return client
    .post<BookingResponse>('/bookings', { eventId, eventSeatIds })
    .then((res) => res.data);
}

export function getMyBookings() {
  return client.get<BookingResponse[]>('/bookings/me').then((res) => res.data);
}
