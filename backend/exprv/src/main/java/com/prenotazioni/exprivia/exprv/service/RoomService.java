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
import com.prenotazioni.exprivia.exprv.entity.Equipment;
import com.prenotazioni.exprivia.exprv.entity.Floor;
import com.prenotazioni.exprivia.exprv.mapper.RoomMapper;
import com.prenotazioni.exprivia.exprv.repository.FloorPlanRepository;
import com.prenotazioni.exprivia.exprv.repository.FloorRepository;
import com.prenotazioni.exprivia.exprv.repository.RoomPositionRepository;
import com.prenotazioni.exprivia.exprv.repository.RoomRepository;
import com.prenotazioni.exprivia.exprv.repository.WorkspaceRepository;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Service
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomMapper roomMapper;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceService workspaceService;
    private final FloorRepository floorRepository;
    private final FloorPlanRepository floorPlanRepository;
    private final RoomPositionRepository roomPositionRepository;

    public RoomService(RoomRepository roomRepository, RoomMapper roomMapper,
            WorkspaceRepository workspaceRepository, @Lazy WorkspaceService workspaceService,
            FloorRepository floorRepository,
            FloorPlanRepository floorPlanRepository,
            RoomPositionRepository roomPositionRepository) {
        this.roomRepository = roomRepository;
        this.roomMapper = roomMapper;
        this.workspaceRepository = workspaceRepository;
        this.workspaceService = workspaceService;
        this.floorRepository = floorRepository;
        this.floorPlanRepository = floorPlanRepository;
        this.roomPositionRepository = roomPositionRepository;
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

    @Transactional
    public RoomDTO createRoom(RoomDTO roomDTO) {
        Room entity = null;

        if (roomDTO.getFloorId() != null) {
            Floor floor = floorRepository.findById(roomDTO.getFloorId())
                    .orElseThrow(() -> new AppException("Floor with ID " + roomDTO.getFloorId() + " not found",
                            HttpStatus.NOT_FOUND));

            // Check if room with same name exists on this floor
            Optional<Room> existingRoomOpt = roomRepository.findByFloorId(floor.getId()).stream()
                    .filter(r -> r.getName() != null && r.getName().equalsIgnoreCase(roomDTO.getName()))
                    .findFirst();

            if (existingRoomOpt.isPresent()) {
                entity = existingRoomOpt.get();
                entity.setEnabled(true);
            } else {
                entity = roomMapper.toEntity(roomDTO);
                entity.setId(null);
                entity.setFloor(floor);
            }
        } else {
            entity = roomMapper.toEntity(roomDTO);
            entity.setId(null);
        }

        validateEquipment(entity);
        Room savedRoom = roomRepository.save(entity);

        return roomMapper.toDto(savedRoom);
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

        validateEquipment(existingRoom);
        Room savedRoom = roomRepository.save(existingRoom);

        return roomMapper.toDto(savedRoom);
    }

    private void validateEquipment(Room entity) {
        if (entity.getEquipment() != null && !entity.getEquipment().isEmpty()) {
            Set<String> names = new HashSet<>();
            for (Equipment e : entity.getEquipment()) {
                String name = e.getName().toLowerCase().trim();
                if (!names.add(name)) {
                    throw new AppException("Attrezzatura duplicata rilevata: " + e.getName(), HttpStatus.BAD_REQUEST);
                }
            }
        }
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
