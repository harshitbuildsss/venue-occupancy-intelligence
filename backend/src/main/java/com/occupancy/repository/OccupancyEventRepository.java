package com.occupancy.repository;

import com.occupancy.domain.OccupancyEvent;
import java.util.Optional;
import java.util.List;

public interface OccupancyEventRepository {
    OccupancyEvent save(OccupancyEvent event);
    Optional<OccupancyEvent> findByEventId(String eventId);
    boolean existsByEventId(String eventId);
    List<OccupancyEvent> findByVenueIdOrderByTimestampDesc(String venueId);
}
