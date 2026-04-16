package com.prenotazioni.exprivia.exprv.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.prenotazioni.exprivia.exprv.dto.SelectOptionDTO;
import com.prenotazioni.exprivia.exprv.dto.WorkspaceDTO;
import com.prenotazioni.exprivia.exprv.exceptions.AppException;
import com.prenotazioni.exprivia.exprv.service.WorkspaceService;

@RestController
@RequestMapping("/api/workspace")
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    public WorkspaceController(WorkspaceService workspaceService) {
        this.workspaceService = workspaceService;
    }

    // Ottieni tutte le postazioni
    @GetMapping()
    public List<WorkspaceDTO> getWorkspaces() {
        return workspaceService.findAllWorkspaces();
    }

    @GetMapping("/room/{roomId}")
    public ResponseEntity<List<WorkspaceDTO>> getWorkspacesByRoomId(@PathVariable("roomId") Integer roomId) {
        List<WorkspaceDTO> workspaces = workspaceService.findWorkspacesByRoomId(roomId);
        return ResponseEntity.ok(workspaces);
    }

    @GetMapping("/options/{roomId}")
    public ResponseEntity<List<SelectOptionDTO>> getWorkspaceOptions(@PathVariable("roomId") Integer roomId) {
        return ResponseEntity.ok(workspaceService.getWorkspaceOptionsByRoom(roomId));
    }

    @GetMapping("/rooms-with-workspaces")
    public ResponseEntity<Map<String, List<Map<String, Object>>>> getRoomsWithWorkspaces() {
        return ResponseEntity.ok(workspaceService.getRoomsWithWorkspaces());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPostazioneByID(@PathVariable("id") Integer id) {
        try {
            WorkspaceDTO newWorkspaceDTO = workspaceService.findWorkspaceById(id);
            return ResponseEntity.ok(newWorkspaceDTO);
        } catch (AppException e) {
            return ResponseEntity.status(e.getHttpStatus()).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    // CREA POSTAZIONE
    @PostMapping("/createWorkspace")
    public ResponseEntity<?> createWorkspace(@RequestBody WorkspaceDTO workspaceDTO) {
        try {
            WorkspaceDTO newWorkspaceDTO = workspaceService.createWorkspace(workspaceDTO);
            return ResponseEntity.ok(newWorkspaceDTO);
        } catch (AppException e) {
            return ResponseEntity.status(e.getHttpStatus()).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // UPDATE POSTAZIONE
    @PutMapping("/updateWorkspace/{id}")
    public ResponseEntity<?> updateWorkspace(
            @PathVariable("id") Integer id,
            @RequestBody WorkspaceDTO workspaceDTO) {
        try {
            WorkspaceDTO updatedWorkspace = workspaceService.updateWorkspace(id, workspaceDTO);
            return ResponseEntity.ok(updatedWorkspace);
        } catch (AppException e) {
            return ResponseEntity.status(e.getHttpStatus()).body(e.getMessage());
        }
    }

    // SOFT Delete
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> softDeleteWorkspace(@PathVariable("id") Integer id) {
        try {
            workspaceService.softDeleteWorkspace(id);
            return ResponseEntity.noContent().build();
        } catch (AppException e) {
            return ResponseEntity.status(e.getHttpStatus()).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    // HARD Delete (Eliminazione definitiva)
    @DeleteMapping("/hard-delete/{id}")
    public ResponseEntity<String> hardDeleteWorkspace(@PathVariable("id") Integer id) {
        try {
            workspaceService.hardDeleteWorkspace(id);
            return ResponseEntity.noContent().build();
        } catch (AppException e) {
            return ResponseEntity.status(e.getHttpStatus()).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
}