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
@RequestMapping("/api/workspaces")
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    public WorkspaceController(WorkspaceService workspaceService) {
        this.workspaceService = workspaceService;
    }

    @GetMapping
    public List<WorkspaceDTO> getAllWorkspaces() {
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
    public ResponseEntity<?> getWorkspaceById(@PathVariable("id") Integer id) {
        try {
            WorkspaceDTO workspaceDTO = workspaceService.findWorkspaceById(id);
            return ResponseEntity.ok(workspaceDTO);
        } catch (AppException e) {
            return ResponseEntity.status(e.getHttpStatus()).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PostMapping
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

    @PutMapping("/{id}")
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

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteWorkspace(@PathVariable("id") Integer id) {
        try {
            workspaceService.softDeleteWorkspace(id);
            return ResponseEntity.noContent().build();
        } catch (AppException e) {
            return ResponseEntity.status(e.getHttpStatus()).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}/hard")
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