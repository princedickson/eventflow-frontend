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

  // Keeps callbackRef.current pointing at the latest onSeatUpdate function,
  // without needing to restart the WebSocket connection every time it
  // changes — that's why this is a separate effect from the one below.
  useEffect(() => {
    callbackRef.current = onSeatUpdate;
  }, [onSeatUpdate]);

  useEffect(() => {
    const stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        stompClient.subscribe(`/topic/events/${eventId}/seats`, (message) => {
          const seat: EventSeatResponse = JSON.parse(message.body);
          callbackRef.current(seat);
        });
      },
    });

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, [eventId]);
}
