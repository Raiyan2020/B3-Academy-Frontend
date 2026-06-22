'use client';

import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';
import { TRIP_PACKAGES } from './care-data.service';

const TRIP_CAPACITY_KEY = 'b3-trip-capacity';

type TripCapacityMap = Record<string, number>;

function readCapacityMap(): TripCapacityMap {
  return readLocalStorageJson<TripCapacityMap>(TRIP_CAPACITY_KEY, {});
}

function writeCapacityMap(map: TripCapacityMap) {
  writeLocalStorageJson(TRIP_CAPACITY_KEY, map);
}

function getBaseSeats(tripId: string): number {
  return TRIP_PACKAGES.find((trip) => trip.id === tripId)?.availableSeats ?? 0;
}

export function getTripAvailableSeats(tripId: string): number {
  const map = readCapacityMap();
  if (tripId in map) return Math.max(0, map[tripId]);
  return getBaseSeats(tripId);
}

export function isTripSoldOut(tripId: string): boolean {
  return getTripAvailableSeats(tripId) <= 0;
}

export function decrementTripSeats(tripId: string): boolean {
  const current = getTripAvailableSeats(tripId);
  if (current <= 0) return false;
  const map = readCapacityMap();
  map[tripId] = current - 1;
  writeCapacityMap(map);
  return true;
}
