package com.prenotazioni.exprivia.exprv.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.prenotazioni.exprivia.exprv.dto.FloorPlanDTO;
import com.prenotazioni.exprivia.exprv.service.FloorPlanService;

@RestController
@RequestMapping("/api/admin/floor-plans")
public class AdminFloorPlanController {

    private final FloorPlanService floorPlanService;

    public AdminFloorPlanController(FloorPlanService floorPlanService) {
        this.floorPlanService = floorPlanService;
    }

    @PostMapping("/save")
    public ResponseEntity<Void> saveFloorPlan(@RequestBody FloorPlanDTO floorPlanDTO) {
        floorPlanService.saveFloorPlan(floorPlanDTO);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{floorId}")
    public ResponseEntity<FloorPlanDTO> getFloorPlan(@PathVariable Integer floorId) {
        return ResponseEntity.ok(floorPlanService.getFloorPlan(floorId));
    }

    @PostMapping(value = "/{floorId}/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadImage(@PathVariable Integer floorId, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(floorPlanService.uploadFloorPlanImage(floorId, file));
    }
}
