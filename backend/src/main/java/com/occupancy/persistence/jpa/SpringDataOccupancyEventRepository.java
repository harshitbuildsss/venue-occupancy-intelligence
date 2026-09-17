package com.occupancy.persistence.jpa;

import com.occupancy.persistence.entity.OccupancyEventJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface SpringDataOccupancyEventRepository extends JpaRepository<OccupancyEventJpaEntity, Long> {
    boolean existsByEventId(String eventId);
    Optional<OccupancyEventJpaEntity> findByEventId(String eventId);
    List<OccupancyEventJpaEntity> findByVenueIdOrderByTimestampDesc(String venueId);
}
