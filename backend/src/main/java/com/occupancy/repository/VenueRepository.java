package com.occupancy.repository;

import com.occupancy.domain.Venue;
import java.util.Optional;
import java.util.List;

public interface VenueRepository {
    Venue save(Venue venue);
    Optional<Venue> findById(String venueId);
    List<Venue> findAll();
    boolean existsById(String venueId);
    void deleteById(String venueId);
}
