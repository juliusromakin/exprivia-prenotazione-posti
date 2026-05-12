package com.prenotazioni.exprivia.exprv.controller;

import com.prenotazioni.exprivia.exprv.dto.SelectOptionDTO;
import com.prenotazioni.exprivia.exprv.dto.WorkspaceDTO;
import com.prenotazioni.exprivia.exprv.service.WorkspaceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/workspaces")
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    public WorkspaceController(WorkspaceService workspaceService) {
        this.workspaceService = workspaceService;
    }

    @PreAuthorize("hasAuthority('ACTION_FLOORPLAN_READ')")
    @GetMapping
    public ResponseEntity<List<WorkspaceDTO>> getAllWorkspaces(
            @RequestParam(required = false, defaultValue = "false") boolean enabledOnly) {
        return ResponseEntity.ok(workspaceService.findAllWorkspaces(enabledOnly));
    }

    @PreAuthorize("hasAuthority('ACTION_FLOORPLAN_READ')")
    @GetMapping("/room/{roomId}")
    public ResponseEntity<List<WorkspaceDTO>> getWorkspacesByRoom(
            @PathVariable Integer roomId,
            @RequestParam(required = false, defaultValue = "false") boolean enabledOnly) {
        return ResponseEntity.ok(workspaceService.findWorkspacesByRoomId(roomId, enabledOnly));
    }

    @PreAuthorize("hasAuthority('ACTION_FLOORPLAN_READ')")
    @GetMapping("/floor/{floorId}")
    public ResponseEntity<List<WorkspaceDTO>> getWorkspacesByFloor(
            @PathVariable Integer floorId,
            @RequestParam(required = false, defaultValue = "false") boolean enabledOnly) {
        return ResponseEntity.ok(workspaceService.findWorkspacesByFloorId(floorId, enabledOnly));
    }

    @PreAuthorize("hasAuthority('ACTION_FLOORPLAN_READ')")
    @GetMapping("/room/{roomId}/options")
    public ResponseEntity<List<SelectOptionDTO>> getWorkspaceOptionsByRoom(@PathVariable Integer roomId) {
        return ResponseEntity.ok(workspaceService.getWorkspaceOptionsByRoom(roomId));
    }

    @PreAuthorize("hasAuthority('ACTION_FLOORPLAN_READ')")
    @GetMapping("/floor/{floorId}/options")
    public ResponseEntity<List<SelectOptionDTO>> getWorkspaceOptionsByFloor(@PathVariable Integer floorId) {
        return ResponseEntity.ok(workspaceService.getWorkspaceOptionsByFloor(floorId));
    }

    @PreAuthorize("hasAuthority('ACTION_FLOORPLAN_READ')")
    @GetMapping("/{id}")
    public ResponseEntity<WorkspaceDTO> getWorkspaceById(@PathVariable Integer id) {
        return ResponseEntity.ok(workspaceService.findWorkspaceById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ACTION_FLOORPLAN_CREATE')")
    public ResponseEntity<WorkspaceDTO> createWorkspace(
            @jakarta.validation.Valid @RequestBody WorkspaceDTO workspaceDTO) {
        return ResponseEntity.ok(workspaceService.createWorkspace(workspaceDTO));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ACTION_FLOORPLAN_UPDATE')")
    public ResponseEntity<WorkspaceDTO> updateWorkspace(@PathVariable Integer id,
            @jakarta.validation.Valid @RequestBody WorkspaceDTO workspaceDTO) {
        return ResponseEntity.ok(workspaceService.updateWorkspace(id, workspaceDTO));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ACTION_FLOORPLAN_DELETE')")
    public ResponseEntity<Void> softDeleteWorkspace(@PathVariable Integer id) {
        workspaceService.softDeleteWorkspace(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/hard")
    @PreAuthorize("hasAuthority('ACTION_FLOORPLAN_DELETE')")
    public ResponseEntity<Void> hardDeleteWorkspace(@PathVariable Integer id) {
        workspaceService.hardDeleteWorkspace(id);
        return ResponseEntity.noContent().build();
    }
}