package com.prenotazioni.exprivia.exprv.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.prenotazioni.exprivia.exprv.dto.BuildingDTO;
import com.prenotazioni.exprivia.exprv.service.BuildingService;

import io.swagger.v3.oas.annotations.parameters.RequestBody;

@RestController
@RequestMapping("/api/buildings")
public class BuildingController {
    private final BuildingService service;

    @PostMapping
    public ResponseEntity<BuildingDTO> create(@RequestBody BuildingDTO dto) {
        return ResponseEntity.ok(service.save(dto));
    }

}
