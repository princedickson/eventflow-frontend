import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as eventsApi from '../api/events';
import type { EventResponse } from '../types';
import { useAuth } from '../context/AuthContext';

export default function EventsListPage() {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    eventsApi
      .fetchEvents()
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Upcoming Events</h2>
        <div>
          <span style={{ marginRight: 12 }}>{user?.fullName}</span>
          <button onClick={logout}>Log out</button>
        </div>
      </div>

      {loading && <p>Loading…</p>}
      {!loading && events.length === 0 && (
        <p>No events yet — create one via the API, or Postman, to see it here.</p>
      )}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {events.map((event) => (
          <li
            key={event.id}
            style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 12 }}
          >
            <Link
              to={`/events/${event.id}`}
              style={{ fontSize: 18, fontWeight: 'bold', textDecoration: 'none' }}
            >
              {event.title}
            </Link>
            <p style={{ margin: '4px 0', color: '#666' }}>{event.venueName}</p>
            <p style={{ margin: 0, color: '#666' }}>{new Date(event.startsAt).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
