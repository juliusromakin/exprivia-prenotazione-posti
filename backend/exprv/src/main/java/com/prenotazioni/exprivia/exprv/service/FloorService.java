package com.prenotazioni.exprivia.exprv.service;

import java.util.List;

import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.prenotazioni.exprivia.exprv.dto.FloorDTO;
import com.prenotazioni.exprivia.exprv.dto.FloorPlanDTO;
import com.prenotazioni.exprivia.exprv.dto.RoomDTO;
import com.prenotazioni.exprivia.exprv.dto.SelectOptionDTO;
import com.prenotazioni.exprivia.exprv.dto.WorkspaceDTO;
import com.prenotazioni.exprivia.exprv.entity.Building;
import com.prenotazioni.exprivia.exprv.entity.Floor;
import com.prenotazioni.exprivia.exprv.entity.Room;
import com.prenotazioni.exprivia.exprv.entity.Workspace;
import com.prenotazioni.exprivia.exprv.exceptions.AppException;
import com.prenotazioni.exprivia.exprv.mapper.FloorMapper;
import com.prenotazioni.exprivia.exprv.mapper.RoomMapper;
import com.prenotazioni.exprivia.exprv.mapper.WorkspaceMapper;
import com.prenotazioni.exprivia.exprv.repository.BuildingRepository;
import com.prenotazioni.exprivia.exprv.repository.FloorRepository;
import com.prenotazioni.exprivia.exprv.repository.RoomRepository;
import com.prenotazioni.exprivia.exprv.repository.WorkspaceRepository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Optional;

@Service
public class FloorService {

    private final FloorRepository floorRepository;
    private final FloorMapper floorMapper;
    private final BuildingRepository buildingRepository;
    private final FileStorageService fileStorageService;
    private final RoomRepository roomRepository;
    private final RoomService roomService;
    private final WorkspaceRepository workspaceRepository;
    private final RoomMapper roomMapper;
    private final WorkspaceMapper workspaceMapper;
    public FloorService(FloorRepository floorRepository, FloorMapper floorMapper,
            BuildingRepository buildingRepository, FileStorageService fileStorageService,
            RoomRepository roomRepository, @Lazy RoomService roomService,
            WorkspaceRepository workspaceRepository, RoomMapper roomMapper,
            WorkspaceMapper workspaceMapper) {
        this.floorRepository = floorRepository;
        this.floorMapper = floorMapper;
        this.buildingRepository = buildingRepository;
        this.fileStorageService = fileStorageService;
        this.roomRepository = roomRepository;
        this.roomService = roomService;
        this.workspaceRepository = workspaceRepository;
        this.roomMapper = roomMapper;
        this.workspaceMapper = workspaceMapper;
    }

    public List<FloorDTO> findAllFloors(boolean enabledOnly) {
        List<FloorDTO> dtos;
        if (enabledOnly) {
            dtos = floorMapper.toDtoList(floorRepository.findAllByEnabledTrue());
        } else {
            dtos = floorMapper.toDtoList(floorRepository.findAll());
        }
        for (FloorDTO dto : dtos) {
            List<Workspace> workspaces = enabledOnly ? 
                workspaceRepository.findByRoomFloorIdAndEnabledTrue(dto.getId()) :
                workspaceRepository.findByRoomFloorId(dto.getId());
            dto.setWorkspaces(workspaceMapper.toDtoList(workspaces));
            
            List<Room> rooms = enabledOnly ?
                roomRepository.findByFloorIdAndEnabledTrue(dto.getId()) :
                roomRepository.findByFloorId(dto.getId());
            dto.setRooms(roomMapper.toDtoList(rooms));
        }
        return dtos;
    }

    public List<FloorDTO> findFloorsByBuildingId(Integer buildingId, boolean enabledOnly) {
        List<FloorDTO> dtos;
        if (enabledOnly) {
            dtos = floorMapper.toDtoList(floorRepository.findByBuildingIdAndEnabledTrue(buildingId));
        } else {
            dtos = floorMapper.toDtoList(floorRepository.findByBuildingId(buildingId));
        }
        for (FloorDTO dto : dtos) {
            List<Workspace> workspaces = enabledOnly ? 
                workspaceRepository.findByRoomFloorIdAndEnabledTrue(dto.getId()) :
                workspaceRepository.findByRoomFloorId(dto.getId());
            dto.setWorkspaces(workspaceMapper.toDtoList(workspaces));
            
            List<Room> rooms = enabledOnly ?
                roomRepository.findByFloorIdAndEnabledTrue(dto.getId()) :
                roomRepository.findByFloorId(dto.getId());
            dto.setRooms(roomMapper.toDtoList(rooms));
        }
        return dtos;
    }

