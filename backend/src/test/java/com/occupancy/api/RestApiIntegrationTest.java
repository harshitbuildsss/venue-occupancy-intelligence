package com.occupancy.api;

import com.occupancy.domain.Venue;
import com.occupancy.domain.VenueType;
import com.occupancy.persistence.jpa.SpringDataOccupancyEventRepository;
import com.occupancy.persistence.jpa.SpringDataVenueRepository;
import com.occupancy.service.OccupancyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class RestApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private OccupancyService occupancyService;

    @Autowired
    private SpringDataVenueRepository venueRepo;

    @Autowired
    private SpringDataOccupancyEventRepository eventRepo;

    @BeforeEach
    void setUp() {
        eventRepo.deleteAll();
        venueRepo.deleteAll();
    }

    @Test
    @DisplayName("POST /api/v1/venues registers a new venue successfully")
    void testCreateVenueSuccess() throws Exception {
        String json = "{\n" +
                "  \"venueId\": \"mall_001\",\n" +
                "  \"name\": \"Pacific Mall\",\n" +
                "  \"type\": \"MALL\",\n" +
                "  \"capacity\": 1000,\n" +
                "  \"initialOccupancy\": 250\n" +
                "}";

        mockMvc.perform(post("/api/v1/venues")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.venueId", is("mall_001")))
                .andExpect(jsonPath("$.name", is("Pacific Mall")))
                .andExpect(jsonPath("$.type", is("MALL")))
                .andExpect(jsonPath("$.capacity", is(1000)))
                .andExpect(jsonPath("$.currentOccupancy", is(250)))
                .andExpect(jsonPath("$.capacityPercentage", is(25.0)))
                .andExpect(jsonPath("$.crowdStatus", is("QUIET")));
    }

    @Test
    @DisplayName("POST /api/v1/venues returns 400 when validation constraints fail")
    void testCreateVenueValidationFailure() throws Exception {
        String json = "{\n" +
                "  \"venueId\": \"\",\n" +
                "  \"name\": \"\",\n" +
                "  \"type\": null,\n" +
                "  \"capacity\": 0,\n" +
                "  \"initialOccupancy\": -5\n" +
                "}";

        mockMvc.perform(post("/api/v1/venues")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Validation Failed")))
                .andExpect(jsonPath("$.details.venueId", notNullValue()))
                .andExpect(jsonPath("$.details.name", notNullValue()))
                .andExpect(jsonPath("$.details.capacity", notNullValue()));
    }

    @Test
    @DisplayName("POST /api/v1/venues returns 409 Conflict if venueId already exists")
    void testCreateVenueDuplicateConflict() throws Exception {
        Venue v = new Venue("mall_dup", "Pacific Mall", VenueType.MALL, 1000, 0);
        occupancyService.registerVenue(v);

        String json = "{\n" +
                "  \"venueId\": \"mall_dup\",\n" +
                "  \"name\": \"Pacific Mall Duplicate\",\n" +
                "  \"type\": \"MALL\",\n" +
                "  \"capacity\": 1000,\n" +
                "  \"initialOccupancy\": 0\n" +
                "}";

        mockMvc.perform(post("/api/v1/venues")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("GET /api/v1/venues/{venueId} retrieves venue metadata and crowd status")
    void testGetVenueSuccess() throws Exception {
        Venue v = new Venue("gym_01", "Cult Fit", VenueType.GYM, 200, 150);
        occupancyService.registerVenue(v);

        mockMvc.perform(get("/api/v1/venues/gym_01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.venueId", is("gym_01")))
                .andExpect(jsonPath("$.name", is("Cult Fit")))
                .andExpect(jsonPath("$.type", is("GYM")))
                .andExpect(jsonPath("$.capacity", is(200)))
                .andExpect(jsonPath("$.currentOccupancy", is(150)))
                .andExpect(jsonPath("$.capacityPercentage", is(75.0)))
                .andExpect(jsonPath("$.crowdStatus", is("BUSY")));
    }

    @Test
    @DisplayName("GET /api/v1/venues/{venueId} returns 404 when venue does not exist")
    void testGetVenueNotFound() throws Exception {
        mockMvc.perform(get("/api/v1/venues/unknown_venue"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/v1/events processes ENTRY event and increments occupancy (+1)")
    void testIngestEntryEvent() throws Exception {
        Venue v = new Venue("mall_10", "Select Citywalk", VenueType.MALL, 500, 10);
        occupancyService.registerVenue(v);

        String json = "{\n" +
                "  \"eventId\": \"evt_entry_1\",\n" +
                "  \"venueId\": \"mall_10\",\n" +
                "  \"deviceId\": \"gate_north\",\n" +
                "  \"eventType\": \"ENTRY\"\n" +
                "}";

        mockMvc.perform(post("/api/v1/events")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", is("PROCESSED")))
                .andExpect(jsonPath("$.currentOccupancy", is(11)))
                .andExpect(jsonPath("$.crowdStatus", is("QUIET")));
    }

    @Test
    @DisplayName("POST /api/v1/events processes EXIT event and decrements occupancy (-1)")
    void testIngestExitEvent() throws Exception {
        Venue v = new Venue("mall_11", "Select Citywalk", VenueType.MALL, 500, 10);
        occupancyService.registerVenue(v);

        String json = "{\n" +
                "  \"eventId\": \"evt_exit_1\",\n" +
                "  \"venueId\": \"mall_11\",\n" +
                "  \"deviceId\": \"gate_south\",\n" +
                "  \"eventType\": \"EXIT\"\n" +
                "}";

        mockMvc.perform(post("/api/v1/events")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", is("PROCESSED")))
                .andExpect(jsonPath("$.currentOccupancy", is(9)))
                .andExpect(jsonPath("$.crowdStatus", is("QUIET")));
    }

    @Test
    @DisplayName("POST /api/v1/events duplicate eventId returns 200 OK and does NOT double-count")
    void testIngestDuplicateEventIdIsIdempotent() throws Exception {
        Venue v = new Venue("mall_12", "Select Citywalk", VenueType.MALL, 500, 10);
        occupancyService.registerVenue(v);

        String json = "{\n" +
                "  \"eventId\": \"evt_dup_99\",\n" +
                "  \"venueId\": \"mall_12\",\n" +
                "  \"deviceId\": \"gate_south\",\n" +
                "  \"eventType\": \"ENTRY\"\n" +
                "}";

        // First call
        mockMvc.perform(post("/api/v1/events")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", is("PROCESSED")))
                .andExpect(jsonPath("$.currentOccupancy", is(11)));

        // Duplicate call with exact same eventId
        mockMvc.perform(post("/api/v1/events")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("DUPLICATE_IGNORED")))
                .andExpect(jsonPath("$.currentOccupancy", is(11)));
    }

    @Test
    @DisplayName("POST /api/v1/events returns 404 when venueId does not exist")
    void testIngestEventVenueNotFound() throws Exception {
        String json = "{\n" +
                "  \"eventId\": \"evt_lost\",\n" +
                "  \"venueId\": \"non_existent_venue\",\n" +
                "  \"deviceId\": \"gate_1\",\n" +
                "  \"eventType\": \"ENTRY\"\n" +
                "}";

        mockMvc.perform(post("/api/v1/events")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is("INVALID_VENUE_MISMATCH")));
    }

    @Test
    @DisplayName("POST /api/v1/events returns 422 when EXIT is attempted at 0 occupancy")
    void testIngestExitAtZeroOccupancyRejected() throws Exception {
        Venue v = new Venue("empty_lib", "Quiet Library", VenueType.LIBRARY, 100, 0);
        occupancyService.registerVenue(v);

        String json = "{\n" +
                "  \"eventId\": \"evt_underflow\",\n" +
                "  \"venueId\": \"empty_lib\",\n" +
                "  \"deviceId\": \"turnstile_1\",\n" +
                "  \"eventType\": \"EXIT\"\n" +
                "}";

        mockMvc.perform(post("/api/v1/events")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.status", is("REJECTED_NEGATIVE_OCCUPANCY")))
                .andExpect(jsonPath("$.currentOccupancy", is(0)));
    }

    @Test
    @DisplayName("POST /api/v1/events returns 400 for invalid eventType or malformed body")
    void testIngestMalformedEvent() throws Exception {
        String json = "{\n" +
                "  \"eventId\": \"e_malformed\",\n" +
                "  \"venueId\": \"mall_1\",\n" +
                "  \"deviceId\": \"gate_1\",\n" +
                "  \"eventType\": \"TELEPORT\"\n" +
                "}";

        mockMvc.perform(post("/api/v1/events")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Malformed Request")));
    }
}
