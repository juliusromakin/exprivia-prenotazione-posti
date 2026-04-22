package com.prenotazioni.exprivia.exprv.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.prenotazioni.exprivia.exprv.dto.FloorDTO;
import com.prenotazioni.exprivia.exprv.service.FloorService;

@RestController
@RequestMapping("/api/floors")
public class FloorController {
    private final FloorService service;

    public FloorController(FloorService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<FloorDTO> create(@RequestBody FloorDTO dto) {
        return ResponseEntity.ok(service.save(dto));
    }
}
