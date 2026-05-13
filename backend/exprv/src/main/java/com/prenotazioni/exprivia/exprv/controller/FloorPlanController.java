package com.prenotazioni.exprivia.exprv.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.prenotazioni.exprivia.exprv.dto.FloorPlanDTO;
import com.prenotazioni.exprivia.exprv.dto.FloorPlanSummaryDTO;
import com.prenotazioni.exprivia.exprv.service.FloorPlanService;

@RestController
@RequestMapping("/api/admin/floor-plans")
public class FloorPlanController {

    private final FloorPlanService floorPlanService;

    public FloorPlanController(FloorPlanService floorPlanService) {
        this.floorPlanService = floorPlanService;
    }

    @PreAuthorize("hasAuthority('ACTION_FLOORPLAN_READ')")
    @GetMapping("/floor/{floorId}")
    public ResponseEntity<List<FloorPlanSummaryDTO>> getFloorPlans(@PathVariable Integer floorId) {
        return ResponseEntity.ok(floorPlanService.getFloorPlansByFloorId(floorId));
    }

    @PreAuthorize("hasAuthority('ACTION_FLOORPLAN_DELETE')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFloorPlan(@PathVariable Integer id) {
        floorPlanService.deleteFloorPlan(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAuthority('ACTION_FLOORPLAN_UPDATE')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<FloorPlanSummaryDTO> toggleStatus(@PathVariable Integer id) {
        return ResponseEntity.ok(floorPlanService.toggleFloorPlanStatus(id));
    }

    @PreAuthorize("hasAuthority('ACTION_FLOORPLAN_READ')")
    @GetMapping("/building/{buildingId}/all")
    public ResponseEntity<List<FloorPlanDTO>> getAllFloorPlansByBuilding(@PathVariable Integer buildingId) {
        return ResponseEntity.ok(floorPlanService.getAllFloorPlansByBuildingId(buildingId));
    }

    @PreAuthorize("hasAuthority('ACTION_FLOORPLAN_UPDATE')")
    @PostMapping("/save")
    public ResponseEntity<FloorPlanDTO> savePlanimetry(@RequestBody FloorPlanDTO floorPlanDTO) {
        return ResponseEntity.ok(floorPlanService.savePlanimetry(floorPlanDTO));
    }

    @PreAuthorize("hasAuthority('ACTION_FLOORPLAN_READ')")
    @GetMapping("/{floorId}/planimetry")
    public ResponseEntity<FloorPlanDTO> getFloorPlanimetry(@PathVariable Integer floorId, @RequestParam(required = false) LocalDate date) {
        return ResponseEntity.ok(floorPlanService.getFloorPlanimetry(floorId, date));
    }

    @PreAuthorize("hasAuthority('ACTION_FLOORPLAN_UPDATE')")
    @PostMapping(value = "/{floorId}/upload-planimetry", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadPlanimetry(@PathVariable Integer floorId, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(floorPlanService.uploadPlanimetryImage(floorId, file));
    }
}
