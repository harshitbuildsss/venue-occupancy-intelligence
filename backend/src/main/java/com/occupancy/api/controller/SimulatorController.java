package com.occupancy.api.controller;

import com.occupancy.domain.Venue;
import com.occupancy.domain.VenueType;
import com.occupancy.service.OccupancyService;
import com.occupancy.simulator.TrafficSimulator;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/v1/simulator")
@CrossOrigin(origins = "*")
public class SimulatorController {

    private final OccupancyService occupancyService;
    private final Map<String, TrafficSimulator> activeSimulators = new ConcurrentHashMap<>();

    public SimulatorController(OccupancyService occupancyService) {
        this.occupancyService = occupancyService;
        // Pre-seed sample venues for immediate demo readiness
        seedSampleVenues();
    }

    private void seedSampleVenues() {
        if (occupancyService.getVenue("pacific_mall").isEmpty()) {
            occupancyService.registerVenue(new Venue("pacific_mall", "Pacific Mall (Tagore Garden)", VenueType.MALL, 5000, 3840));
        }
        if (occupancyService.getVenue("cult_fit").isEmpty()) {
            occupancyService.registerVenue(new Venue("cult_fit", "Cult.fit Elite Club", VenueType.GYM, 150, 42));
        }
        if (occupancyService.getVenue("central_library").isEmpty()) {
            occupancyService.registerVenue(new Venue("central_library", "Delhi Central Library", VenueType.LIBRARY, 400, 368));
        }
    }

    @PostMapping("/start/{venueId}")
    public ResponseEntity<?> start(@PathVariable("venueId") String venueId,
                                   @RequestParam(defaultValue = "350") long intervalMs) {
        var venueOpt = occupancyService.getVenue(venueId);
        if (venueOpt.isEmpty()) return ResponseEntity.notFound().build();

        Venue v = venueOpt.get();
        TrafficSimulator sim = activeSimulators.computeIfAbsent(venueId, id ->
            new TrafficSimulator(id, v.getCapacity(), v.getCurrentOccupancy(), null, occupancyService::processEvent)
        );

        sim.setTickIntervalMillis(intervalMs);
        sim.start();
        return ResponseEntity.ok(Map.of("status", "RUNNING", "venueId", venueId, "intervalMs", intervalMs));
    }

    @PostMapping("/stop/{venueId}")
    public ResponseEntity<?> stop(@PathVariable("venueId") String venueId) {
        TrafficSimulator sim = activeSimulators.get(venueId);
        if (sim != null) {
            sim.stop();
            return ResponseEntity.ok(Map.of("status", "STOPPED", "venueId", venueId));
        }
        return ResponseEntity.ok(Map.of("status", "NOT_ACTIVE", "venueId", venueId));
    }

    @PostMapping("/burst/{venueId}")
    public ResponseEntity<?> burst(@PathVariable("venueId") String venueId) {
        var venueOpt = occupancyService.getVenue(venueId);
        if (venueOpt.isEmpty()) return ResponseEntity.notFound().build();

        Venue v = venueOpt.get();
        TrafficSimulator sim = activeSimulators.computeIfAbsent(venueId, id ->
            new TrafficSimulator(id, v.getCapacity(), v.getCurrentOccupancy(), null, occupancyService::processEvent)
        );

        var events = sim.generateBurst();
        return ResponseEntity.ok(Map.of("status", "BURST_DISPATCHED", "eventsCount", events.size()));
    }

    @GetMapping("/status/{venueId}")
    public ResponseEntity<?> status(@PathVariable("venueId") String venueId) {
        TrafficSimulator sim = activeSimulators.get(venueId);
        boolean running = sim != null && sim.isRunning();
        return ResponseEntity.ok(Map.of("venueId", venueId, "running", running));
    }
}
