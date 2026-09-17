package com.occupancy.persistence.adapter;

import com.occupancy.domain.OccupancyEvent;
import com.occupancy.persistence.entity.OccupancyEventJpaEntity;
import com.occupancy.persistence.jpa.SpringDataOccupancyEventRepository;
import com.occupancy.repository.OccupancyEventRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class JpaOccupancyEventRepository implements OccupancyEventRepository {

    private final SpringDataOccupancyEventRepository springDataRepo;

    public JpaOccupancyEventRepository(SpringDataOccupancyEventRepository springDataRepo) {
        this.springDataRepo = Objects.requireNonNull(springDataRepo, "springDataRepo must not be null");
    }

    @Override
    public OccupancyEvent save(OccupancyEvent event) {
        OccupancyEventJpaEntity entity = OccupancyEventJpaEntity.fromDomain(event);
        OccupancyEventJpaEntity saved = springDataRepo.save(entity);
        return saved.toDomain();
    }

    @Override
    public Optional<OccupancyEvent> findByEventId(String eventId) {
        return springDataRepo.findByEventId(eventId).map(OccupancyEventJpaEntity::toDomain);
    }

    @Override
    public boolean existsByEventId(String eventId) {
        return springDataRepo.existsByEventId(eventId);
    }

    @Override
    public List<OccupancyEvent> findByVenueIdOrderByTimestampDesc(String venueId) {
        return springDataRepo.findByVenueIdOrderByTimestampDesc(venueId).stream()
                .map(OccupancyEventJpaEntity::toDomain)
                .collect(Collectors.toList());
    }
}
