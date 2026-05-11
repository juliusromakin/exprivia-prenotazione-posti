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
    private final com.prenotazioni.exprivia.exprv.repository.FloorPlanRepository floorPlanRepository;
    private final com.prenotazioni.exprivia.exprv.repository.RoomPositionRepository roomPositionRepository;
    private final com.prenotazioni.exprivia.exprv.repository.WorkspacePositionRepository workspacePositionRepository;

    public FloorService(FloorRepository floorRepository, FloorMapper floorMapper,
            BuildingRepository buildingRepository, FileStorageService fileStorageService,
            RoomRepository roomRepository, @Lazy RoomService roomService,
            WorkspaceRepository workspaceRepository, RoomMapper roomMapper,
            WorkspaceMapper workspaceMapper,
            com.prenotazioni.exprivia.exprv.repository.FloorPlanRepository floorPlanRepository,
            com.prenotazioni.exprivia.exprv.repository.RoomPositionRepository roomPositionRepository,
            com.prenotazioni.exprivia.exprv.repository.WorkspacePositionRepository workspacePositionRepository) {
        this.floorRepository = floorRepository;
        this.floorMapper = floorMapper;
        this.buildingRepository = buildingRepository;
        this.fileStorageService = fileStorageService;
        this.roomRepository = roomRepository;
        this.roomService = roomService;
        this.workspaceRepository = workspaceRepository;
        this.roomMapper = roomMapper;
        this.workspaceMapper = workspaceMapper;
        this.floorPlanRepository = floorPlanRepository;
        this.roomPositionRepository = roomPositionRepository;
        this.workspacePositionRepository = workspacePositionRepository;
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

    @Transactional
    public FloorPlanDTO savePlanimetry(FloorPlanDTO floorPlanDTO) {
        Floor floor = floorRepository.findById(floorPlanDTO.getFloorId())
                .orElseThrow(() -> new AppException("Floor not found", HttpStatus.NOT_FOUND));

        LocalDate dateToSearch = floorPlanDTO.getValidFrom() != null ? floorPlanDTO.getValidFrom() : LocalDate.now();
        com.prenotazioni.exprivia.exprv.entity.FloorPlan floorPlan = floorPlanRepository.findActiveFloorPlan(floor.getId(), dateToSearch)
                .orElseGet(() -> {
                    com.prenotazioni.exprivia.exprv.entity.FloorPlan fp = new com.prenotazioni.exprivia.exprv.entity.FloorPlan();
                    fp.setFloor(floor);
                    fp.setValidFrom(dateToSearch);
                    return fp;
                });

        if (floorPlanDTO.getCanvasWidth() != null) {
            floorPlan.setCanvasWidth(floorPlanDTO.getCanvasWidth());
        }
        if (floorPlanDTO.getCanvasHeight() != null) {
            floorPlan.setCanvasHeight(floorPlanDTO.getCanvasHeight());
        }
        if (floorPlanDTO.getValidFrom() != null) {
            floorPlan.setValidFrom(floorPlanDTO.getValidFrom());
        }
        if (floorPlanDTO.getValidTo() != null) {
            floorPlan.setValidTo(floorPlanDTO.getValidTo());
        }
        if (floorPlanDTO.getImagePath() != null) {
            floorPlan.setImagePath(floorPlanDTO.getImagePath());
        }
        
        floorPlan = floorPlanRepository.save(floorPlan);

        // Update positions of rooms
        if (floorPlanDTO.getRooms() != null) {
            for (com.prenotazioni.exprivia.exprv.dto.RoomPositionDTO roomDto : floorPlanDTO.getRooms()) {
                updateRoomPosition(floorPlan, roomDto);
            }
        }

        // Update positions of workspaces
        if (floorPlanDTO.getWorkspaces() != null) {
            for (com.prenotazioni.exprivia.exprv.dto.WorkspacePositionDTO workspaceDto : floorPlanDTO.getWorkspaces()) {
                updateWorkspacePosition(floorPlan, workspaceDto);
            }
        }
        
        return getFloorPlanDto(floorPlan);
    }

    private void updateRoomPosition(com.prenotazioni.exprivia.exprv.entity.FloorPlan floorPlan, com.prenotazioni.exprivia.exprv.dto.RoomPositionDTO roomDto) {
        if (roomDto.getRoomId() == null) return;
        Optional<Room> roomOpt = roomRepository.findById(roomDto.getRoomId());
        if (roomOpt.isPresent()) {
            Room room = roomOpt.get();
            com.prenotazioni.exprivia.exprv.entity.RoomPosition rp = roomPositionRepository.findByFloorPlanIdAndRoomId(floorPlan.getId(), room.getId())
                    .orElseGet(() -> {
                        com.prenotazioni.exprivia.exprv.entity.RoomPosition newRp = new com.prenotazioni.exprivia.exprv.entity.RoomPosition();
                        newRp.setFloorPlan(floorPlan);
                        newRp.setRoom(room);
                        return newRp;
                    });
            rp.setMapX(roomDto.getMapX());
            rp.setMapY(roomDto.getMapY());
            rp.setMapWidth(roomDto.getMapWidth());
            rp.setMapHeight(roomDto.getMapHeight());
            roomPositionRepository.save(rp);
        }
    }

    private void updateWorkspacePosition(com.prenotazioni.exprivia.exprv.entity.FloorPlan floorPlan, com.prenotazioni.exprivia.exprv.dto.WorkspacePositionDTO workspaceDto) {
        if (workspaceDto.getWorkspaceId() == null) return;
        Optional<Workspace> workspaceOpt = workspaceRepository.findById(workspaceDto.getWorkspaceId());
        if (workspaceOpt.isPresent()) {
            Workspace workspace = workspaceOpt.get();
            com.prenotazioni.exprivia.exprv.entity.WorkspacePosition wp = workspacePositionRepository.findByFloorPlanIdAndWorkspaceId(floorPlan.getId(), workspace.getId())
                    .orElseGet(() -> {
                        com.prenotazioni.exprivia.exprv.entity.WorkspacePosition newWp = new com.prenotazioni.exprivia.exprv.entity.WorkspacePosition();
                        newWp.setFloorPlan(floorPlan);
                        newWp.setWorkspace(workspace);
                        return newWp;
                    });
            wp.setMapX(workspaceDto.getMapX());
            wp.setMapY(workspaceDto.getMapY());
            workspacePositionRepository.save(wp);
        }
    }

    public FloorPlanDTO getFloorPlanimetry(Integer floorId, LocalDate date) {
        if (date == null) date = LocalDate.now();
        Optional<com.prenotazioni.exprivia.exprv.entity.FloorPlan> fpOpt = floorPlanRepository.findActiveFloorPlan(floorId, date);
        if (fpOpt.isEmpty()) {
            throw new AppException("Planimetria non trovata per la data richiesta", HttpStatus.NOT_FOUND);
        }
        return getFloorPlanDto(fpOpt.get());
    }
    
    private FloorPlanDTO getFloorPlanDto(com.prenotazioni.exprivia.exprv.entity.FloorPlan fp) {
        FloorPlanDTO dto = new FloorPlanDTO();
        dto.setId(fp.getId());
        dto.setFloorId(fp.getFloor().getId());
        dto.setValidFrom(fp.getValidFrom());
        dto.setValidTo(fp.getValidTo());
        dto.setImagePath(fp.getImagePath());
        dto.setCanvasWidth(fp.getCanvasWidth());
        dto.setCanvasHeight(fp.getCanvasHeight());
        
        List<com.prenotazioni.exprivia.exprv.entity.RoomPosition> roomPositions = roomPositionRepository.findByFloorPlanId(fp.getId());
        List<com.prenotazioni.exprivia.exprv.entity.WorkspacePosition> workspacePositions = workspacePositionRepository.findByFloorPlanId(fp.getId());
        
        List<com.prenotazioni.exprivia.exprv.dto.RoomPositionDTO> roomDTOs = roomPositions.stream().map(rp -> {
            com.prenotazioni.exprivia.exprv.dto.RoomPositionDTO rd = new com.prenotazioni.exprivia.exprv.dto.RoomPositionDTO();
            rd.setId(rp.getId());
            rd.setRoomId(rp.getRoom().getId());
            rd.setMapX(rp.getMapX());
            rd.setMapY(rp.getMapY());
            rd.setMapWidth(rp.getMapWidth());
            rd.setMapHeight(rp.getMapHeight());
            return rd;
        }).toList();
        
        List<com.prenotazioni.exprivia.exprv.dto.WorkspacePositionDTO> workspaceDTOs = workspacePositions.stream().map(wp -> {
            com.prenotazioni.exprivia.exprv.dto.WorkspacePositionDTO wd = new com.prenotazioni.exprivia.exprv.dto.WorkspacePositionDTO();
            wd.setId(wp.getId());
            wd.setWorkspaceId(wp.getWorkspace().getId());
            wd.setMapX(wp.getMapX());
            wd.setMapY(wp.getMapY());
            return wd;
        }).toList();
        
        dto.setRooms(roomDTOs);
        dto.setWorkspaces(workspaceDTOs);
        return dto;
    }

    @Transactional
    public String uploadPlanimetryImage(Integer floorId, MultipartFile file) {
        Floor floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new AppException("Floor not found", HttpStatus.NOT_FOUND));

        java.time.LocalDate now = java.time.LocalDate.now();
        com.prenotazioni.exprivia.exprv.entity.FloorPlan floorPlan = floorPlanRepository.findActiveFloorPlan(floor.getId(), now)
                .orElseGet(() -> {
                    com.prenotazioni.exprivia.exprv.entity.FloorPlan fp = new com.prenotazioni.exprivia.exprv.entity.FloorPlan();
                    fp.setFloor(floor);
                    fp.setValidFrom(now);
                    return fp;
                });

        String fileName = fileStorageService.storeFile(file, "floor_plan_" + floorId);
        floorPlan.setImagePath(fileName);
        floorPlanRepository.save(floorPlan);

        return fileName;
    }

}