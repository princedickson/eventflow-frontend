import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { EventSeatResponse } from '../types';

/**
 * Subscribes to /topic/events/{eventId}/seats — the same topic
 * SeatUpdatePublisher.java broadcasts to on the backend. Every time any
 * user anywhere holds, releases, books, or auto-expires a seat for this
 * event, onSeatUpdate fires with the new seat state.
 *
 * We keep the callback in a ref so the effect below only re-runs when
 * eventId actually changes — not every time the parent component
 * re-renders and passes a new function reference.
 */
export function useSeatSocket(eventId: number, onSeatUpdate: (seat: EventSeatResponse) => void) {
  const callbackRef = useRef(onSeatUpdate);
  callbackRef.current = onSeatUpdate;

  useEffect(() => {
    const stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000, // auto-reconnect if the connection drops
      onConnect: () => {
        stompClient.subscribe(`/topic/events/${eventId}/seats`, (message) => {
          const seat: EventSeatResponse = JSON.parse(message.body);
          callbackRef.current(seat);
        });
      },
    });

    stompClient.activate();

    // Cleanup — runs when the component unmounts or eventId changes, so we
    // never leave stale connections open (e.g. navigating away from an
    // event page shouldn't keep listening to it forever).
    return () => {
      stompClient.deactivate();
    };
  }, [eventId]);
}
