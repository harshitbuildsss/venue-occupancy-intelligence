package com.occupancy.persistence;

import com.occupancy.domain.*;
import com.occupancy.persistence.adapter.JpaOccupancyEventRepository;
import com.occupancy.persistence.adapter.JpaVenueRepository;
import com.occupancy.persistence.jpa.SpringDataOccupancyEventRepository;
import com.occupancy.persistence.jpa.SpringDataVenueRepository;
import com.occupancy.repository.OccupancyEventRepository;
import com.occupancy.repository.VenueRepository;
import com.occupancy.service.OccupancyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.annotation.DirtiesContext;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class PersistenceIntegrationTest {

    @Autowired
    private VenueRepository venueRepository;

    @Autowired
    private OccupancyEventRepository eventRepository;

    @Autowired
    private OccupancyService occupancyService;

    @Autowired
    private SpringDataVenueRepository springDataVenueRepo;

    @Autowired
    private SpringDataOccupancyEventRepository springDataEventRepo;

    @BeforeEach
    void setUp() {
        springDataEventRepo.deleteAll();
        springDataVenueRepo.deleteAll();
    }

    @Test
    @DisplayName("Venue persists and can be retrieved accurately")
    void testVenuePersistenceAndRetrieval() {
        Venue mall = new Venue("mall_pacific", "Pacific Mall", VenueType.MALL, 5000, 1500);
        venueRepository.save(mall);

        Optional<Venue> retrievedOpt = venueRepository.findById("mall_pacific");
        assertTrue(retrievedOpt.isPresent(), "Venue should be found in DB");

        Venue retrieved = retrievedOpt.get();
        assertEquals("mall_pacific", retrieved.getVenueId());
        assertEquals("Pacific Mall", retrieved.getName());
        assertEquals(VenueType.MALL, retrieved.getType());
        assertEquals(5000, retrieved.getCapacity());
        assertEquals(1500, retrieved.getCurrentOccupancy());
        assertEquals(CrowdStatus.MODERATE, retrieved.getStatus());
    }

    @Test
    @DisplayName("OccupancyEvent persists with all metadata and can be retrieved")
    void testOccupancyEventPersistence() {
        OccupancyEvent event = new OccupancyEvent("evt_entry_001", "mall_pacific", "gate_1", EventType.ENTRY, Instant.now());
        eventRepository.save(event);

        Optional<OccupancyEvent> retrievedOpt = eventRepository.findByEventId("evt_entry_001");
        assertTrue(retrievedOpt.isPresent());

        OccupancyEvent retrieved = retrievedOpt.get();
        assertEquals("evt_entry_001", retrieved.getEventId());
        assertEquals("mall_pacific", retrieved.getVenueId());
        assertEquals("gate_1", retrieved.getDeviceId());
        assertEquals(EventType.ENTRY, retrieved.getEventType());
    }

    @Test
    @DisplayName("Database-level UNIQUE constraint rejects duplicate eventId at repository level")
    void testDatabaseUniqueConstraintRejectsDuplicateEventId() {
        OccupancyEvent event1 = new OccupancyEvent("evt_unique_1", "mall_pacific", "gate_1", EventType.ENTRY, Instant.now());
        eventRepository.save(event1);

        OccupancyEvent event2 = new OccupancyEvent("evt_unique_1", "mall_pacific", "gate_2", EventType.EXIT, Instant.now());

        assertThrows(DataIntegrityViolationException.class, () -> {
            eventRepository.save(event2);
            springDataEventRepo.flush();
        }, "Saving identical eventId must violate unique constraint in DB");
    }

    @Test
    @DisplayName("Duplicate eventId is safely ignored in OccupancyService and does not double-count")
    void testDuplicateEventIgnoredByService() {
        Venue venue = new Venue("gym_01", "Gold's Gym", VenueType.GYM, 200, 50);
        occupancyService.registerVenue(venue);

        OccupancyEvent event = new OccupancyEvent("evt_card_100", "gym_01", "turnstile_1", EventType.ENTRY, Instant.now());

        EventProcessingResult result1 = occupancyService.processEvent(event);
        assertEquals(EventProcessingStatus.PROCESSED, result1.status());
        assertEquals(51, result1.resultingOccupancy());

        EventProcessingResult result2 = occupancyService.processEvent(event);
        assertEquals(EventProcessingStatus.DUPLICATE_IGNORED, result2.status());
        assertEquals(51, result2.resultingOccupancy());

        Venue reloaded = occupancyService.getVenue("gym_01").orElseThrow();
        assertEquals(51, reloaded.getCurrentOccupancy(), "Occupancy must stay at 51");
    }

    @Test
    @DisplayName("Venue occupancy state survives repository reloads across multiple events")
    void testVenueOccupancySurvivesReloads() {
        Venue venue = new Venue("lib_01", "Central Library", VenueType.LIBRARY, 100, 0);
        venueRepository.save(venue);

        occupancyService.processEvent(new OccupancyEvent("e1", "lib_01", "g1", EventType.ENTRY, Instant.now()));
        occupancyService.processEvent(new OccupancyEvent("e2", "lib_01", "g1", EventType.ENTRY, Instant.now()));
        occupancyService.processEvent(new OccupancyEvent("e3", "lib_01", "g1", EventType.EXIT, Instant.now()));

        Venue freshVenue = venueRepository.findById("lib_01").orElseThrow();
        assertEquals(1, freshVenue.getCurrentOccupancy());
        assertEquals(CrowdStatus.QUIET, freshVenue.getStatus());
    }

    @Test
    @DisplayName("Data survives across distinct service and repository instances within the same H2 DB")
    void testDataSurvivesAcrossDistinctServiceInstances() {
        VenueRepository customVenueRepo = new JpaVenueRepository(springDataVenueRepo);
        OccupancyEventRepository customEventRepo = new JpaOccupancyEventRepository(springDataEventRepo);
        OccupancyService secondaryService = new OccupancyService(customVenueRepo, customEventRepo);

        Venue v = new Venue("cafe_01", "Main Cafeteria", VenueType.CAFETERIA, 50, 10);
        occupancyService.registerVenue(v);

        occupancyService.processEvent(new OccupancyEvent("e_cafe_1", "cafe_01", "door_a", EventType.ENTRY, Instant.now()));

        Optional<Venue> retrieved = secondaryService.getVenue("cafe_01");
        assertTrue(retrieved.isPresent());
        assertEquals(11, retrieved.get().getCurrentOccupancy());

        EventProcessingResult res = secondaryService.processEvent(new OccupancyEvent("e_cafe_2", "cafe_01", "door_b", EventType.ENTRY, Instant.now()));
        assertEquals(EventProcessingStatus.PROCESSED, res.status());
        assertEquals(12, res.resultingOccupancy());

        Venue finalVenue = customVenueRepo.findById("cafe_01").orElseThrow();
        assertEquals(12, finalVenue.getCurrentOccupancy());
    }
}
