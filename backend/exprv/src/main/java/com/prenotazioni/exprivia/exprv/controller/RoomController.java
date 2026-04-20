package com.prenotazioni.exprivia.exprv.controller;

import java.util.List;

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
import com.prenotazioni.exprivia.exprv.dto.SelectOptionDTO;
import com.prenotazioni.exprivia.exprv.exceptions.AppException;
import com.prenotazioni.exprivia.exprv.service.RoomService;

import jakarta.persistence.EntityNotFoundException;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping
    public List<RoomDTO> getAllRooms() {
        return roomService.findAllRooms();
    }

    @GetMapping("/options")
    public ResponseEntity<List<SelectOptionDTO>> getRoomOptions() {
        return ResponseEntity.ok(roomService.getRoomOptions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoomDTO> getRoomById(@PathVariable("id") Integer id) {
        try {
            RoomDTO roomDTO = roomService.findRoomById(id);
            return ResponseEntity.ok(roomDTO);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    @Transactional
    @PostMapping
    public ResponseEntity<?> createRoom(@RequestBody RoomDTO roomDTO) {
        try {
            RoomDTO newRoom = roomService.createRoom(roomDTO);
            return ResponseEntity.ok(newRoom);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateRoom(@PathVariable("id") Integer id,
            @RequestBody RoomDTO roomDTO) {
        try {
            RoomDTO updatedRoom = roomService.updateRoom(id, roomDTO);
            return ResponseEntity.ok(updatedRoom);
        } catch (AppException e) {
            return ResponseEntity.status(e.getHttpStatus()).body(null);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteRoom(@PathVariable Integer id) {
        try {
            roomService.softDeleteRoom(id);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}/hard")
    public ResponseEntity<String> hardDeleteRoom(@PathVariable Integer id) {
        try {
            roomService.hardDeleteRoom(id);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}
