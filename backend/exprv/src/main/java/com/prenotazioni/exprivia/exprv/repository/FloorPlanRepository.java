package com.prenotazioni.exprivia.exprv.repository;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.prenotazioni.exprivia.exprv.entity.FloorPlan;

public interface FloorPlanRepository extends JpaRepository<FloorPlan, Integer> {

    @Query("SELECT fp FROM FloorPlan fp WHERE fp.floor.id = :floorId AND fp.isActive = true AND fp.validFrom <= :date AND (fp.validTo IS NULL OR fp.validTo >= :date)")
    Optional<FloorPlan> findActiveFloorPlan(@Param("floorId") Integer floorId, @Param("date") LocalDate date);

    @Query("SELECT fp FROM FloorPlan fp WHERE fp.floor.id = :floorId AND fp.isActive = true ORDER BY fp.validFrom DESC")
    java.util.List<FloorPlan> findAllByFloorIdOrderByValidFromDesc(@Param("floorId") Integer floorId);

    @Query("SELECT COUNT(fp) > 0 FROM FloorPlan fp WHERE fp.floor.id = :floorId AND fp.isActive = true AND (:excludeId IS NULL OR fp.id != :excludeId) AND " +
           "(fp.validTo IS NULL OR :startDate <= fp.validTo) AND " +
           "(:endDate IS NULL OR fp.validFrom <= :endDate)")
    boolean existsOverlappingActivePlan(@Param("floorId") Integer floorId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("excludeId") Integer excludeId);
}
