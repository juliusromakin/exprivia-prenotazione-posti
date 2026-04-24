package com.prenotazioni.exprivia.exprv.controller;

import com.prenotazioni.exprivia.exprv.dto.LocationDTO;
import com.prenotazioni.exprivia.exprv.dto.SelectOptionDTO;
import com.prenotazioni.exprivia.exprv.service.LocationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/locations")
public class LocationController {

    private final LocationService locationService;

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    @GetMapping
    public ResponseEntity<List<LocationDTO>> getAllLocations(
            @RequestParam(required = false, defaultValue = "false") boolean enabledOnly) {
        return ResponseEntity.ok(locationService.findAllLocations(enabledOnly));
    }

    @GetMapping("/options")
    public ResponseEntity<List<SelectOptionDTO>> getLocationOptions() {
        return ResponseEntity.ok(locationService.getLocationOptions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LocationDTO> getLocationById(@PathVariable Integer id) {
        return ResponseEntity.ok(locationService.findLocationById(id));
    }

    @PostMapping
    public ResponseEntity<LocationDTO> createLocation(@jakarta.validation.Valid @RequestBody LocationDTO locationDTO) {
        return ResponseEntity.ok(locationService.createLocation(locationDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LocationDTO> updateLocation(@PathVariable Integer id,
            @jakarta.validation.Valid @RequestBody LocationDTO locationDTO) {
        return ResponseEntity.ok(locationService.updateLocation(id, locationDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> softDeleteLocation(@PathVariable Integer id) {
        locationService.softDeleteLocation(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/hard")
    public ResponseEntity<Void> hardDeleteLocation(@PathVariable Integer id) {
        locationService.hardDeleteLocation(id);
        return ResponseEntity.noContent().build();
    }
}
