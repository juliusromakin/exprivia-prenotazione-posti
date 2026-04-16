package com.prenotazioni.exprivia.exprv.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

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

    public WorkspaceService(WorkspaceRepository workspaceRepository, WorkspaceMapper workspaceMapper,
            RoomRepository roomRepository) {
        this.workspaceRepository = workspaceRepository;
        this.workspaceMapper = workspaceMapper;
        this.roomRepository = roomRepository;
    }

    public List<WorkspaceDTO> findAllWorkspaces() {
        return workspaceMapper.toDtoList(workspaceRepository.findAll());
    }

    public WorkspaceDTO findWorkspaceById(Integer id) {
        return workspaceMapper.toDto(workspaceRepository.findById(id)
                .orElseThrow(() -> new AppException("Postazione con ID " + id + " non trovata", HttpStatus.NOT_FOUND)));
    }

    public List<WorkspaceDTO> findWorkspacesByRoomId(Integer roomId) {
        return workspaceMapper.toDtoList(workspaceRepository.findByRoomId(roomId));
    }

    public WorkspaceDTO createWorkspace(WorkspaceDTO workspaceDTO) {
        Workspace workspace = workspaceMapper.toEntity(workspaceDTO);

        if (workspaceDTO.getRoomId() != null) {
            Room room = roomRepository.findById(workspaceDTO.getRoomId())
                    .orElseThrow(() -> new AppException("Stanza con ID " + workspaceDTO.getRoomId() + " non trovata",
                            HttpStatus.NOT_FOUND));
            workspace.setRoom(room);
        }

        Workspace savedWorkspace = workspaceRepository.save(workspace);
        return workspaceMapper.toDto(savedWorkspace);
    }

    public WorkspaceDTO updateWorkspace(Integer id, WorkspaceDTO workspaceDTO) {
        Workspace existingWorkspace = workspaceRepository.findById(id)
                .orElseThrow(() -> new AppException("Postazione con ID " + id + " non trovata", HttpStatus.NOT_FOUND));

        workspaceMapper.updateWorkspaceFromDto(workspaceDTO, existingWorkspace);

        if (workspaceDTO.getRoomId() != null) {
            Room room = roomRepository.findById(workspaceDTO.getRoomId())
                    .orElseThrow(() -> new AppException("Stanza con ID " + workspaceDTO.getRoomId() + " non trovata",
                            HttpStatus.NOT_FOUND));
            existingWorkspace.setRoom(room);
        }

        workspaceRepository.save(existingWorkspace);
        return workspaceMapper.toDto(existingWorkspace);
    }

    public void softDeleteWorkspace(Integer id) {
        Workspace existingWorkspace = workspaceRepository.findById(id)
                .orElseThrow(() -> new AppException("Postazione con ID " + id + " non trovata", HttpStatus.NOT_FOUND));
        existingWorkspace.setIs_active(false);
        workspaceRepository.save(existingWorkspace);
    }

    public void hardDeleteWorkspace(Integer id) {
        if (!workspaceRepository.existsById(id)) {
            throw new AppException("Postazione con ID " + id + " non trovata", HttpStatus.NOT_FOUND);
        }
        workspaceRepository.deleteById(id);
    }

}
