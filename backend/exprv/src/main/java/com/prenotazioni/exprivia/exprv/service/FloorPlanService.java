package com.prenotazioni.exprivia.exprv.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.prenotazioni.exprivia.exprv.dto.FloorPlanDTO;
import com.prenotazioni.exprivia.exprv.dto.FloorPlanSummaryDTO;
import com.prenotazioni.exprivia.exprv.dto.RoomPositionDTO;
import com.prenotazioni.exprivia.exprv.dto.WorkspacePositionDTO;
import com.prenotazioni.exprivia.exprv.entity.Floor;
import com.prenotazioni.exprivia.exprv.entity.FloorPlan;
import com.prenotazioni.exprivia.exprv.entity.Room;
import com.prenotazioni.exprivia.exprv.entity.RoomPosition;
import com.prenotazioni.exprivia.exprv.entity.Workspace;
import com.prenotazioni.exprivia.exprv.entity.WorkspacePosition;
import com.prenotazioni.exprivia.exprv.exceptions.AppException;

import com.prenotazioni.exprivia.exprv.mapper.FloorPlanMapper;
import com.prenotazioni.exprivia.exprv.repository.FloorPlanRepository;
import com.prenotazioni.exprivia.exprv.repository.FloorRepository;
import com.prenotazioni.exprivia.exprv.repository.RoomPositionRepository;
import com.prenotazioni.exprivia.exprv.repository.RoomRepository;
import com.prenotazioni.exprivia.exprv.repository.WorkspacePositionRepository;
import com.prenotazioni.exprivia.exprv.repository.WorkspaceRepository;

@Service
public class FloorPlanService {

    private final FloorPlanRepository floorPlanRepository;
    private final FloorRepository floorRepository;
    private final FloorPlanMapper floorPlanMapper;
    private final RoomPositionRepository roomPositionRepository;
    private final WorkspacePositionRepository workspacePositionRepository;
    private final RoomRepository roomRepository;
    private final WorkspaceRepository workspaceRepository;
    private final FileStorageService fileStorageService;

    public FloorPlanService(FloorPlanRepository floorPlanRepository, FloorRepository floorRepository,
            FloorPlanMapper floorPlanMapper, RoomPositionRepository roomPositionRepository,
            WorkspacePositionRepository workspacePositionRepository, RoomRepository roomRepository,
            WorkspaceRepository workspaceRepository, FileStorageService fileStorageService) {
        this.floorPlanRepository = floorPlanRepository;
        this.floorRepository = floorRepository;
        this.floorPlanMapper = floorPlanMapper;
        this.roomPositionRepository = roomPositionRepository;
        this.workspacePositionRepository = workspacePositionRepository;
        this.roomRepository = roomRepository;
        this.workspaceRepository = workspaceRepository;
        this.fileStorageService = fileStorageService;
    }

    @Transactional(readOnly = true)
    public List<FloorPlanSummaryDTO> getFloorPlansByFloorId(Integer floorId) {
        if (!floorRepository.existsById(floorId)) {
            throw new AppException("Floor not found", HttpStatus.NOT_FOUND);
        }
        List<FloorPlan> plans = floorPlanRepository.findAllByFloorIdOrderByValidFromDesc(floorId);
        return floorPlanMapper.toSummaryDtoList(plans);
    }

    @Transactional
    public void deleteFloorPlan(Integer id) {
        FloorPlan plan = floorPlanRepository.findById(id)
                .orElseThrow(() -> new AppException("FloorPlan not found", HttpStatus.NOT_FOUND));
        
        // Delete dependent position mappings first to satisfy foreign key constraint
        roomPositionRepository.deleteByFloorPlanId(id);
        workspacePositionRepository.deleteByFloorPlanId(id);
        
        // Delete the floor plan itself
        floorPlanRepository.delete(plan);
    }

