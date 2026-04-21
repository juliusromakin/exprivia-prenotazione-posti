package com.prenotazioni.exprivia.exprv.service;

import com.prenotazioni.exprivia.exprv.entity.Floor;
import com.prenotazioni.exprivia.exprv.repository.FloorRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FloorService {

    private final FloorRepository floorRepository;

    public FloorService(FloorRepository floorRepository) {
        this.floorRepository = floorRepository;
    }

    public List<Floor> getFloorsByBuilding(Integer buildingId) {
        return floorRepository.findByBuildingId(buildingId);
    }

    public Floor getFloorById(Integer floorId) {
        return floorRepository.findById(floorId)
                .orElseThrow(() -> new RuntimeException("Piano non trovato con ID: " + floorId));
    }

    public Floor updateFloorCoordinates(Integer floorId, String newCoordinatesJson) {
        Floor floor = getFloorById(floorId);

        floor.setCoordinatesJson(newCoordinatesJson);

        return floorRepository.save(floor);
    }
}