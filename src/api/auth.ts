import client from './client';
import type { AuthResponse } from '../types';

export function register(email: string, password: string, fullName: string) {
  return client
    .post<AuthResponse>('/auth/register', { email, password, fullName })
    .then((res) => res.data);
}

export function login(email: string, password: string) {
  return client
    .post<AuthResponse>('/auth/login', { email, password })
    .then((res) => res.data);
}
