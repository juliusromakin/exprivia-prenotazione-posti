package com.prenotazioni.exprivia.exprv.service;

import java.util.List;

import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.prenotazioni.exprivia.exprv.dto.FloorDTO;
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
        if (enabledOnly) {
            return floorMapper.toDtoList(floorRepository.findAllByEnabledTrue());
        }
        return floorMapper.toDtoList(floorRepository.findAll());
    }

    public List<FloorDTO> findFloorsByBuildingId(Integer buildingId, boolean enabledOnly) {
        if (enabledOnly) {
            return floorMapper.toDtoList(floorRepository.findByBuildingIdAndEnabledTrue(buildingId));
        }
        return floorMapper.toDtoList(floorRepository.findByBuildingId(buildingId));
    }

    public List<SelectOptionDTO> getFloorOptionsByBuilding(Integer buildingId) {
        return floorMapper.toSelectOptionDTOList(floorRepository.findByBuildingIdAndEnabledTrue(buildingId));
    }

    public FloorDTO findFloorById(Integer id) {
        return floorMapper.toDto(floorRepository.findById(id)
                .orElseThrow(() -> new AppException("Floor with ID " + id + " not found", HttpStatus.NOT_FOUND)));
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
        return floorMapper.toDto(savedFloor);
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
        return floorMapper.toDto(existingFloor);
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

    @Transactional
    public void savePlanimetry(FloorDTO floorDTO) {
        Floor floor = floorRepository.findById(floorDTO.getId())
                .orElseThrow(() -> new AppException("Floor not found", HttpStatus.NOT_FOUND));

        if (floorDTO.getCanvasWidth() != null) {
            floor.setCanvasWidth(floorDTO.getCanvasWidth());
        }
        if (floorDTO.getCanvasHeight() != null) {
            floor.setCanvasHeight(floorDTO.getCanvasHeight());
        }

        floorRepository.save(floor);

        // Update positions of rooms
        if (floorDTO.getRooms() != null) {
            for (RoomDTO roomDto : floorDTO.getRooms()) {
                updateRoomPosition(roomDto);
            }
        }

        // Update positions of workspaces
        if (floorDTO.getWorkspaces() != null) {
            for (WorkspaceDTO workspaceDto : floorDTO.getWorkspaces()) {
                updateWorkspacePosition(workspaceDto);
            }
        }
    }

    private void updateRoomPosition(RoomDTO roomDto) {
        Optional<Room> roomOpt = roomRepository.findById(roomDto.getId());
        if (roomOpt.isPresent()) {
            Room room = roomOpt.get();
            room.setMapX(roomDto.getMapX());
            room.setMapY(roomDto.getMapY());
            room.setMapWidth(roomDto.getMapWidth());
            room.setMapHeight(roomDto.getMapHeight());
            roomRepository.save(room);
        }
    }

    private void updateWorkspacePosition(WorkspaceDTO workspaceDto) {
        Optional<Workspace> workspaceOpt = workspaceRepository.findById(workspaceDto.getId());
        if (workspaceOpt.isPresent()) {
            Workspace workspace = workspaceOpt.get();
            workspace.setMapX(workspaceDto.getMapX());
            workspace.setMapY(workspaceDto.getMapY());
            workspaceRepository.save(workspace);
        }
    }

    public FloorDTO getFloorPlanimetry(Integer floorId) {
        Floor floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new AppException("Floor not found", HttpStatus.NOT_FOUND));

        FloorDTO floorDTO = floorMapper.toDto(floor);

        List<Room> rooms = roomRepository.findByFloorId(floorId);
        List<Workspace> workspaces = workspaceRepository.findByRoomFloorId(floorId);

        floorDTO.setRooms(roomMapper.toDtoList(rooms));
        floorDTO.setWorkspaces(workspaceMapper.toDtoList(workspaces));

        return floorDTO;
    }

    @Transactional
    public String uploadPlanimetryImage(Integer floorId, MultipartFile file) {
        Floor floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new AppException("Floor not found", HttpStatus.NOT_FOUND));

        String fileName = fileStorageService.storeFile(file, "floor_plan_" + floorId);
        floor.setImagePath(fileName);
        floorRepository.save(floor);

        return fileName;
    }

}