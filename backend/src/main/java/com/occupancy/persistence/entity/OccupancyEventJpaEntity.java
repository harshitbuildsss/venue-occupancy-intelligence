package com.occupancy.persistence.entity;

import com.occupancy.domain.EventType;
import com.occupancy.domain.OccupancyEvent;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
    name = "occupancy_events",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_event_id", columnNames = {"event_id"})
    },
    indexes = {
        @Index(name = "idx_event_venue_time", columnList = "venue_id, timestamp")
    }
)
public class OccupancyEventJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false, unique = true, length = 64)
    private String eventId;

    @Column(name = "venue_id", nullable = false, length = 64)
    private String venueId;

    @Column(name = "device_id", nullable = false, length = 64)
    private String deviceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 16)
    private EventType eventType;

    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    public OccupancyEventJpaEntity() {
    }

    public OccupancyEventJpaEntity(String eventId, String venueId, String deviceId, EventType eventType, Instant timestamp) {
        this.eventId = eventId;
        this.venueId = venueId;
        this.deviceId = deviceId;
        this.eventType = eventType;
        this.timestamp = timestamp != null ? timestamp : Instant.now();
    }

    public static OccupancyEventJpaEntity fromDomain(OccupancyEvent event) {
        return new OccupancyEventJpaEntity(
            event.getEventId(),
            event.getVenueId(),
            event.getDeviceId(),
            event.getEventType(),
            event.getTimestamp()
        );
    }

    public OccupancyEvent toDomain() {
        return new OccupancyEvent(
            this.eventId,
            this.venueId,
            this.deviceId,
            this.eventType,
            this.timestamp
        );
    }

    public Long getId() {
        return id;
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public String getVenueId() {
        return venueId;
    }

    public void setVenueId(String venueId) {
        this.venueId = venueId;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public EventType getEventType() {
        return eventType;
    }

    public void setEventType(EventType eventType) {
        this.eventType = eventType;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
