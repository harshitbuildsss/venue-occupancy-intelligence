package com.occupancy.domain;

import java.time.Instant;
import java.util.Objects;

public class Venue {
    private final String venueId;
    private final String name;
    private final VenueType type;
    private final int capacity;
    private int currentOccupancy;
    private CrowdStatus status;
    private final Instant createdAt;

    public Venue(String venueId, String name, VenueType type, int capacity, int initialOccupancy) {
        this.venueId = Objects.requireNonNull(venueId, "venueId must not be null");
        this.name = Objects.requireNonNull(name, "name must not be null");
        this.type = Objects.requireNonNull(type, "type must not be null");
        if (capacity <= 0) {
            throw new IllegalArgumentException("Capacity must be greater than 0");
        }
        if (initialOccupancy < 0) {
            throw new IllegalArgumentException("Initial occupancy cannot be negative");
        }
        this.capacity = capacity;
        this.currentOccupancy = initialOccupancy;
        this.status = CrowdStatus.calculate(this.currentOccupancy, this.capacity);
        this.createdAt = Instant.now();
    }

    public Venue(String venueId, String name, VenueType type, int capacity) {
        this(venueId, name, type, capacity, 0);
    }

    public String getVenueId() {
        return venueId;
    }

    public String getName() {
        return name;
    }

    public VenueType getType() {
        return type;
    }

    public int getCapacity() {
        return capacity;
    }

    public int getCurrentOccupancy() {
        return currentOccupancy;
    }

    public CrowdStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public double getCapacityPercentage() {
        return ((double) currentOccupancy / capacity) * 100.0;
    }

    void updateOccupancy(int newOccupancy) {
        this.currentOccupancy = newOccupancy;
        this.status = CrowdStatus.calculate(this.currentOccupancy, this.capacity);
    }
}
