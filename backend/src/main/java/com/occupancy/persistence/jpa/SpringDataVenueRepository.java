package com.occupancy.persistence.jpa;

import com.occupancy.persistence.entity.VenueJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SpringDataVenueRepository extends JpaRepository<VenueJpaEntity, String> {
}
