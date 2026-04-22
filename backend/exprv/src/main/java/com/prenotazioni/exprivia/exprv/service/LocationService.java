package com.prenotazioni.exprivia.exprv.service;

import com.prenotazioni.exprivia.exprv.dto.LocationDTO;
import com.prenotazioni.exprivia.exprv.entity.Location;
import com.prenotazioni.exprivia.exprv.mapper.LocationMapper;
import com.prenotazioni.exprivia.exprv.repository.LocationRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class LocationService {

    private final LocationRepository locationRepository;
    private final LocationMapper locationMapper;

    public LocationService(LocationRepository locationRepository, LocationMapper locationMapper) {
        this.locationRepository = locationRepository;
        this.locationMapper = locationMapper;
    }

    public List<LocationDTO> getAllLocations() {
        return locationRepository.findAll().stream()
                .map(locationMapper::toDto)
                .collect(Collectors.toList());
    }

    public LocationDTO save(LocationDTO dto) {
        Location entity = locationMapper.toEntity(dto);
        return locationMapper.toDto(locationRepository.save(entity));
    }

    public void delete(Integer id) {
        locationRepository.deleteById(id);
    }
}