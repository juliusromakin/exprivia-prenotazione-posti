package com.prenotazioni.exprivia.exprv.controller;

import com.prenotazioni.exprivia.exprv.dto.BuildingDTO;
import com.prenotazioni.exprivia.exprv.dto.SelectOptionDTO;
import com.prenotazioni.exprivia.exprv.service.BuildingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/buildings")
public class BuildingController {

    private final BuildingService buildingService;

    public BuildingController(BuildingService buildingService) {
        this.buildingService = buildingService;
    }

    @GetMapping
    public ResponseEntity<List<BuildingDTO>> getAllBuildings(@RequestParam(required = false, defaultValue = "false") boolean enabledOnly) {
        return ResponseEntity.ok(buildingService.findAllBuildings(enabledOnly));
    }

    @GetMapping("/location/{locationId}")
    public ResponseEntity<List<BuildingDTO>> getBuildingsByLocation(
            @PathVariable Integer locationId,
            @RequestParam(required = false, defaultValue = "false") boolean enabledOnly) {
        return ResponseEntity.ok(buildingService.findBuildingsByLocationId(locationId, enabledOnly));
    }

    @GetMapping("/location/{locationId}/options")
    public ResponseEntity<List<SelectOptionDTO>> getBuildingOptions(@PathVariable Integer locationId) {
        return ResponseEntity.ok(buildingService.getBuildingOptionsByLocation(locationId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BuildingDTO> getBuildingById(@PathVariable Integer id) {
        return ResponseEntity.ok(buildingService.findBuildingById(id));
    }

    @PostMapping
    public ResponseEntity<BuildingDTO> createBuilding(@jakarta.validation.Valid @RequestBody BuildingDTO buildingDTO) {
        return ResponseEntity.ok(buildingService.createBuilding(buildingDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BuildingDTO> updateBuilding(@PathVariable Integer id, @jakarta.validation.Valid @RequestBody BuildingDTO buildingDTO) {
        return ResponseEntity.ok(buildingService.updateBuilding(id, buildingDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> softDeleteBuilding(@PathVariable Integer id) {
        buildingService.softDeleteBuilding(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/hard")
    public ResponseEntity<Void> hardDeleteBuilding(@PathVariable Integer id) {
        buildingService.hardDeleteBuilding(id);
        return ResponseEntity.noContent().build();
    }
}
