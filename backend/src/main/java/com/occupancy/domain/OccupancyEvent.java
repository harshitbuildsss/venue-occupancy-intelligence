package com.occupancy.domain;

import java.time.Instant;
import java.util.Objects;

public class OccupancyEvent {
    private final String eventId;
    private final String venueId;
    private final String deviceId;
    private final EventType eventType;
    private final Instant timestamp;

    public OccupancyEvent(String eventId, String venueId, String deviceId, EventType eventType, Instant timestamp) {
        this.eventId = Objects.requireNonNull(eventId, "eventId must not be null");
        this.venueId = Objects.requireNonNull(venueId, "venueId must not be null");
        this.deviceId = Objects.requireNonNull(deviceId, "deviceId must not be null");
        this.eventType = Objects.requireNonNull(eventType, "eventType must not be null");
        this.timestamp = timestamp != null ? timestamp : Instant.now();
    }

    public String getEventId() {
        return eventId;
    }

    public String getVenueId() {
        return venueId;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public EventType getEventType() {
        return eventType;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof OccupancyEvent that)) return false;
        return Objects.equals(eventId, that.eventId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(eventId);
    }
}
