import { CONFIG } from '../config';

export const fetchVenues = async (mode = "AWS") => {
  const baseUrl = mode === "AWS" ? CONFIG.AWS_API_BASE : CONFIG.LOCAL_API_BASE;
  const endpoint = mode === "AWS" ? `${baseUrl}/venues` : `${baseUrl}/venues`;

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`Failed to fetch venues from ${mode} backend: ${response.statusText}`);
  }
  const data = await response.json();

  // Normalize data schema across both backends
  return (Array.isArray(data) ? data : []).map(v => {
    const current = Number(v.currentOccupancy || 0);
    const capacity = Number(v.capacity || 1);
    
    // Calculate uniform 30m & 60m projections and velocity
    const pred60 = v.predictedOccupancyIn60Min !== undefined 
      ? Number(v.predictedOccupancyIn60Min) 
      : Math.min(capacity, Math.max(0, Math.round(current * 0.85)));
      
    const pred30 = Math.min(capacity, Math.max(0, Math.round(current * 0.92)));
    const netVelocity = Math.round((pred60 - current) / 60 * 10) / 10; // delta people/min

    return {
      venueId: v.venueId || v.id,
      name: v.name,
      type: v.type,
      capacity: capacity,
      currentOccupancy: current,
      crowdStatus: v.crowdStatus || (current / capacity > 0.8 ? "BUSY" : current / capacity > 0.4 ? "MODERATE" : "QUIET"),
      occupancyPercentage: Math.round((current / capacity) * 100),
      predictedOccupancyIn30Min: pred30,
      predictedOccupancyIn60Min: pred60,
      velocityPerMin: netVelocity,
      updatedAt: v.updatedAt || new Date().toISOString()
    };
  });
};
