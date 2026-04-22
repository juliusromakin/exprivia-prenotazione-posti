package com.prenotazioni.exprivia.exprv.service;

import com.prenotazioni.exprivia.exprv.dto.BuildingDTO;
import com.prenotazioni.exprivia.exprv.entity.Building;
import com.prenotazioni.exprivia.exprv.mapper.BuildingMapper;
import com.prenotazioni.exprivia.exprv.repository.BuildingRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BuildingService {

    private final BuildingRepository buildingRepository;
    private final BuildingMapper buildingMapper;

    public BuildingService(BuildingRepository buildingRepository, BuildingMapper buildingMapper) {
        this.buildingRepository = buildingRepository;
        this.buildingMapper = buildingMapper;
    }

    public List<BuildingDTO> getBuildingsByLocation(Integer locationId) {
        return buildingRepository.findByLocationId(locationId).stream()
                .map(buildingMapper::toDto)
                .collect(Collectors.toList());
    }

    public BuildingDTO save(BuildingDTO dto) {
        Building entity = buildingMapper.toEntity(dto);
        return buildingMapper.toDto(buildingRepository.save(entity));
    }

    public void delete(Integer id) {
        buildingRepository.deleteById(id);
    }
}