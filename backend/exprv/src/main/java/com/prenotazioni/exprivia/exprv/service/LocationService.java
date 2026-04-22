package com.prenotazioni.exprivia.exprv.service;

import java.util.List;

import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.prenotazioni.exprivia.exprv.dto.LocationDTO;
import com.prenotazioni.exprivia.exprv.dto.SelectOptionDTO;
import com.prenotazioni.exprivia.exprv.entity.Building;
import com.prenotazioni.exprivia.exprv.entity.Location;
import com.prenotazioni.exprivia.exprv.exceptions.AppException;
import com.prenotazioni.exprivia.exprv.mapper.LocationMapper;
import com.prenotazioni.exprivia.exprv.repository.BuildingRepository;
import com.prenotazioni.exprivia.exprv.repository.LocationRepository;

@Service
public class LocationService {

    private final LocationRepository locationRepository;
    private final LocationMapper locationMapper;
    private final BuildingRepository buildingRepository;
    private final BuildingService buildingService;

    public LocationService(LocationRepository locationRepository, LocationMapper locationMapper,
            BuildingRepository buildingRepository, @Lazy BuildingService buildingService) {
        this.locationRepository = locationRepository;
        this.locationMapper = locationMapper;
        this.buildingRepository = buildingRepository;
        this.buildingService = buildingService;
    }

    public List<LocationDTO> findAllLocations(boolean enabledOnly) {
        if (enabledOnly) {
            return locationMapper.toDtoList(locationRepository.findAllByEnabledTrue());
        }
        return locationMapper.toDtoList(locationRepository.findAll());
    }

    public List<SelectOptionDTO> getLocationOptions() {
        return locationMapper.toSelectOptionDTOList(locationRepository.findAll().stream()
                .filter(Location::getEnabled)
                .toList());
    }

    public LocationDTO findLocationById(Integer id) {
        return locationMapper.toDto(locationRepository.findById(id)
                .orElseThrow(() -> new AppException("Location with ID " + id + " not found", HttpStatus.NOT_FOUND)));
    }

    @Transactional
    public LocationDTO createLocation(LocationDTO locationDTO) {
        Location location = locationMapper.toEntity(locationDTO);
        location.setId(null); // Forza la creazione di un nuovo record
        return locationMapper.toDto(locationRepository.save(location));
    }

    @Transactional
    public LocationDTO updateLocation(Integer id, LocationDTO locationDTO) {
        Location existingLocation = locationRepository.findById(id)
                .orElseThrow(() -> new AppException("Location with ID " + id + " not found", HttpStatus.NOT_FOUND));
        locationMapper.updateLocationFromDto(locationDTO, existingLocation);
        locationRepository.save(existingLocation);
        return locationMapper.toDto(existingLocation);
    }

    @Transactional
    public void softDeleteLocation(Integer id) {
        Location existingLocation = locationRepository.findById(id)
                .orElseThrow(() -> new AppException("Location with ID " + id + " not found", HttpStatus.NOT_FOUND));
        
        // Disabilita la sede
        existingLocation.setEnabled(false);
        locationRepository.save(existingLocation);
        
        // Cascata: Disabilita tutti gli edifici della sede
        List<Building> buildings = buildingRepository.findByLocationId(id);
        buildings.forEach(b -> buildingService.softDeleteBuilding(b.getId()));
    }

    @Transactional
    public void hardDeleteLocation(Integer id) {
        if (!locationRepository.existsById(id)) {
            throw new AppException("Location with ID " + id + " not found", HttpStatus.NOT_FOUND);
        }
        locationRepository.deleteById(id);
    }
}