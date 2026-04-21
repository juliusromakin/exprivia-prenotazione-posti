package com.prenotazioni.exprivia.exprv.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.prenotazioni.exprivia.exprv.entity.Building;
import java.util.List;

public interface BuildingRepository extends JpaRepository<Building, Integer> {

    List<Building> findByCity(String city);

    List<Building> findByLocationId(Integer locationId);
}
