package com.occupancy.simulator;

import com.occupancy.domain.EventType;
import com.occupancy.domain.OccupancyEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Autonomous Multi-Gate Traffic Simulator.
 * Simulates foot traffic across multiple gates with configurable velocity,
 * activity weights, and occasional bursts.
 */
public class TrafficSimulator {

    private static final Logger log = LoggerFactory.getLogger(TrafficSimulator.class);

    private final String venueId;
    private final int capacity;
    private final List<GateConfig> gates;
    private final EventSink eventSink;
    private final AtomicInteger estimatedOccupancy;
    private final AtomicLong eventSequence = new AtomicLong(1000);
    private final Random random = new Random();

    private final AtomicBoolean isRunning = new AtomicBoolean(false);
    private ScheduledExecutorService scheduler;
    private long tickIntervalMillis = 300; // Default 300ms per tick

    public TrafficSimulator(String venueId, int capacity, int initialOccupancy, List<GateConfig> gates, EventSink eventSink) {
        this.venueId = Objects.requireNonNull(venueId, "venueId must not be null");
        if (capacity <= 0) throw new IllegalArgumentException("capacity must be positive");
        this.capacity = capacity;
        this.estimatedOccupancy = new AtomicInteger(Math.max(0, initialOccupancy));
        this.gates = (gates == null || gates.isEmpty()) ? defaultGates() : new ArrayList<>(gates);
        this.eventSink = Objects.requireNonNull(eventSink, "eventSink must not be null");
    }

    public static List<GateConfig> defaultGates() {
        return List.of(
            new GateConfig("gate_main", "Main Entrance (Gate A)", 0.45),
            new GateConfig("gate_food_court", "Food Court (Gate B)", 0.30),
            new GateConfig("gate_parking", "Parking Elevator (Gate C)", 0.15),
            new GateConfig("gate_rear", "Rear Service / Side (Gate D)", 0.10)
        );
    }

    public synchronized void start() {
        if (isRunning.compareAndSet(false, true)) {
            scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
                Thread t = new Thread(r, "traffic-simulator-" + venueId);
                t.setDaemon(true);
                return t;
            });
            scheduler.scheduleWithFixedDelay(this::tick, 100, tickIntervalMillis, TimeUnit.MILLISECONDS);
            log.info("Traffic simulator started for venue {} at interval {}ms", venueId, tickIntervalMillis);
        }
    }

    public synchronized void stop() {
        if (isRunning.compareAndSet(true, false)) {
            if (scheduler != null && !scheduler.isShutdown()) {
                scheduler.shutdownNow();
            }
            log.info("Traffic simulator stopped for venue {}", venueId);
        }
    }

    public void tick() {
        if (!isRunning.get()) return;

        // Occasional burst: 8% probability of a rapid crowd arrival/departure burst
        if (random.nextDouble() < 0.08) {
            generateBurst();
        } else {
            generateSingleEvent();
        }
    }

    public OccupancyEvent generateSingleEvent() {
        GateConfig gate = selectGateByWeight();
        EventType eventType = decideEventType();

        // Never generate an EXIT when occupancy is 0
        if (eventType == EventType.EXIT && estimatedOccupancy.get() <= 0) {
            eventType = EventType.ENTRY;
        }

        if (eventType == EventType.ENTRY) {
            estimatedOccupancy.incrementAndGet();
        } else {
            estimatedOccupancy.updateAndGet(curr -> Math.max(0, curr - 1));
        }

        String eventId = "sim_" + venueId + "_" + System.currentTimeMillis() + "_" + eventSequence.incrementAndGet();
        OccupancyEvent event = new OccupancyEvent(eventId, venueId, gate.gateId(), eventType, Instant.now());
        
        eventSink.emit(event);
        return event;
    }

    public List<OccupancyEvent> generateBurst() {
        int burstSize = 4 + random.nextInt(6); // 4 to 9 events
        List<OccupancyEvent> burstEvents = new ArrayList<>(burstSize);
        EventType burstType = estimatedOccupancy.get() < (capacity * 0.3) ? EventType.ENTRY : (random.nextBoolean() ? EventType.ENTRY : EventType.EXIT);

        for (int i = 0; i < burstSize; i++) {
            GateConfig gate = selectGateByWeight();
            if (burstType == EventType.EXIT && estimatedOccupancy.get() <= 0) {
                burstType = EventType.ENTRY;
            }

            if (burstType == EventType.ENTRY) {
                estimatedOccupancy.incrementAndGet();
            } else {
                estimatedOccupancy.updateAndGet(curr -> Math.max(0, curr - 1));
            }

            String eventId = "sim_burst_" + venueId + "_" + System.currentTimeMillis() + "_" + eventSequence.incrementAndGet();
            OccupancyEvent event = new OccupancyEvent(eventId, venueId, gate.gateId(), burstType, Instant.now());
            eventSink.emit(event);
            burstEvents.add(event);
        }
        return burstEvents;
    }

    private EventType decideEventType() {
        int current = estimatedOccupancy.get();
        double ratio = (double) current / capacity;

        // Adaptive probability: If venue is near empty, favor ENTRY. If full, favor EXIT.
        double entryProbability;
        if (ratio < 0.20) {
            entryProbability = 0.85;
        } else if (ratio < 0.50) {
            entryProbability = 0.65;
        } else if (ratio < 0.80) {
            entryProbability = 0.50;
        } else {
            entryProbability = 0.25;
        }

        return random.nextDouble() < entryProbability ? EventType.ENTRY : EventType.EXIT;
    }

    private GateConfig selectGateByWeight() {
        double totalWeight = gates.stream().mapToDouble(GateConfig::trafficWeight).sum();
        double r = random.nextDouble() * totalWeight;
        double cumulative = 0.0;
        for (GateConfig gate : gates) {
            cumulative += gate.trafficWeight();
            if (r <= cumulative) {
                return gate;
            }
        }
        return gates.get(0);
    }

    public void setTickIntervalMillis(long tickIntervalMillis) {
        if (tickIntervalMillis <= 0) throw new IllegalArgumentException("Interval must be positive");
        this.tickIntervalMillis = tickIntervalMillis;
    }

    public boolean isRunning() {
        return isRunning.get();
    }

    public int getEstimatedOccupancy() {
        return estimatedOccupancy.get();
    }

    public String getVenueId() {
        return venueId;
    }
}
