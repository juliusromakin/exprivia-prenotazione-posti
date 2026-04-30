package com.prenotazioni.exprivia.exprv.service;

import java.util.List;

import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.prenotazioni.exprivia.exprv.dto.FloorDTO;
import com.prenotazioni.exprivia.exprv.dto.FloorPlanObjectDTO;
import com.prenotazioni.exprivia.exprv.dto.SelectOptionDTO;
import com.prenotazioni.exprivia.exprv.entity.Building;
import com.prenotazioni.exprivia.exprv.entity.Floor;
import com.prenotazioni.exprivia.exprv.entity.Room;
import com.prenotazioni.exprivia.exprv.entity.Workspace;
import com.prenotazioni.exprivia.exprv.exceptions.AppException;
import com.prenotazioni.exprivia.exprv.mapper.FloorMapper;
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

    public FloorService(FloorRepository floorRepository, FloorMapper floorMapper,
            BuildingRepository buildingRepository, FileStorageService fileStorageService,
            RoomRepository roomRepository, @Lazy RoomService roomService,
            WorkspaceRepository workspaceRepository) {
        this.floorRepository = floorRepository;
        this.floorMapper = floorMapper;
        this.buildingRepository = buildingRepository;
        this.fileStorageService = fileStorageService;
        this.roomRepository = roomRepository;
        this.roomService = roomService;
        this.workspaceRepository = workspaceRepository;
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

        // Update positions of rooms and workspaces
        if (floorDTO.getObjects() != null) {
            for (FloorPlanObjectDTO obj : floorDTO.getObjects()) {
                if ("room".equalsIgnoreCase(obj.getType()) || "stanza".equalsIgnoreCase(obj.getType())) {
                    updateRoomPosition(obj);
                } else if ("workspace".equalsIgnoreCase(obj.getType()) || "postazione".equalsIgnoreCase(obj.getType())) {
                    updateWorkspacePosition(obj);
                }
            }
        }
    }

    private void updateRoomPosition(FloorPlanObjectDTO objDto) {
        Optional<Room> roomOpt = roomRepository.findByName(objDto.getIdentifier());
        if (roomOpt.isPresent()) {
            Room room = roomOpt.get();
            room.setMapX(objDto.getX());
            room.setMapY(objDto.getY());
            room.setMapWidth(objDto.getWidth());
            room.setMapHeight(objDto.getHeight());
            roomRepository.save(room);
        }
    }

    private void updateWorkspacePosition(FloorPlanObjectDTO objDto) {
        Optional<Workspace> workspaceOpt = workspaceRepository.findByName(objDto.getIdentifier());
        if (workspaceOpt.isPresent()) {
            Workspace workspace = workspaceOpt.get();
            workspace.setMapX(objDto.getX());
            workspace.setMapY(objDto.getY());
            workspaceRepository.save(workspace);
        }
    }

    public FloorDTO getFloorPlanimetry(Integer floorId) {
        Floor floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new AppException("Floor not found", HttpStatus.NOT_FOUND));

        FloorDTO floorDTO = floorMapper.toDto(floor);

        List<Room> rooms = roomRepository.findByFloorId(floorId);
        List<Workspace> workspaces = workspaceRepository.findByRoomFloorId(floorId);

        List<FloorPlanObjectDTO> objects = new ArrayList<>();

        for (Room room : rooms) {
            objects.add(new FloorPlanObjectDTO("room", room.getName(), room.getMapX(), room.getMapY(),
                    room.getMapWidth(), room.getMapHeight()));
        }

        for (Workspace workspace : workspaces) {
            objects.add(new FloorPlanObjectDTO("workspace", workspace.getName(), workspace.getMapX(),
                    workspace.getMapY(), null, null));
        }

        floorDTO.setObjects(objects);
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