    @Transactional
    public FloorPlanSummaryDTO toggleFloorPlanStatus(Integer id) {
        FloorPlan plan = floorPlanRepository.findById(id)
                .orElseThrow(() -> new AppException("FloorPlan not found", HttpStatus.NOT_FOUND));

        if (!plan.getIsActive()) {
            boolean hasOverlap = floorPlanRepository.existsOverlappingActivePlan(
                    plan.getFloor().getId(),
                    plan.getValidFrom(),
                    plan.getValidTo(),
                    plan.getId());
            if (hasOverlap) {
                throw new AppException("Impossibile attivare: Esiste già una planimetria attiva in questo periodo per questo piano.", HttpStatus.BAD_REQUEST);
            }
        }

        plan.setIsActive(!plan.getIsActive());
        return floorPlanMapper.toSummaryDto(floorPlanRepository.save(plan));
    }

    @Transactional
    public FloorPlanDTO savePlanimetry(FloorPlanDTO floorPlanDTO) {
        Floor floor = floorRepository.findById(floorPlanDTO.getFloorId())
                .orElseThrow(() -> new AppException("Floor not found", HttpStatus.NOT_FOUND));

        LocalDate newValidFrom = floorPlanDTO.getValidFrom() != null ? floorPlanDTO.getValidFrom() : LocalDate.now();

        FloorPlan floorPlan;

        if (floorPlanDTO.getId() != null) {
            Optional<FloorPlan> existingOpt = floorPlanRepository.findById(floorPlanDTO.getId());
            if (existingOpt.isPresent() && existingOpt.get().getValidFrom().equals(newValidFrom)) {
                floorPlan = existingOpt.get();
            } else {
                floorPlan = new FloorPlan();
                floorPlan.setFloor(floor);
                floorPlan.setValidFrom(newValidFrom);
                floorPlan.setName(floorPlanDTO.getName());
            }
        } else {
            floorPlan = new FloorPlan();
            floorPlan.setFloor(floor);
            floorPlan.setValidFrom(newValidFrom);
            floorPlan.setName(floorPlanDTO.getName());
        }

        floorPlan.setValidFrom(newValidFrom);
        if (floorPlanDTO.getName() != null) {
            floorPlan.setName(floorPlanDTO.getName());
        }
        if (floorPlanDTO.getIsActive() != null) {
            floorPlan.setIsActive(floorPlanDTO.getIsActive());
        }
        if (floorPlanDTO.getValidTo() != null) {
            floorPlan.setValidTo(floorPlanDTO.getValidTo());
        }
        if (floorPlanDTO.getCanvasWidth() != null) {
            floorPlan.setCanvasWidth(floorPlanDTO.getCanvasWidth());
        }
        if (floorPlanDTO.getCanvasHeight() != null) {
            floorPlan.setCanvasHeight(floorPlanDTO.getCanvasHeight());
        }
        if (floorPlanDTO.getImagePath() != null) {
            floorPlan.setImagePath(floorPlanDTO.getImagePath());
        }

        if (floorPlan.getIsActive()) {
            boolean hasOverlap = floorPlanRepository.existsOverlappingActivePlan(
                    floor.getId(),
                    floorPlan.getValidFrom(),
                    floorPlan.getValidTo(),
                    floorPlan.getId());
            if (hasOverlap) {
                // Come richiesto dall'utente, salviamo comunque la mappa ma la rendiamo inattiva
                floorPlan.setIsActive(false);
            }
        }

        floorPlan = floorPlanRepository.save(floorPlan);

        if (floorPlanDTO.getRooms() != null) {
            for (RoomPositionDTO roomDto : floorPlanDTO.getRooms()) {
                updateRoomPosition(floorPlan, roomDto);
            }
        }

        if (floorPlanDTO.getWorkspaces() != null) {
            for (WorkspacePositionDTO workspaceDto : floorPlanDTO.getWorkspaces()) {
                updateWorkspacePosition(floorPlan, workspaceDto);
            }
        }

        return getFloorPlanDto(floorPlan);
    }

