package com.prenotazioni.exprivia.exprv.service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.prenotazioni.exprivia.exprv.dto.ReservationDTO;
import com.prenotazioni.exprivia.exprv.entity.Reservation;
import com.prenotazioni.exprivia.exprv.entity.ReservationDuration;
import com.prenotazioni.exprivia.exprv.entity.User;
import com.prenotazioni.exprivia.exprv.entity.Workspace;
import com.prenotazioni.exprivia.exprv.enumerati.ReservationStatus;
import com.prenotazioni.exprivia.exprv.exceptions.AppException;
import com.prenotazioni.exprivia.exprv.mapper.ReservationMapper;
import com.prenotazioni.exprivia.exprv.repository.ReservationDurationRepository;
import com.prenotazioni.exprivia.exprv.repository.ReservationRepository;
import com.prenotazioni.exprivia.exprv.repository.UserRepository;
import com.prenotazioni.exprivia.exprv.repository.WorkspaceRepository;

@Service
public class ReservationService {
    private final ReservationRepository reservationRepository;
    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;
    private final ReservationDurationRepository durationRepository;
    private final ReservationMapper reservationMapper;
    private final EmailService emailService;

    public ReservationService(ReservationRepository reservationRepository, WorkspaceRepository workspaceRepository,
            UserRepository userRepository, ReservationDurationRepository durationRepository,
            ReservationMapper reservationMapper, EmailService emailService) {
        this.reservationRepository = reservationRepository;
        this.workspaceRepository = workspaceRepository;
        this.userRepository = userRepository;
        this.durationRepository = durationRepository;
        this.reservationMapper = reservationMapper;
        this.emailService = emailService;
    }

