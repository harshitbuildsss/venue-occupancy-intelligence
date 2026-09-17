const BASE_URL = '/api/v1';

export async function fetchVenue(venueId) {
  const response = await fetch(`${BASE_URL}/venues/${venueId}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to fetch venue: ${response.statusText}`);
  }
  return response.json();
}

export async function createVenue(venueData) {
  const response = await fetch(`${BASE_URL}/venues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(venueData),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to create venue: ${response.status}`);
  }
  return response.json();
}

export async function sendOccupancyEvent({ venueId, eventType, deviceId = 'gate_main' }) {
  const eventId = `evt_${venueId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const payload = {
    eventId,
    venueId,
    deviceId,
    eventType,
    timestamp: new Date().toISOString()
  };

  const response = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `Event rejected with status ${response.status}`);
  }
  return response.json();
}
