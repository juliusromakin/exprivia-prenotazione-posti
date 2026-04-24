package com.prenotazioni.exprivia.exprv.controller;

import com.prenotazioni.exprivia.exprv.dto.RoomDTO;
import com.prenotazioni.exprivia.exprv.dto.SelectOptionDTO;
import com.prenotazioni.exprivia.exprv.service.RoomService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping
    public ResponseEntity<List<RoomDTO>> getAllRooms(
            @RequestParam(required = false, defaultValue = "false") boolean enabledOnly) {
        return ResponseEntity.ok(roomService.findAllRooms(enabledOnly));
    }

    @GetMapping("/floor/{floorId}")
    public ResponseEntity<List<RoomDTO>> getRoomsByFloor(
            @PathVariable Integer floorId,
            @RequestParam(required = false, defaultValue = "false") boolean enabledOnly) {
        return ResponseEntity.ok(roomService.findRoomsByFloorId(floorId, enabledOnly));
    }

    @GetMapping("/floor/{floorId}/options")
    public ResponseEntity<List<SelectOptionDTO>> getRoomOptionsByFloor(@PathVariable Integer floorId) {
        return ResponseEntity.ok(roomService.getRoomOptionsByFloor(floorId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoomDTO> getRoomById(@PathVariable Integer id) {
        return ResponseEntity.ok(roomService.findRoomById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<RoomDTO> createRoom(@jakarta.validation.Valid @RequestBody RoomDTO roomDTO) {
        return ResponseEntity.ok(roomService.createRoom(roomDTO));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<RoomDTO> updateRoom(@PathVariable Integer id,
            @jakarta.validation.Valid @RequestBody RoomDTO roomDTO) {
        return ResponseEntity.ok(roomService.updateRoom(id, roomDTO));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> softDeleteRoom(@PathVariable Integer id) {
        roomService.softDeleteRoom(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/hard")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> hardDeleteRoom(@PathVariable Integer id) {
        roomService.hardDeleteRoom(id);
        return ResponseEntity.noContent().build();
    }
}
