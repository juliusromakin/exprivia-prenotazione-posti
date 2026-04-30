package com.prenotazioni.exprivia.exprv.service;

import java.util.List;

import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.prenotazioni.exprivia.exprv.dto.RoomDTO;
import com.prenotazioni.exprivia.exprv.dto.SelectOptionDTO;
import com.prenotazioni.exprivia.exprv.entity.Room;
import com.prenotazioni.exprivia.exprv.entity.Workspace;
import com.prenotazioni.exprivia.exprv.exceptions.AppException;
import com.prenotazioni.exprivia.exprv.entity.Floor;
import com.prenotazioni.exprivia.exprv.mapper.RoomMapper;
import com.prenotazioni.exprivia.exprv.repository.FloorRepository;
import com.prenotazioni.exprivia.exprv.repository.RoomRepository;
import com.prenotazioni.exprivia.exprv.repository.WorkspaceRepository;

@Service
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomMapper roomMapper;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceService workspaceService;
    private final FloorRepository floorRepository;

    public RoomService(RoomRepository roomRepository, RoomMapper roomMapper, 
                       WorkspaceRepository workspaceRepository, @Lazy WorkspaceService workspaceService,
                       FloorRepository floorRepository) {
        this.roomRepository = roomRepository;
        this.roomMapper = roomMapper;
        this.workspaceRepository = workspaceRepository;
        this.workspaceService = workspaceService;
        this.floorRepository = floorRepository;
    }

    public List<RoomDTO> findAllRooms(boolean enabledOnly) {
        if (enabledOnly) {
            return roomMapper.toDtoList(roomRepository.findAllByEnabledTrue());
        }
        return roomMapper.toDtoList(roomRepository.findAll());
    }

    public List<RoomDTO> findRoomsByFloorId(Integer floorId, boolean enabledOnly) {
        if (enabledOnly) {
            return roomMapper.toDtoList(roomRepository.findByFloorIdAndEnabledTrue(floorId));
        }
        return roomMapper.toDtoList(roomRepository.findByFloorId(floorId));
    }

    public List<SelectOptionDTO> getRoomOptionsByFloor(Integer floorId) {
        return roomMapper.toSelectOptionDTOList(roomRepository.findByFloorIdAndEnabledTrue(floorId));
    }

    public RoomDTO findRoomById(Integer id) {
        return roomMapper.toDto(roomRepository.findById(id)
                .orElseThrow(() -> new AppException("Room with ID " + id + " not found", HttpStatus.NOT_FOUND)));
    }

    public RoomDTO createRoom(RoomDTO roomDTO) {
        Room entity = roomMapper.toEntity(roomDTO);
        entity.setId(null);

        if (roomDTO.getFloorId() != null) {
            Floor floor = floorRepository.findById(roomDTO.getFloorId())
                    .orElseThrow(() -> new AppException("Floor with ID " + roomDTO.getFloorId() + " not found",
                            HttpStatus.NOT_FOUND));
            entity.setFloor(floor);
        }

        return roomMapper.toDto(roomRepository.save(entity));
    }

    @Transactional
    public RoomDTO updateRoom(Integer id, RoomDTO roomDTO) {
        Room existingRoom = roomRepository.findById(id)
                .orElseThrow(() -> new AppException("Room with ID " + id + " not found", HttpStatus.NOT_FOUND));
        roomMapper.updateRoomFromDto(roomDTO, existingRoom);

        if (roomDTO.getFloorId() != null) {
            Floor floor = floorRepository.findById(roomDTO.getFloorId())
                    .orElseThrow(() -> new AppException("Floor with ID " + roomDTO.getFloorId() + " not found",
                            HttpStatus.NOT_FOUND));
            existingRoom.setFloor(floor);
        }

        roomRepository.save(existingRoom);
        return roomMapper.toDto(existingRoom);
    }

    @Transactional
    public void softDeleteRoom(Integer id) {
        Room existingRoom = roomRepository.findById(id)
                .orElseThrow(() -> new AppException("Room with ID " + id + " not found", HttpStatus.NOT_FOUND));
        
        // Disabilita la stanza
        existingRoom.setEnabled(false);
        roomRepository.save(existingRoom);
        
        // Cascata: Disabilita tutte le postazioni della stanza
        List<Workspace> workspaces = workspaceRepository.findByRoomId(id);
        workspaces.forEach(w -> workspaceService.softDeleteWorkspace(w.getId()));
    }

    @Transactional
    public void hardDeleteRoom(Integer id) {
        if (!roomRepository.existsById(id)) {
            throw new AppException("Room with ID " + id + " not found", HttpStatus.NOT_FOUND);
        }
        roomRepository.deleteById(id);
    }
}
