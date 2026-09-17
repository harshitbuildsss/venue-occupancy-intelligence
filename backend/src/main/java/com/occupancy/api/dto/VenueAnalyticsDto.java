package com.occupancy.api.dto;

import com.occupancy.domain.CrowdStatus;

public record VenueAnalyticsDto(
    String venueId,
    int currentOccupancy,
    int capacity,
    double entryRatePerMinute,
    double exitRatePerMinute,
    double netVelocityPerMinute,
    int predictedOccupancy30m,
    CrowdStatus predictedStatus30m,
    int predictedOccupancy60m,
    CrowdStatus predictedStatus60m,
    int windowMinutes
) {}
