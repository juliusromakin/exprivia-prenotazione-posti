package com.prenotazioni.exprivia.exprv.entity;

import java.time.LocalDate;
import java.util.List;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "floorMap")
public class FloorMap {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    @Column(name = "name", nullable = false)
    private String name;
 
    @Lob
    @Column(name = "image_png", nullable = false, columnDefinition = "BYTEA")
    private byte[] imagePng;
 
    @Lob
    @Column(name = "file_dxf", nullable = false, columnDefinition = "BYTEA")
    private byte[] fileDxf;
 
    // Bounding box per mappare coordinate DXF → pixel immagine
    @Column(name = "x_min_coord")
    private Double xmin;

    @Column(name = "x_max_coord")
    private Double xmax;

    @Column(name = "y_min_coord")
    private Double ymin;

    @Column(name = "y_max_coord")
    private Double ymax;
 
    @Column(name = "date_start", nullable = false)
    private LocalDate dateStart;
 
    // Null = mappa attiva a tempo indeterminato
    @Column(name = "date_end")
    private LocalDate dateEnd;
 
    // Postazioni salvate come array JSONB — nessuna tabella separata
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "workstation", columnDefinition = "jsonb")
    private List<WorkStationSnapshot> workstation;
 
 
    // Record interno — rappresenta una postazione frozen al momento del salvataggio
    @Data
    public static class WorkStationSnapshot {
        private String handleDxf;
        private String pdl;
        private String stanza;
        private double x;
        private double y;
    }
}
