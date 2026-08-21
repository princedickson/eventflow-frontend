// These mirror the backend's DTOs exactly (UserResponse.java, AuthResponse.java,
// EventSeatResponse.java, etc.) — keeping frontend types in sync with backend
// DTOs like this is a small but real discipline that avoids silent bugs
// where a field gets renamed on one side and not the other.

export interface UserResponse {
  id: number;
  email: string;
  fullName: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
}

export interface VenueResponse {
  id: number;
  name: string;
  address: string;
  city: string;
  totalCapacity: number;
}

export interface EventResponse {
  id: number;
  venueId: number;
  venueName: string;
  title: string;
  description: string;
  startsAt: string; // ISO date string — backend sends Instant as ISO-8601
  status: string;
}

export interface EventSeatResponse {
  id: number;
  seatId: number;
  rowLabel: string;
  seatNumber: number;
  price: number;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED';
  heldUntil: string | null;
}

export interface BookingResponse {
  id: number;
  eventId: number;
  status: string;
  totalAmount: number;
  seats: EventSeatResponse[];
}
