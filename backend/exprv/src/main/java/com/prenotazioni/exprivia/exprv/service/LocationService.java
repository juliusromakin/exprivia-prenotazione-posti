package com.prenotazioni.exprivia.exprv.service;

import com.prenotazioni.exprivia.exprv.entity.Location;
import com.prenotazioni.exprivia.exprv.repository.LocationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LocationService {

    private final LocationRepository locationRepository;

    public LocationService(LocationRepository locationRepository) {
        this.locationRepository = locationRepository;
    }

    public List<Location> getAllLocations() {
        return locationRepository.findAll();
    }

}