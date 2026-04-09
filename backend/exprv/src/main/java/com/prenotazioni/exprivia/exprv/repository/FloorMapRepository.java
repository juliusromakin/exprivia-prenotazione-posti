package com.prenotazioni.exprivia.exprv.repository;

import com.prenotazioni.exprivia.exprv.dto.FloorMapMetadataDTO;
import com.prenotazioni.exprivia.exprv.entity.FloorMap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FloorMapRepository extends JpaRepository<FloorMap, Long> {

    // Mappa attiva in una certa data (data fine null = vigente a tempo indeterminato)
    @Query("""
        SELECT m FROM FloorMap m
        WHERE m.dateStart <= :data
        AND (m.dateEnd IS NULL OR m.dateEnd >= :data)
    """)
    List<FloorMap> findActiveFloorMap(LocalDate date);

    // Mappa attiva oggi
    default Optional<FloorMap> findMappaAttivaOggi() {
        return findActiveFloorMap(LocalDate.now()).stream().findFirst();
    }

    // Recupera solo i metadati (esclude i blob per non rallentare la lista)
    @Query("SELECT new com.prenotazioni.exprivia.exprv.dto.FloorMapMetadataDTO(f.id, f.name, f.dateStart, f.dateEnd) FROM FloorMap f")
    List<FloorMapMetadataDTO> findAllMetadata();
}