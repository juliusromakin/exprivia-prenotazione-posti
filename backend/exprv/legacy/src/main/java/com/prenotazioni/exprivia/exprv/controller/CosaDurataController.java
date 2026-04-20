package com.prenotazioni.exprivia.exprv.controller;

import com.prenotazioni.exprivia.exprv.entity.CosaDurata;
import com.prenotazioni.exprivia.exprv.repository.CosaDurataRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/cose-durata")
public class CosaDurataController {

    private final CosaDurataRepository cosaDurataRepository;

    public CosaDurataController(CosaDurataRepository cosaDurataRepository) {
        this.cosaDurataRepository = cosaDurataRepository;
    }

    @GetMapping
    public List<CosaDurata> getAll() {
        return cosaDurataRepository.findAll();
    }
}