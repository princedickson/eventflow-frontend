import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import * as eventSeatsApi from '../api/eventSeats';
import * as bookingsApi from '../api/bookings';
import { useSeatSocket } from '../hooks/useSeatSocket';
import type { EventSeatResponse, BookingResponse } from '../types';

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const id = Number(eventId);

  const [seats, setSeats] = useState<EventSeatResponse[]>([]);
  // Seats THIS browser tab currently has held — the source of truth for
  // "which seats can I check out with" and "which seat should render blue
  // vs orange." The backend knows who holds what, but doesn't expose that
  // in the public seat-map response (on purpose — no reason to leak other
  // users' identities to everyone watching), so we track our own holds locally.
  const [heldByMe, setHeldByMe] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingResponse | null>(null);

  useEffect(() => {
    eventSeatsApi
      .fetchEventSeats(id)
      .then(setSeats)
      .finally(() => setLoading(false));
  }, [id]);

  // Fires on every broadcast from the backend — merges the update into our
  // local seat list so the grid reflects reality without ever polling.
  const handleSeatUpdate = useCallback((updated: EventSeatResponse) => {
    setSeats((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    // If a seat we thought we held comes back as something other than HELD
    // (e.g. it expired and the scheduler released it), stop treating it as ours.
    if (updated.status !== 'HELD') {
      setHeldByMe((prev) => {
        if (!prev.has(updated.id)) return prev;
        const next = new Set(prev);
        next.delete(updated.id);
        return next;
      });
    }
  }, []);

  useSeatSocket(id, handleSeatUpdate);

  async function handleSeatClick(seat: EventSeatResponse) {
    setError(null);

    if (seat.status === 'AVAILABLE') {
      try {
        const held = await eventSeatsApi.holdSeat(id, seat.seatId);
        setSeats((prev) => prev.map((s) => (s.id === held.id ? held : s)));
        setHeldByMe((prev) => new Set(prev).add(held.id));
      } catch (err) {
        // This is the actual concurrency guarantee surfacing in the UI —
        // if someone else grabbed this seat a moment ago, the backend's
        // 409 lands here as a clear message instead of silently failing.
        setError(isAxiosError(err) ? err.response?.data?.message : 'Could not hold seat');
      }
    } else if (heldByMe.has(seat.id)) {
      try {
        await eventSeatsApi.releaseSeat(id, seat.seatId);
        setHeldByMe((prev) => {
          const next = new Set(prev);
          next.delete(seat.id);
          return next;
        });
        setSeats((prev) =>
          prev.map((s) => (s.id === seat.id ? { ...s, status: 'AVAILABLE', heldUntil: null } : s)),
        );
      } catch (err) {
        setError(isAxiosError(err) ? err.response?.data?.message : 'Could not release seat');
      }
    }
  }

  async function handleConfirm() {
    setError(null);
    try {
      const result = await bookingsApi.confirmBooking(id, Array.from(heldByMe));
      setBooking(result);
      setHeldByMe(new Set());
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.message : 'Booking failed');
    }
  }

  if (loading) return <p style={{ padding: 40 }}>Loading seat map…</p>;

  if (booking) {
    return (
      <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h2>Booking confirmed!</h2>
        <p>
          {booking.seats.length} seat(s) — total ${booking.totalAmount.toFixed(2)}
        </p>
        <p>Booking #{booking.id}</p>
      </div>
    );
  }

  const seatsByRow = seats.reduce<Record<string, EventSeatResponse[]>>((acc, seat) => {
    (acc[seat.rowLabel] ??= []).push(seat);
    return acc;
  }, {});

  const selectedTotal = seats
    .filter((s) => heldByMe.has(s.id))
    .reduce((sum, s) => sum + s.price, 0);

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Select your seats</h2>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 14 }}>
        <Legend color="#fff" border label="Available" />
        <Legend color="#3b82f6" label="Your selection" />
        <Legend color="#f59e0b" label="Held by others" />
        <Legend color="#9ca3af" label="Booked" />
      </div>

      {Object.entries(seatsByRow)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([row, rowSeats]) => (
          <div key={row} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ width: 24, fontWeight: 'bold' }}>{row}</span>
            {rowSeats
              .sort((a, b) => a.seatNumber - b.seatNumber)
              .map((seat) => (
                <button
                  key={seat.id}
                  onClick={() => handleSeatClick(seat)}
                  disabled={seat.status === 'BOOKED' || (seat.status === 'HELD' && !heldByMe.has(seat.id))}
                  title={`${row}${seat.seatNumber} — $${seat.price}`}
                  style={{
                    width: 32,
                    height: 32,
                    fontSize: 11,
                    cursor: 'pointer',
                    background: seatColor(seat, heldByMe.has(seat.id)),
                    border: '1px solid #ccc',
                    borderRadius: 4,
                  }}
                >
                  {seat.seatNumber}
                </button>
              ))}
          </div>
        ))}

      {error && <p style={{ color: 'crimson', marginTop: 12 }}>{error}</p>}

      {heldByMe.size > 0 && (
        <div style={{ marginTop: 20, padding: 16, background: '#f3f4f6', borderRadius: 8 }}>
          <p>
            {heldByMe.size} seat(s) selected — total ${selectedTotal.toFixed(2)}
          </p>
          <button onClick={handleConfirm} style={{ padding: '8px 16px' }}>
            Confirm booking
          </button>
        </div>
      )}
    </div>
  );
}

function seatColor(seat: EventSeatResponse, isMine: boolean) {
  if (seat.status === 'BOOKED') return '#9ca3af';
  if (seat.status === 'HELD') return isMine ? '#3b82f6' : '#f59e0b';
  return '#fff';
}

function Legend({ color, label, border }: { color: string; label: string; border?: boolean }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span
        style={{
          width: 14,
          height: 14,
          background: color,
          border: border ? '1px solid #ccc' : 'none',
          borderRadius: 3,
        }}
      />
      {label}
    </span>
  );
}