    public List<SelectOptionDTO> getFloorOptionsByBuilding(Integer buildingId) {
        return floorMapper.toSelectOptionDTOList(floorRepository.findByBuildingIdAndEnabledTrue(buildingId));
    }

    public FloorDTO findFloorById(Integer id) {
        FloorDTO dto = floorMapper.toDto(floorRepository.findById(id)
                .orElseThrow(() -> new AppException("Floor with ID " + id + " not found", HttpStatus.NOT_FOUND)));
        List<Workspace> workspaces = workspaceRepository.findByRoomFloorId(id);
        dto.setWorkspaces(workspaceMapper.toDtoList(workspaces));
        
        List<Room> rooms = roomRepository.findByFloorId(id);
        dto.setRooms(roomMapper.toDtoList(rooms));
        
        return dto;
    }

    @Transactional
    public FloorDTO createFloor(FloorDTO floorDTO) {
        Floor floor = floorMapper.toEntity(floorDTO);
        floor.setId(null);

        if (floorDTO.getBuildingId() != null) {
            Building building = buildingRepository.findById(floorDTO.getBuildingId())
                    .orElseThrow(() -> new AppException("Building with ID " + floorDTO.getBuildingId() + " not found",
                            HttpStatus.NOT_FOUND));
            floor.setBuilding(building);
        }

        Floor savedFloor = floorRepository.save(floor);
        FloorDTO result = floorMapper.toDto(savedFloor);
        List<Workspace> workspaces = workspaceRepository.findByRoomFloorId(savedFloor.getId());
        result.setWorkspaces(workspaceMapper.toDtoList(workspaces));
        
        List<Room> rooms = roomRepository.findByFloorId(savedFloor.getId());
        result.setRooms(roomMapper.toDtoList(rooms));
        
        return result;
    }

    @Transactional
    public FloorDTO updateFloor(Integer id, FloorDTO floorDTO) {
        Floor existingFloor = floorRepository.findById(id)
                .orElseThrow(() -> new AppException("Floor with ID " + id + " not found", HttpStatus.NOT_FOUND));

        floorMapper.updateFloorFromDto(floorDTO, existingFloor);

        if (floorDTO.getBuildingId() != null) {
            Building building = buildingRepository.findById(floorDTO.getBuildingId())
                    .orElseThrow(() -> new AppException("Building with ID " + floorDTO.getBuildingId() + " not found",
                            HttpStatus.NOT_FOUND));
            existingFloor.setBuilding(building);
        }

        floorRepository.save(existingFloor);
        FloorDTO result = floorMapper.toDto(existingFloor);
        List<Workspace> workspaces = workspaceRepository.findByRoomFloorId(existingFloor.getId());
        result.setWorkspaces(workspaceMapper.toDtoList(workspaces));
        
        List<Room> rooms = roomRepository.findByFloorId(existingFloor.getId());
        result.setRooms(roomMapper.toDtoList(rooms));
        
        return result;
    }

    @Transactional
    public void softDeleteFloor(Integer id) {
        Floor existingFloor = floorRepository.findById(id)
                .orElseThrow(() -> new AppException("Floor with ID " + id + " not found", HttpStatus.NOT_FOUND));
        
        // Disabilita il piano
        existingFloor.setEnabled(false);
        floorRepository.save(existingFloor);
        
        // Cascata: Disabilita tutte le stanze del piano
        List<Room> rooms = roomRepository.findByFloorId(id);
        rooms.forEach(r -> roomService.softDeleteRoom(r.getId()));
    }

    @Transactional
    public void hardDeleteFloor(Integer id) {
        if (!floorRepository.existsById(id)) {
            throw new AppException("Floor with ID " + id + " not found", HttpStatus.NOT_FOUND);
        }
        floorRepository.deleteById(id);
    }

}