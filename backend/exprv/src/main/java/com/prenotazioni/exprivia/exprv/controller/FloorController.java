package com.prenotazioni.exprivia.exprv.controller;

import java.util.List;

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
import com.prenotazioni.exprivia.exprv.dto.SelectOptionDTO;
import com.prenotazioni.exprivia.exprv.service.FloorService;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("/api/admin/floors")
public class FloorController {
    private final FloorService floorService;

    public FloorController(FloorService floorService) {
        this.floorService = floorService;
    }

    @PostMapping(value = "/{id}/upload-plan", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FloorDTO> uploadPlan(@PathVariable Integer id, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(floorService.uploadFloorPlan(id, file));
    }

    @PostMapping("")
    public ResponseEntity<FloorDTO> createFloor(@jakarta.validation.Valid @RequestBody FloorDTO floorDTO) {
        return ResponseEntity.ok(floorService.createFloor(floorDTO));
    }

    @GetMapping("/building/{buildingId}")
    public ResponseEntity<List<FloorDTO>> getAllFloorsByBuildingId(
            @PathVariable Integer buildingId,
            @RequestParam(required = false, defaultValue = "false") boolean enabledOnly) {
        return ResponseEntity.ok(floorService.findFloorsByBuildingId(buildingId, enabledOnly));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FloorDTO> updateFloor(@PathVariable Integer id,
            @jakarta.validation.Valid @RequestBody FloorDTO floorDTO) {
        return ResponseEntity.ok(floorService.updateFloor(id, floorDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> softDeleteFloor(@PathVariable Integer id) {
        floorService.softDeleteFloor(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/hard")
    public ResponseEntity<Void> hardDeleteFloor(@PathVariable Integer id) {
        floorService.hardDeleteFloor(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/building/{buildingId}/options")
    public ResponseEntity<List<SelectOptionDTO>> getFloorOptions(@PathVariable Integer buildingId) {
        return ResponseEntity.ok(floorService.getFloorOptionsByBuilding(buildingId));
    }
}
