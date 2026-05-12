package com.prenotazioni.exprivia.exprv.controller;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.prenotazioni.exprivia.exprv.dto.FloorDTO;
import com.prenotazioni.exprivia.exprv.dto.FloorPlanDTO;
import com.prenotazioni.exprivia.exprv.dto.SelectOptionDTO;
import com.prenotazioni.exprivia.exprv.service.FloorService;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/admin/floors")
public class FloorController {
    private final FloorService floorService;

    public FloorController(FloorService floorService) {
        this.floorService = floorService;
    }

    @PreAuthorize("hasAuthority('ACTION_FLOORPLAN_CREATE')")
    @PostMapping("")
    public ResponseEntity<FloorDTO> createFloor(@jakarta.validation.Valid @RequestBody FloorDTO floorDTO) {
        return ResponseEntity.ok(floorService.createFloor(floorDTO));
    }

    @PreAuthorize("hasAuthority('ACTION_FLOORPLAN_READ')")
    @GetMapping("/building/{buildingId}")
    public ResponseEntity<List<FloorDTO>> getAllFloorsByBuildingId(
            @PathVariable Integer buildingId,
            @RequestParam(required = false, defaultValue = "false") boolean enabledOnly) {
        return ResponseEntity.ok(floorService.findFloorsByBuildingId(buildingId, enabledOnly));
    }

    @PreAuthorize("hasAuthority('ACTION_FLOORPLAN_UPDATE')")
    @PutMapping("/{id}")
    public ResponseEntity<FloorDTO> updateFloor(@PathVariable Integer id,
            @jakarta.validation.Valid @RequestBody FloorDTO floorDTO) {
        return ResponseEntity.ok(floorService.updateFloor(id, floorDTO));
    }

    @PreAuthorize("hasAuthority('ACTION_FLOORPLAN_DELETE')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> softDeleteFloor(@PathVariable Integer id) {
        floorService.softDeleteFloor(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAuthority('ACTION_FLOORPLAN_DELETE')")
    @DeleteMapping("/{id}/hard")
    public ResponseEntity<Void> hardDeleteFloor(@PathVariable Integer id) {
        floorService.hardDeleteFloor(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAuthority('ACTION_FLOORPLAN_READ')")
    @GetMapping("/building/{buildingId}/options")
    public ResponseEntity<List<SelectOptionDTO>> getFloorOptions(@PathVariable Integer buildingId) {
        return ResponseEntity.ok(floorService.getFloorOptionsByBuilding(buildingId));
    }

}
