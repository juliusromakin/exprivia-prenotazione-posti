package com.prenotazioni.exprivia.exprv.service;

import java.util.List;

import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.prenotazioni.exprivia.exprv.dto.BuildingDTO;
import com.prenotazioni.exprivia.exprv.dto.SelectOptionDTO;
import com.prenotazioni.exprivia.exprv.entity.Building;
import com.prenotazioni.exprivia.exprv.entity.Floor;
import com.prenotazioni.exprivia.exprv.entity.Location;
import com.prenotazioni.exprivia.exprv.exceptions.AppException;
import com.prenotazioni.exprivia.exprv.mapper.BuildingMapper;
import com.prenotazioni.exprivia.exprv.repository.BuildingRepository;
import com.prenotazioni.exprivia.exprv.repository.FloorRepository;
import com.prenotazioni.exprivia.exprv.repository.LocationRepository;

@Service
public class BuildingService {

    private final BuildingRepository buildingRepository;
    private final BuildingMapper buildingMapper;
    private final LocationRepository locationRepository;
    private final FloorRepository floorRepository;
    private final FloorService floorService;

    public BuildingService(BuildingRepository buildingRepository, BuildingMapper buildingMapper,
            LocationRepository locationRepository, FloorRepository floorRepository, 
            @Lazy FloorService floorService) {
        this.buildingRepository = buildingRepository;
        this.buildingMapper = buildingMapper;
        this.locationRepository = locationRepository;
        this.floorRepository = floorRepository;
        this.floorService = floorService;
    }

    public List<BuildingDTO> findAllBuildings(boolean enabledOnly) {
        if (enabledOnly) {
            return buildingMapper.toDtoList(buildingRepository.findAllByEnabledTrue());
        }
        return buildingMapper.toDtoList(buildingRepository.findAll());
    }

    public List<BuildingDTO> findBuildingsByLocationId(Integer locationId, boolean enabledOnly) {
        if (enabledOnly) {
            return buildingMapper.toDtoList(buildingRepository.findByLocationIdAndEnabledTrue(locationId));
        }
        return buildingMapper.toDtoList(buildingRepository.findByLocationId(locationId));
    }

    public List<SelectOptionDTO> getBuildingOptionsByLocation(Integer locationId) {
        return buildingMapper.toSelectOptionDTOList(buildingRepository.findByLocationIdAndEnabledTrue(locationId));
    }

    public BuildingDTO findBuildingById(Integer id) {
        return buildingMapper.toDto(buildingRepository.findById(id)
                .orElseThrow(() -> new AppException("Building with ID " + id + " not found", HttpStatus.NOT_FOUND)));
    }

    @Transactional
    public BuildingDTO createBuilding(BuildingDTO buildingDTO) {
        Building building = buildingMapper.toEntity(buildingDTO);
        building.setId(null);

        if (buildingDTO.getLocationId() != null) {
            Location location = locationRepository.findById(buildingDTO.getLocationId())
                    .orElseThrow(() -> new AppException("Location with ID " + buildingDTO.getLocationId() + " not found",
                            HttpStatus.NOT_FOUND));
            building.setLocation(location);
        }

        Building savedBuilding = buildingRepository.save(building);

        if (buildingDTO.getNumFloors() != null && buildingDTO.getNumFloors() > 0) {
            java.util.List<Floor> createdFloors = new java.util.ArrayList<>();
            for (int i = 1; i <= buildingDTO.getNumFloors(); i++) {
                Floor floor = new Floor();
                floor.setName("Piano " + i);
                floor.setBuilding(savedBuilding);
                floor.setEnabled(true);
                createdFloors.add(floorRepository.save(floor));
            }
            savedBuilding.setFloors(createdFloors);
        }

        return buildingMapper.toDto(savedBuilding);
    }

    @Transactional
    public BuildingDTO updateBuilding(Integer id, BuildingDTO buildingDTO) {
        Building existingBuilding = buildingRepository.findById(id)
                .orElseThrow(() -> new AppException("Building with ID " + id + " not found", HttpStatus.NOT_FOUND));

        buildingMapper.updateBuildingFromDto(buildingDTO, existingBuilding);

        if (buildingDTO.getLocationId() != null) {
            Location location = locationRepository.findById(buildingDTO.getLocationId())
                    .orElseThrow(() -> new AppException("Location with ID " + buildingDTO.getLocationId() + " not found",
                            HttpStatus.NOT_FOUND));
            existingBuilding.setLocation(location);
        }

        Building savedBuilding = buildingRepository.save(existingBuilding);

        if (buildingDTO.getNumFloors() != null) {
            long currentCount = savedBuilding.getFloors() != null ? 
                savedBuilding.getFloors().stream().filter(f -> f.getEnabled() != null && f.getEnabled()).count() : 0;
            if (buildingDTO.getNumFloors() > currentCount) {
                if (savedBuilding.getFloors() == null) {
                    savedBuilding.setFloors(new java.util.ArrayList<>());
                }
                for (long i = currentCount + 1; i <= buildingDTO.getNumFloors(); i++) {
                    Floor floor = new Floor();
                    floor.setName("Piano " + i);
                    floor.setBuilding(savedBuilding);
                    floor.setEnabled(true);
                    savedBuilding.getFloors().add(floorRepository.save(floor));
                }
            }
        }

        return buildingMapper.toDto(savedBuilding);
    }

    @Transactional
    public void softDeleteBuilding(Integer id) {
        Building existingBuilding = buildingRepository.findById(id)
                .orElseThrow(() -> new AppException("Building with ID " + id + " not found", HttpStatus.NOT_FOUND));
        
        // Disabilita l'edificio
        existingBuilding.setEnabled(false);
        buildingRepository.save(existingBuilding);
        
        // Cascata: Disabilita tutti i piani dell'edificio
        List<Floor> floors = floorRepository.findByBuildingId(id);
        floors.forEach(f -> floorService.softDeleteFloor(f.getId()));
    }

    @Transactional
    public void hardDeleteBuilding(Integer id) {
        if (!buildingRepository.existsById(id)) {
            throw new AppException("Building with ID " + id + " not found", HttpStatus.NOT_FOUND);
        }
        buildingRepository.deleteById(id);
    }
}