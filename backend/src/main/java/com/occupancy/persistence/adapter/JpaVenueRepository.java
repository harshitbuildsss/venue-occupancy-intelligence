package com.occupancy.persistence.adapter;

import com.occupancy.domain.Venue;
import com.occupancy.persistence.entity.VenueJpaEntity;
import com.occupancy.persistence.jpa.SpringDataVenueRepository;
import com.occupancy.repository.VenueRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class JpaVenueRepository implements VenueRepository {

    private final SpringDataVenueRepository springDataRepo;

    public JpaVenueRepository(SpringDataVenueRepository springDataRepo) {
        this.springDataRepo = Objects.requireNonNull(springDataRepo, "springDataRepo must not be null");
    }

    @Override
    public Venue save(Venue venue) {
        VenueJpaEntity entity = VenueJpaEntity.fromDomain(venue);
        VenueJpaEntity saved = springDataRepo.save(entity);
        return saved.toDomain();
    }

    @Override
    public Optional<Venue> findById(String venueId) {
        return springDataRepo.findById(venueId).map(VenueJpaEntity::toDomain);
    }

    @Override
    public List<Venue> findAll() {
        return springDataRepo.findAll().stream()
                .map(VenueJpaEntity::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public boolean existsById(String venueId) {
        return springDataRepo.existsById(venueId);
    }

    @Override
    public void deleteById(String venueId) {
        springDataRepo.deleteById(venueId);
    }
}
