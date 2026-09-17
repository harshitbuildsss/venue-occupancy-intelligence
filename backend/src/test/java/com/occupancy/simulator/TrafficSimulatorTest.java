package com.occupancy.simulator;

import com.occupancy.domain.EventType;
import com.occupancy.domain.OccupancyEvent;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

import static org.junit.jupiter.api.Assertions.*;

class TrafficSimulatorTest {

    @Test
    @DisplayName("Single event generation produces valid, unique OccupancyEvents")
    void testSingleEventGeneration() {
        List<OccupancyEvent> emitted = new ArrayList<>();
        TrafficSimulator simulator = new TrafficSimulator("mall_001", 1000, 50, null, emitted::add);

        OccupancyEvent event = simulator.generateSingleEvent();

        assertNotNull(event);
        assertEquals("mall_001", event.getVenueId());
        assertNotNull(event.getEventId());
        assertTrue(event.getEventId().startsWith("sim_mall_001_"));
        assertNotNull(event.getDeviceId());
        assertNotNull(event.getEventType());
        assertEquals(1, emitted.size());
    }

    @Test
    @DisplayName("Zero floor protection: Simulator never emits EXIT when occupancy is 0")
    void testZeroFloorProtection() {
        List<OccupancyEvent> emitted = new ArrayList<>();
        // Start with occupancy = 0
        TrafficSimulator simulator = new TrafficSimulator("mall_empty", 500, 0, null, emitted::add);

        // Generate 30 consecutive events when starting at 0
        for (int i = 0; i < 30; i++) {
            OccupancyEvent event = simulator.generateSingleEvent();
            // When occupancy is 0, the first event MUST be an ENTRY
            if (i == 0) {
                assertEquals(EventType.ENTRY, event.getEventType(), "First event at 0 occupancy must be ENTRY");
            }
            assertTrue(simulator.getEstimatedOccupancy() >= 0, "Occupancy must never drop below zero");
        }
    }

    @Test
    @DisplayName("Burst generation produces rapid sequence of events")
    void testBurstGeneration() {
        List<OccupancyEvent> emitted = new ArrayList<>();
        TrafficSimulator simulator = new TrafficSimulator("stadium_01", 5000, 100, null, emitted::add);

        List<OccupancyEvent> burst = simulator.generateBurst();

        assertTrue(burst.size() >= 4, "Burst size should be at least 4");
        assertEquals(burst.size(), emitted.size());
        // Verify all event IDs are distinct
        Set<String> uniqueIds = new HashSet<>();
        for (OccupancyEvent e : burst) {
            assertTrue(uniqueIds.add(e.getEventId()), "Event ID in burst must be unique");
        }
    }

    @Test
    @DisplayName("Custom gates with weights are selected properly")
    void testCustomGateConfiguration() {
        List<GateConfig> customGates = List.of(
            new GateConfig("gate_vip", "VIP Gate", 0.90),
            new GateConfig("gate_regular", "Regular Gate", 0.10)
        );

        List<OccupancyEvent> emitted = new ArrayList<>();
        TrafficSimulator simulator = new TrafficSimulator("vip_club", 200, 10, customGates, emitted::add);

        Map<String, Integer> gateHits = new HashMap<>();
        for (int i = 0; i < 100; i++) {
            OccupancyEvent event = simulator.generateSingleEvent();
            gateHits.put(event.getDeviceId(), gateHits.getOrDefault(event.getDeviceId(), 0) + 1);
        }

        assertTrue(gateHits.getOrDefault("gate_vip", 0) > gateHits.getOrDefault("gate_regular", 0),
                "VIP Gate should receive significantly more traffic due to 90% weight");
    }

    @Test
    @DisplayName("Simulator clean start and stop lifecycle")
    void testStartStopLifecycle() throws InterruptedException {
        List<OccupancyEvent> emitted = new CopyOnWriteArrayList<>();
        TrafficSimulator simulator = new TrafficSimulator("mall_lifecycle", 1000, 10, null, emitted::add);
        simulator.setTickIntervalMillis(50); // fast tick for test

        assertFalse(simulator.isRunning());
        simulator.start();
        assertTrue(simulator.isRunning());

        Thread.sleep(250); // Allow roughly 4-5 ticks
        simulator.stop();
        assertFalse(simulator.isRunning());

        int countAfterStop = emitted.size();
        assertTrue(countAfterStop >= 2, "Should have produced at least 2 events during run");

        Thread.sleep(100);
        assertEquals(countAfterStop, emitted.size(), "No new events should be emitted after stop");
    }
}
