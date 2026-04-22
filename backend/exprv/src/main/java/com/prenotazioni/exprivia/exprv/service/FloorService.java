package com.prenotazioni.exprivia.exprv.service;

import com.prenotazioni.exprivia.exprv.dto.FloorDTO;
import com.prenotazioni.exprivia.exprv.entity.Floor;
import com.prenotazioni.exprivia.exprv.mapper.FloorMapper;
import com.prenotazioni.exprivia.exprv.repository.FloorRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FloorService {

    private final FloorRepository floorRepository;

    private final FloorMapper floorMapper;

    public FloorService(FloorRepository floorRepository, FloorMapper floorMapper) {
        this.floorRepository = floorRepository;
        this.floorMapper = floorMapper;
    }

    public List<FloorDTO> getFloorsByBuilding(Integer buildingId) {
        return floorRepository.findByBuildingId(buildingId).stream()
                .map(floorMapper::toDto)
                .collect(Collectors.toList());
    }

    public Floor getFloorById(Integer floorId) {
        return floorRepository.findById(floorId)
                .orElseThrow(() -> new RuntimeException("Piano non trovato con ID: " + floorId));
    }

    // Ora questo metodo non darà più errore rosso!
    public FloorDTO save(FloorDTO dto) {
        Floor entityToSave = floorMapper.toEntity(dto);
        Floor savedEntity = floorRepository.save(entityToSave);
        return floorMapper.toDto(savedEntity);
    }

    public void delete(Integer id) {
        floorRepository.deleteById(id);
    }
}