package com.occupancy.persistence.entity;

import com.occupancy.domain.CrowdStatus;
import com.occupancy.domain.Venue;
import com.occupancy.domain.VenueType;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "venues")
public class VenueJpaEntity {

    @Id
    @Column(name = "venue_id", nullable = false, length = 64)
    private String venueId;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 32)
    private VenueType type;

    @Column(name = "capacity", nullable = false)
    private int capacity;

    @Column(name = "current_occupancy", nullable = false)
    private int currentOccupancy;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private CrowdStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public VenueJpaEntity() {
    }

    public VenueJpaEntity(String venueId, String name, VenueType type, int capacity, int currentOccupancy, CrowdStatus status, Instant createdAt) {
        this.venueId = venueId;
        this.name = name;
        this.type = type;
        this.capacity = capacity;
        this.currentOccupancy = currentOccupancy;
        this.status = status;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    public static VenueJpaEntity fromDomain(Venue venue) {
        return new VenueJpaEntity(
            venue.getVenueId(),
            venue.getName(),
            venue.getType(),
            venue.getCapacity(),
            venue.getCurrentOccupancy(),
            venue.getStatus(),
            venue.getCreatedAt()
        );
    }

    public Venue toDomain() {
        return new Venue(
            this.venueId,
            this.name,
            this.type,
            this.capacity,
            this.currentOccupancy
        );
    }

    public String getVenueId() {
        return venueId;
    }

    public void setVenueId(String venueId) {
        this.venueId = venueId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public VenueType getType() {
        return type;
    }

    public void setType(VenueType type) {
        this.type = type;
    }

    public int getCapacity() {
        return capacity;
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }

    public int getCurrentOccupancy() {
        return currentOccupancy;
    }

    public void setCurrentOccupancy(int currentOccupancy) {
        this.currentOccupancy = currentOccupancy;
    }

    public CrowdStatus getStatus() {
        return status;
    }

    public void setStatus(CrowdStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
