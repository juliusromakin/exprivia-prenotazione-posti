package com.prenotazioni.exprivia.exprv.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.prenotazioni.exprivia.exprv.dto.FloorPlanDTO;
import com.prenotazioni.exprivia.exprv.dto.FloorPlanObjectDTO;
import com.prenotazioni.exprivia.exprv.entity.Floor;
import com.prenotazioni.exprivia.exprv.entity.FloorPlan;
import com.prenotazioni.exprivia.exprv.entity.Room;
import com.prenotazioni.exprivia.exprv.entity.Workspace;
import com.prenotazioni.exprivia.exprv.repository.FloorRepository;
import com.prenotazioni.exprivia.exprv.repository.FloorPlanRepository;
import com.prenotazioni.exprivia.exprv.repository.RoomRepository;
import com.prenotazioni.exprivia.exprv.repository.WorkspaceRepository;
import com.prenotazioni.exprivia.exprv.exceptions.AppException;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class FloorPlanService {

    private final FloorPlanRepository floorPlanRepository;
    private final FloorRepository floorRepository;
    private final RoomRepository roomRepository;
    private final WorkspaceRepository workspaceRepository;
    private final FileStorageService fileStorageService;

    public FloorPlanService(FloorPlanRepository floorPlanRepository, FloorRepository floorRepository,
            RoomRepository roomRepository, WorkspaceRepository workspaceRepository,
            FileStorageService fileStorageService) {
        this.floorPlanRepository = floorPlanRepository;
        this.floorRepository = floorRepository;
        this.roomRepository = roomRepository;
        this.workspaceRepository = workspaceRepository;
        this.fileStorageService = fileStorageService;
    }

    @Transactional
    public void saveFloorPlan(FloorPlanDTO floorPlanDTO) {
        Floor floor = floorRepository.findById(floorPlanDTO.getFloorId())
                .orElseThrow(() -> new AppException("Floor not found", HttpStatus.NOT_FOUND));

        // Save or update floor plan metadata (e.g., canvas dimensions)
        FloorPlan floorPlan = floorPlanRepository.findByFloorId(floor.getId())
                .orElse(new FloorPlan(floor, null, 800.0, 450.0));
        
        if (floorPlanDTO.getCanvasWidth() != null) {
            floorPlan.setCanvasWidth(floorPlanDTO.getCanvasWidth());
        }
        if (floorPlanDTO.getCanvasHeight() != null) {
            floorPlan.setCanvasHeight(floorPlanDTO.getCanvasHeight());
        }

        floorPlanRepository.save(floorPlan);

        // Update positions of rooms and workspaces
        if (floorPlanDTO.getObjects() != null) {
            for (FloorPlanObjectDTO obj : floorPlanDTO.getObjects()) {
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

    public FloorPlanDTO getFloorPlan(Integer floorId) {
        Floor floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new AppException("Floor not found", HttpStatus.NOT_FOUND));

        List<Room> rooms = roomRepository.findByFloorId(floorId);
        List<Workspace> workspaces = workspaceRepository.findByRoomFloorId(floorId);

        List<FloorPlanObjectDTO> objects = new ArrayList<>();

        for (Room room : rooms) {
            objects.add(new FloorPlanObjectDTO("room", room.getName(), room.getMapX(), room.getMapY(), room.getMapWidth(),
                    room.getMapHeight()));
        }

        for (Workspace workspace : workspaces) {
            objects.add(new FloorPlanObjectDTO("workspace", workspace.getName(), workspace.getMapX(), workspace.getMapY(),
                    null, null));
        }

        String buildingAddress = floor.getBuilding() != null ? floor.getBuilding().getAddress() : null;
        String locationName = (floor.getBuilding() != null && floor.getBuilding().getLocation() != null)
                ? floor.getBuilding().getLocation().getName()
                : null;

        Optional<FloorPlan> floorPlanOpt = floorPlanRepository.findByFloorId(floorId);
        String imagePath = floorPlanOpt.map(FloorPlan::getImagePath).orElse(null);
        Double canvasWidth = floorPlanOpt.map(FloorPlan::getCanvasWidth).orElse(800.0);
        Double canvasHeight = floorPlanOpt.map(FloorPlan::getCanvasHeight).orElse(450.0);

        return new FloorPlanDTO(floorId, floor.getName(), buildingAddress, locationName, imagePath, canvasWidth, canvasHeight, objects);
    }

    @Transactional
    public String uploadFloorPlanImage(Integer floorId, MultipartFile file) {
        Floor floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new AppException("Floor not found", HttpStatus.NOT_FOUND));

        FloorPlan floorPlan = floorPlanRepository.findByFloorId(floor.getId())
                .orElse(new FloorPlan(floor, null, 800.0, 450.0));

        String fileName = fileStorageService.storeFile(file, "floor_plan_" + floorId);
        floorPlan.setImagePath(fileName);
        floorPlanRepository.save(floorPlan);
        
        return fileName;
    }
}
