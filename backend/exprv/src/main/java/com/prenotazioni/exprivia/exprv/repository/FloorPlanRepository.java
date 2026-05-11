package com.prenotazioni.exprivia.exprv.repository;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.prenotazioni.exprivia.exprv.entity.FloorPlan;

public interface FloorPlanRepository extends JpaRepository<FloorPlan, Integer> {

    @Query("SELECT fp FROM FloorPlan fp WHERE fp.floor.id = :floorId AND fp.validFrom <= :date AND (fp.validTo IS NULL OR fp.validTo >= :date)")
    Optional<FloorPlan> findActiveFloorPlan(@Param("floorId") Integer floorId, @Param("date") LocalDate date);

}
