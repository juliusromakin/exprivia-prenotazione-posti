package com.prenotazioni.exprivia.exprv.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.prenotazioni.exprivia.exprv.entity.Building;

@Repository
public interface BuildingRepository extends JpaRepository<Building, Integer> {

    List<Building> findByLocationId(Integer locationId);
    
    List<Building> findByLocationIdAndEnabledTrue(Integer locationId);

    List<Building> findByAddressContaining(String address);
    
    List<Building> findAllByEnabledTrue();
}
