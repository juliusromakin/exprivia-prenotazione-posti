package com.prenotazioni.exprivia.exprv.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.prenotazioni.exprivia.exprv.dto.SelectOptionDTO;
import com.prenotazioni.exprivia.exprv.dto.WorkspaceDTO;
import com.prenotazioni.exprivia.exprv.entity.Room;
import com.prenotazioni.exprivia.exprv.entity.Workspace;
import com.prenotazioni.exprivia.exprv.exceptions.AppException;
import com.prenotazioni.exprivia.exprv.mapper.WorkspaceMapper;
import com.prenotazioni.exprivia.exprv.repository.RoomRepository;
import com.prenotazioni.exprivia.exprv.repository.WorkspaceRepository;

@Service
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMapper workspaceMapper;
    private final RoomRepository roomRepository;
    private final com.prenotazioni.exprivia.exprv.repository.FloorPlanRepository floorPlanRepository;
    private final com.prenotazioni.exprivia.exprv.repository.WorkspacePositionRepository workspacePositionRepository;

    public WorkspaceService(WorkspaceRepository workspaceRepository, WorkspaceMapper workspaceMapper,
            RoomRepository roomRepository,
            com.prenotazioni.exprivia.exprv.repository.FloorPlanRepository floorPlanRepository,
            com.prenotazioni.exprivia.exprv.repository.WorkspacePositionRepository workspacePositionRepository) {
        this.workspaceRepository = workspaceRepository;
        this.workspaceMapper = workspaceMapper;
        this.roomRepository = roomRepository;
        this.floorPlanRepository = floorPlanRepository;
        this.workspacePositionRepository = workspacePositionRepository;
    }

    public List<WorkspaceDTO> findAllWorkspaces(boolean enabledOnly) {
        if (enabledOnly) {
            return workspaceMapper.toDtoList(workspaceRepository.findAllByEnabledTrue());
        }
        return workspaceMapper.toDtoList(workspaceRepository.findAll());
    }

    public WorkspaceDTO findWorkspaceById(Integer id) {
        return workspaceMapper.toDto(workspaceRepository.findById(id)
                .orElseThrow(() -> new AppException("Workspace with ID " + id + " not found", HttpStatus.NOT_FOUND)));
    }

    public List<WorkspaceDTO> findWorkspacesByRoomId(Integer roomId, boolean enabledOnly) {
        if (enabledOnly) {
            return workspaceMapper.toDtoList(workspaceRepository.findByRoomIdAndEnabledTrue(roomId));
        }
        return workspaceMapper.toDtoList(workspaceRepository.findByRoomId(roomId));
    }

    public List<WorkspaceDTO> findWorkspacesByFloorId(Integer floorId, boolean enabledOnly) {
        if (enabledOnly) {
            return workspaceMapper.toDtoList(workspaceRepository.findByRoomFloorIdAndEnabledTrue(floorId));
        }
        return workspaceMapper.toDtoList(workspaceRepository.findByRoomFloorId(floorId));
    }

    public List<SelectOptionDTO> getWorkspaceOptionsByRoom(Integer roomId) {
        return workspaceMapper.toSelectOptionDTOList(workspaceRepository.findByRoomIdAndEnabledTrue(roomId));
    }

    public List<SelectOptionDTO> getWorkspaceOptionsByFloor(Integer floorId) {
        return workspaceMapper.toSelectOptionDTOList(workspaceRepository.findByRoomFloorIdAndEnabledTrue(floorId));
    }

    public WorkspaceDTO createWorkspace(WorkspaceDTO workspaceDTO) {
        Workspace workspace = workspaceMapper.toEntity(workspaceDTO);
        workspace.setId(null);

        Room room = null;
        if (workspaceDTO.getRoomId() != null) {
            room = roomRepository.findById(workspaceDTO.getRoomId())
                    .orElseThrow(() -> new AppException("Room with ID " + workspaceDTO.getRoomId() + " not found",
                            HttpStatus.NOT_FOUND));
            workspace.setRoom(room);
        }

        Workspace savedWorkspace = workspaceRepository.save(workspace);

        return workspaceMapper.toDto(savedWorkspace);
    }

    public WorkspaceDTO updateWorkspace(Integer id, WorkspaceDTO workspaceDTO) {
        Workspace existingWorkspace = workspaceRepository.findById(id)
                .orElseThrow(() -> new AppException("Workspace with ID " + id + " not found", HttpStatus.NOT_FOUND));

        workspaceMapper.updateWorkspaceFromDto(workspaceDTO, existingWorkspace);

        Room room = null;
        if (workspaceDTO.getRoomId() != null) {
            room = roomRepository.findById(workspaceDTO.getRoomId())
                    .orElseThrow(() -> new AppException("Room with ID " + workspaceDTO.getRoomId() + " not found",
                            HttpStatus.NOT_FOUND));
            existingWorkspace.setRoom(room);
        }

        Workspace savedWorkspace = workspaceRepository.save(existingWorkspace);

        return workspaceMapper.toDto(savedWorkspace);
    }

    public void softDeleteWorkspace(Integer id) {
        Workspace existingWorkspace = workspaceRepository.findById(id)
                .orElseThrow(() -> new AppException("Workspace with ID " + id + " not found", HttpStatus.NOT_FOUND));
        existingWorkspace.setEnabled(false);
        workspaceRepository.save(existingWorkspace);
    }

    public void hardDeleteWorkspace(Integer id) {
        if (!workspaceRepository.existsById(id)) {
            throw new AppException("Workspace with ID " + id + " not found", HttpStatus.NOT_FOUND);
        }
        workspaceRepository.deleteById(id);
    }
}
