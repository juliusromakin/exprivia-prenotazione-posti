package com.prenotazioni.exprivia.exprv.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.prenotazioni.exprivia.exprv.dto.RoomDTO;
import com.prenotazioni.exprivia.exprv.exceptions.AppException;
import com.prenotazioni.exprivia.exprv.service.RoomService;

import jakarta.persistence.EntityNotFoundException;

@RestController
@RequestMapping("/api/room")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    // Gestione Richieste Get Per Ottenere Tutte Le Stanze
    @GetMapping()
    public List<RoomDTO> getAllRooms() {
        return roomService.findAllRooms();
        // Chiama Il Servizio Scritto in precedenza per ottenere tutte le stanze
    }

    // Richiesta GET per ricevere una stanza in base all'ID
    @GetMapping("/{id_room}")
    public ResponseEntity<RoomDTO> getRoomByID(@PathVariable("id_room") Integer id_room) {
        try {
            RoomDTO roomDTO = roomService.findRoomById(id_room);
            return ResponseEntity.ok(roomDTO);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    // Richiesta POST per creare una stanza
    @Transactional
    @PostMapping("/createRoom")
    public ResponseEntity<?> createRoom(@RequestBody RoomDTO roomDTO) {
        try {
            RoomDTO newRoom = roomService.createRoom(roomDTO);
            return ResponseEntity.ok(newRoom);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /*
     * @PostMapping("/crea_Postazione")
     * public ResponseEntity<?> creaPostazione(@RequestBody Postazioni postazioni) {
     * System.out.println("Ricevuto: " + postazioni.getStanze() + ", " +
     * postazioni.getStato_postazione());
     * try {
     * Postazioni newPostazioni = PostazioniService.creaPostazione(postazioni);
     * return ResponseEntity.ok(newPostazioni);
     * } catch (IllegalArgumentException e) {
     * return ResponseEntity.badRequest().body(e.getMessage());
     * }
     * }
     */
    // Gestisce Le Richieste PUT per aggiornare una Stanza tramite ID
    @PutMapping("/updateroom/{id}")
    public ResponseEntity<?> updateRoom(@PathVariable("id") Integer id_room,
            @RequestBody RoomDTO roomDTO) {
        try {
            RoomDTO updatedRoom = roomService.updateRoom(id_room, roomDTO);
            return ResponseEntity.ok(updatedRoom);
        } catch (AppException e) {
            return ResponseEntity.status(e.getHttpStatus()).body(null);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Soft Delete
    @DeleteMapping("/deleteroom/{id}")
    public ResponseEntity<String> softDeleteRoom(@PathVariable Integer id) {
        try {
            roomService.softDeleteRoom(id);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    // Hard Delete (Eliminazione definitiva)
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/harddeleteroom/{id}")
    public ResponseEntity<String> hardDeleteRoom(@PathVariable Integer id) {
        try {
            roomService.hardDeleteRoom(id);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}
