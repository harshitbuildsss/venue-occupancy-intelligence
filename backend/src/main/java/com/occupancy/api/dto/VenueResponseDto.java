package com.occupancy.api.dto;

import com.occupancy.domain.CrowdStatus;
import com.occupancy.domain.Venue;
import com.occupancy.domain.VenueType;
import java.time.Instant;

public record VenueResponseDto(
    String venueId,
    String name,
    VenueType type,
    int capacity,
    int currentOccupancy,
    double capacityPercentage,
    CrowdStatus crowdStatus,
    Instant createdAt
) {
    public static VenueResponseDto fromDomain(Venue venue) {
        return new VenueResponseDto(
            venue.getVenueId(),
            venue.getName(),
            venue.getType(),
            venue.getCapacity(),
            venue.getCurrentOccupancy(),
            Math.round(venue.getCapacityPercentage() * 100.0) / 100.0,
            venue.getStatus(),
            venue.getCreatedAt()
        );
    }
}