    private void updateRoomPosition(FloorPlan floorPlan, RoomPositionDTO roomDto) {
        if (roomDto.getRoomId() == null) return;
        Optional<Room> roomOpt = roomRepository.findById(roomDto.getRoomId());
        if (roomOpt.isPresent()) {
            Room room = roomOpt.get();
            RoomPosition rp = roomPositionRepository.findByFloorPlanIdAndRoomId(floorPlan.getId(), room.getId())
                    .orElseGet(() -> {
                        RoomPosition newRp = new RoomPosition();
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

    private void updateWorkspacePosition(FloorPlan floorPlan, WorkspacePositionDTO workspaceDto) {
        if (workspaceDto.getWorkspaceId() == null) return;
        Optional<Workspace> workspaceOpt = workspaceRepository.findById(workspaceDto.getWorkspaceId());
        if (workspaceOpt.isPresent()) {
            Workspace workspace = workspaceOpt.get();
            WorkspacePosition wp = workspacePositionRepository
                    .findByFloorPlanIdAndWorkspaceId(floorPlan.getId(), workspace.getId())
                    .orElseGet(() -> {
                        WorkspacePosition newWp = new WorkspacePosition();
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
        Optional<FloorPlan> fpOpt = floorPlanRepository.findActiveFloorPlan(floorId, date);
        if (fpOpt.isEmpty()) {
            List<FloorPlan> allPlans = floorPlanRepository.findAllByFloorIdOrderByValidFromDesc(floorId);
            if (!allPlans.isEmpty()) {
                fpOpt = Optional.of(allPlans.get(0));
            }
        }
        if (fpOpt.isEmpty()) {
            throw new AppException("Planimetria non trovata per la data richiesta", HttpStatus.NOT_FOUND);
        }
        return getFloorPlanDto(fpOpt.get());
    }

    public List<FloorPlanDTO> getAllFloorPlansByBuildingId(Integer buildingId) {
        List<Floor> floors = floorRepository.findByBuildingId(buildingId);
        List<FloorPlanDTO> result = new ArrayList<>();
        for (Floor floor : floors) {
            List<FloorPlan> plans = floorPlanRepository.findAllByFloorIdOrderByValidFromDesc(floor.getId());
            for (FloorPlan plan : plans) {
                FloorPlanDTO dto = getFloorPlanDto(plan);
                result.add(dto);
            }
        }
        return result;
    }

    private FloorPlanDTO getFloorPlanDto(FloorPlan fp) {
        FloorPlanDTO dto = new FloorPlanDTO();
        dto.setId(fp.getId());
        dto.setFloorId(fp.getFloor().getId());
        dto.setFloorName(fp.getFloor().getName());
        dto.setName(fp.getName());
        dto.setIsActive(fp.getIsActive());
        dto.setValidFrom(fp.getValidFrom());
        dto.setValidTo(fp.getValidTo());
        dto.setImagePath(fp.getImagePath());
        dto.setCanvasWidth(fp.getCanvasWidth());
        dto.setCanvasHeight(fp.getCanvasHeight());

        List<RoomPosition> roomPositions = roomPositionRepository.findByFloorPlanId(fp.getId());
        List<WorkspacePosition> workspacePositions = workspacePositionRepository.findByFloorPlanId(fp.getId());

        List<RoomPositionDTO> roomDTOs = roomPositions.stream().map(rp -> {
            RoomPositionDTO rd = new RoomPositionDTO();
            rd.setId(rp.getId());
            rd.setRoomId(rp.getRoom().getId());
            rd.setMapX(rp.getMapX());
            rd.setMapY(rp.getMapY());
            rd.setMapWidth(rp.getMapWidth());
            rd.setMapHeight(rp.getMapHeight());
            return rd;
        }).toList();

        List<WorkspacePositionDTO> workspaceDTOs = workspacePositions.stream().map(wp -> {
            WorkspacePositionDTO wd = new WorkspacePositionDTO();
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

        LocalDate now = LocalDate.now();
        FloorPlan floorPlan = floorPlanRepository.findActiveFloorPlan(floor.getId(), now)
                .orElseGet(() -> {
                    FloorPlan fp = new FloorPlan();
                    fp.setFloor(floor);
                    fp.setValidFrom(now);
                    fp.setName("Layout " + now.getYear());
                    return fp;
                });

        String fileName = fileStorageService.storeFile(file, "floor_plan_" + floorId);
        floorPlan.setImagePath(fileName);
        floorPlanRepository.save(floorPlan);

        return fileName;
    }
}