    private void verifyOwnershipOrAny(String targetEmail, String anyAuthority) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            throw new AccessDeniedException("Utente non autenticato");
        }

        boolean hasAny = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(anyAuthority));

        if (!hasAny && targetEmail != null && !targetEmail.equals(auth.getName())) {
            throw new AccessDeniedException("Non hai i permessi per agire su questa risorsa");
        }
    }

    public void validateReservationDTO(ReservationDTO reservationDTO, Integer excludeReservationId) {
        if (reservationDTO.getWorkspaceId() == null) {
            throw new AppException("Workspace is required", HttpStatus.BAD_REQUEST);
        }
        if (reservationDTO.getUserId() == null) {
            throw new AppException("User is required", HttpStatus.BAD_REQUEST);
        }
        if (reservationDTO.getStartDate() == null || reservationDTO.getEndDate() == null) {
            throw new AppException("Start and end dates are required", HttpStatus.BAD_REQUEST);
        }
        if (reservationDTO.getEndDate().isBefore(reservationDTO.getStartDate())) {
            throw new AppException("End date must be after start date", HttpStatus.BAD_REQUEST);
        }
        if (reservationDTO.getStartDate().isBefore(java.time.LocalDateTime.now())) {
            throw new AppException("Reservations in the past are not allowed", HttpStatus.BAD_REQUEST);
        }
        java.time.DayOfWeek day = reservationDTO.getStartDate().getDayOfWeek();
        if (day == java.time.DayOfWeek.SATURDAY || day == java.time.DayOfWeek.SUNDAY) {
            throw new AppException("Reservations are only allowed on business days", HttpStatus.BAD_REQUEST);
        }
        List<Reservation> overlapping = reservationRepository
                .findOverlappingBookings(
                        reservationDTO.getStartDate(),
                        reservationDTO.getEndDate(),
                        reservationDTO.getWorkspaceId(),
                        excludeReservationId);

        List<Reservation> overlappingByUser = reservationRepository
                .findOverlappingBookingsByUser(
                        reservationDTO.getStartDate(),
                        reservationDTO.getEndDate(),
                        reservationDTO.getUserId(),
                        excludeReservationId);

        if (!overlappingByUser.isEmpty()) {
            throw new AppException("User has already made a reservation at this time", HttpStatus.CONFLICT);
        }

        if (!overlapping.isEmpty()) {
            throw new AppException("The workspace is already occupied at this time", HttpStatus.CONFLICT);
        }
    }

    public List<ReservationDTO> findAllReservations() {
        return reservationMapper.toDtoList(reservationRepository.findAll());
    }

    public ReservationDTO findReservationById(Integer id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(
                        () -> new AppException("Reservation with ID " + id + " not found", HttpStatus.NOT_FOUND));

        verifyOwnershipOrAny(reservation.getUser().getEmail(), "ACTION_RESERVATION_READ_ANY");

        return reservationMapper.toDto(reservation);
    }

    public List<ReservationDTO> findReservationsByUserEmail(String email) {
        verifyOwnershipOrAny(email, "ACTION_RESERVATION_READ_ANY");
        return reservationMapper.toDtoList(reservationRepository.findByUserEmail(email));
    }

    public List<ReservationDTO> findReservationsByDay(LocalDate date) {
        return reservationMapper.toDtoList(reservationRepository.findByStartDateOnDay(date));
    }

    public List<ReservationDTO> findReservationsByDayAndWorkspace(LocalDate date, Integer workspaceId) {
        return reservationMapper.toDtoList(reservationRepository.findByStartDateOnDayAndWorkspace(date, workspaceId));
    }

    public ReservationDTO createReservation(ReservationDTO reservationDTO) {
        validateReservationDTO(reservationDTO, null);

        String loggedInUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();

        User loggedInUser = userRepository.findByEmail(loggedInUserEmail)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        User user = userRepository.findById(reservationDTO.getUserId())
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        verifyOwnershipOrAny(user.getEmail(), "ACTION_RESERVATION_CREATE_ANY");

        Workspace workspace = workspaceRepository.findById(reservationDTO.getWorkspaceId())
                .orElseThrow(() -> new AppException("Workspace not found", HttpStatus.NOT_FOUND));

        if (!Boolean.TRUE.equals(workspace.getEnabled())) {
            throw new AppException("This workspace is currently unavailable for bookings", HttpStatus.FORBIDDEN);
        }

        ReservationDuration duration = durationRepository.findByName(reservationDTO.getDurationName())
                .orElseThrow(() -> new AppException("Duration not found", HttpStatus.NOT_FOUND));

        Reservation reservation = reservationMapper.toEntity(reservationDTO);
        reservation.setUser(user);
        reservation.setWorkspace(workspace);
        reservation.setReservationDuration(duration);
        reservation.setStatus(ReservationStatus.CONFIRMED);
        reservation.setBookedBy(loggedInUser);

        Reservation savedReservation = reservationRepository.save(reservation);

        // Invio email di conferma
        sendStatusEmail(savedReservation, null);

        return reservationMapper.toDto(savedReservation);
    }

    public ReservationDTO updateReservation(Integer id, ReservationDTO reservationDTO) {
        Reservation existingReservation = reservationRepository.findById(id)
                .orElseThrow(
                        () -> new AppException("Reservation with ID " + id + " not found", HttpStatus.NOT_FOUND));

        reservationMapper.updateReservationFromDto(reservationDTO, existingReservation);

        verifyOwnershipOrAny(existingReservation.getUser().getEmail(), "ACTION_RESERVATION_UPDATE_ANY");

        if (reservationDTO.getUserId() != null) {
            User user = userRepository.findById(reservationDTO.getUserId())
                    .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));
            verifyOwnershipOrAny(user.getEmail(), "ACTION_RESERVATION_UPDATE_ANY");
            existingReservation.setUser(user);
        }
        if (reservationDTO.getWorkspaceId() != null) {
            Workspace workspace = workspaceRepository.findById(reservationDTO.getWorkspaceId())
                    .orElseThrow(() -> new AppException("Workspace not found", HttpStatus.NOT_FOUND));
            existingReservation.setWorkspace(workspace);
        }
        if (reservationDTO.getDurationName() != null) {
            ReservationDuration duration = durationRepository.findByName(reservationDTO.getDurationName())
                    .orElseThrow(() -> new AppException("Duration not found", HttpStatus.NOT_FOUND));
            existingReservation.setReservationDuration(duration);
        }

        validateReservationDTO(reservationDTO, id);

        ReservationStatus oldStatus = existingReservation.getStatus();
        Reservation savedReservation = reservationRepository.save(existingReservation);

        // Se lo stato è cambiato in DENIED, invia email
        if (oldStatus != ReservationStatus.DENIED && savedReservation.getStatus() == ReservationStatus.DENIED) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isAdminAction = !savedReservation.getUser().getEmail().equals(auth.getName());
            sendStatusEmail(savedReservation, isAdminAction); // Admin action
        }

        return reservationMapper.toDto(savedReservation);
    }

    public void deleteReservation(Integer id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new AppException("Reservation with ID " + id + " not found", HttpStatus.NOT_FOUND));

        verifyOwnershipOrAny(reservation.getUser().getEmail(), "ACTION_RESERVATION_DELETE_ANY");

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdminAction = !reservation.getUser().getEmail().equals(auth.getName());

        // Notifica cancellazione via email prima di eliminare
        sendStatusEmail(reservation, isAdminAction); // Considerata azione admin se fatta da questo service generico

        reservationRepository.deleteById(id);
    }

    public List<String> getAvailableTimes(Integer workspaceId, LocalDate data) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new AppException("Workspace not found", HttpStatus.NOT_FOUND));

        if (!Boolean.TRUE.equals(workspace.getEnabled())) {
            return List.of(); // Nessun orario disponibile se disabilitato
        }

        List<String> tuttiOrari = List.of(
                "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
                "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
                "17:00", "17:30", "18:00", "18:30");

        LocalDateTime inizioGiornata = data.atStartOfDay();
        LocalDateTime fineGiornata = data.atTime(23, 59, 59);
        List<Reservation> prenotazioniEsistenti = reservationRepository.findByWorkspaceAndDateRange(
                workspaceId, inizioGiornata, fineGiornata);

        return tuttiOrari.stream()
                .filter(orario -> !isOrarioPrenotato(orario, prenotazioniEsistenti, data))
                .toList();
    }

    private boolean isOrarioPrenotato(String orario, List<Reservation> prenotazioni, LocalDate data) {
        int hour = Integer.parseInt(orario.split(":")[0]);
        int minute = Integer.parseInt(orario.split(":")[1]);
        LocalDateTime dataOrario = data.atTime(hour, minute);
        return prenotazioni.stream()
                .anyMatch(r -> (dataOrario.isEqual(r.getStartDate()) || dataOrario.isAfter(r.getStartDate())) &&
                        dataOrario.isBefore(r.getEndDate()));
    }

    private void sendStatusEmail(Reservation reservation, Boolean isAdminAction) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String startStr = reservation.getStartDate().format(formatter);
        String endStr = reservation.getEndDate().format(formatter);
        String userName = reservation.getUser().getName() + " " + reservation.getUser().getLastName();
        String roomName = reservation.getWorkspace().getRoom().getName();
        String workspaceName = reservation.getWorkspace().getName();

        if (reservation.getStatus() == ReservationStatus.CONFIRMED && isAdminAction == null) {
            emailService.sendBookingConfirmationEmail(reservation.getUser().getEmail(), userName, roomName,
                    workspaceName, startStr, endStr);
        } else if (reservation.getStatus() == ReservationStatus.DENIED) {
            emailService.sendBookingCancelledByAdminEmail(reservation.getUser().getEmail(), userName, roomName,
                    workspaceName, startStr, endStr);
        } else if (isAdminAction != null && isAdminAction) {
            emailService.sendBookingDeletedByAdminEmail(reservation.getUser().getEmail(), userName, roomName,
                    workspaceName, startStr, endStr);
        }
    }

    public byte[] exportReservationsToExcel(LocalDate date) {
        List<Reservation> reservations = reservationRepository.findByStartDateOnDay(date);

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            XSSFSheet sheet = workbook.createSheet("Prenotazioni " + date.toString());

            // Header Style
            XSSFCellStyle headerStyle = workbook.createCellStyle();
            XSSFFont headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            Row headerRow = sheet.createRow(0);
            String[] columns = { "ID", "User", "City", "Location", "Room", "Workspace", "Start", "End", "Status" };
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            int rowIdx = 1;
            for (Reservation r : reservations) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(r.getId());
                row.createCell(1).setCellValue(r.getUser().getEmail());
                row.createCell(2).setCellValue(
                        r.getWorkspace().getRoom().getFloor().getBuilding().getLocation().getCity().toString());
                row.createCell(3)
                        .setCellValue(r.getWorkspace().getRoom().getFloor().getBuilding().getLocation().getName());
                row.createCell(4).setCellValue(r.getWorkspace().getRoom().getName());
                row.createCell(5).setCellValue(r.getWorkspace().getName());
                row.createCell(6).setCellValue(r.getStartDate().format(dtf));
                row.createCell(7).setCellValue(r.getEndDate().format(dtf));
                row.createCell(8).setCellValue(r.getStatus().toString());
            }

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new AppException("Error while generating Excel file: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}