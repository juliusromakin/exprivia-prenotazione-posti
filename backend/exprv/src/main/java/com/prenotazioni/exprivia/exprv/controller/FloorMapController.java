package com.prenotazioni.exprivia.exprv.controller;

import com.prenotazioni.exprivia.exprv.dto.FloorMapMetadataDTO;
import com.prenotazioni.exprivia.exprv.dto.FloorMapRequestDTO;
import com.prenotazioni.exprivia.exprv.entity.FloorMap;
import com.prenotazioni.exprivia.exprv.service.FloorMapService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/planimetrie")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FloorMapController {

    private final FloorMapService mapService;

    /**
     * Carica un file DXF, lo invia all'API Python per l'elaborazione e salva i risultati nel DB.
     * L'uso di @RequestPart e consumes = MULTIPART_FORM_DATA_VALUE abilita il tasto "Upload" in Swagger.
     */
    @Operation(summary = "Carica e processa un file DXF")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Long> uploadDxf(

        @Parameter(
            description = "Il file .dxf da elaborare",
            required = true,
            content = @Content(
                mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
                schema = @Schema(type = "string", format = "binary")  // ← questa riga mancava
            )
        )
        @RequestPart("file") MultipartFile file,

        @Parameter(description = "Nome della planimetria", required = true)
        @RequestParam("name") String name,

        @Parameter(description = "Data inizio validità (yyyy-MM-dd)", required = true)
        @RequestParam("dateStart")
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateStart,

        @Parameter(description = "Data fine validità (yyyy-MM-dd)", required = false)
        @RequestParam(value = "dateEnd", required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateEnd

    ) throws IOException {

        FloorMapRequestDTO request = new FloorMapRequestDTO();
        request.setName(name);
        request.setDateStart(dateStart);
        request.setDateEnd(dateEnd);

        // Il service si occuperà di chiamare l'API Python (porta 8080) e salvare su Postgres
        FloorMap mappa = mapService.elaboraESalva(file, request);

        return ResponseEntity.ok(mappa.getId());
    }

    /**
     * Ritorna la lista di tutte le planimetrie caricate (senza i file binari pesanti).
     */
    @GetMapping
    public ResponseEntity<List<FloorMapMetadataDTO>> getAllMaps() {
        return ResponseEntity.ok(mapService.findAllMetadata());
    }

    /**
     * Ritorna i dettagli di una singola mappa tramite ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<FloorMap> getMapById(@PathVariable Long id) {
        return mapService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Endpoint per scaricare l'immagine PNG generata di una specifica mappa.
     */
    @GetMapping("/{id}/image")
    public ResponseEntity<byte[]> getMapImage(@PathVariable Long id) {
        return mapService.findById(id)
                .map(mappa -> ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_PNG)
                        .body(mappa.getImagePng()))
                .orElse(ResponseEntity.notFound().build());
    }
}