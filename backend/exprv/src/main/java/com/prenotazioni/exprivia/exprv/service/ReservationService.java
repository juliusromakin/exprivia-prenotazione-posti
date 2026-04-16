package com.prenotazioni.exprivia.exprv.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.prenotazioni.exprivia.exprv.dto.ReservationDTO;
import com.prenotazioni.exprivia.exprv.entity.Reservation;
import com.prenotazioni.exprivia.exprv.entity.ReservationDuration;
import com.prenotazioni.exprivia.exprv.entity.User;
import com.prenotazioni.exprivia.exprv.entity.Workspace;
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

    public ReservationService(ReservationRepository reservationRepository, WorkspaceRepository workspaceRepository,
            UserRepository userRepository, ReservationDurationRepository durationRepository,
            ReservationMapper reservationMapper) {
        this.reservationRepository = reservationRepository;
        this.workspaceRepository = workspaceRepository;
        this.userRepository = userRepository;
        this.durationRepository = durationRepository;
        this.reservationMapper = reservationMapper;
    }

    public void validateReservationDTO(ReservationDTO reservationDTO) {
        if (reservationDTO.getWorkspaceId() == null) {
            throw new AppException("Il Workspace è obbligatorio", HttpStatus.BAD_REQUEST);
        }
        if (reservationDTO.getUserId() == null) {
            throw new AppException("L'utente è obbligatorio", HttpStatus.BAD_REQUEST);
        }
        if (reservationDTO.getStartDate() == null || reservationDTO.getEndDate() == null) {
            throw new AppException("Le date di inizio e fine sono obbligatorie", HttpStatus.BAD_REQUEST);
        }
        if (reservationDTO.getEndDate().isBefore(reservationDTO.getStartDate())) {
            throw new AppException("La data di fine deve essere successiva a quella di inizio", HttpStatus.BAD_REQUEST);
        }
        if (reservationDTO.getStartDate().isBefore(java.time.LocalDateTime.now())) {
            throw new AppException("Non puoi effettuare una prenotazione nel passato", HttpStatus.BAD_REQUEST);
        }
        java.time.DayOfWeek day = reservationDTO.getStartDate().getDayOfWeek();
        if (day == java.time.DayOfWeek.SATURDAY || day == java.time.DayOfWeek.SUNDAY) {
            throw new AppException("Le prenotazioni sono permesse solo nei giorni lavorativi", HttpStatus.BAD_REQUEST);
        }
        List<Reservation> overlapping = reservationRepository
                .findOverlappingBookings(
                        reservationDTO.getStartDate(),
                        reservationDTO.getEndDate(),
                        reservationDTO.getWorkspaceId());

        if (!overlapping.isEmpty()) {
            throw new AppException("Il workspace è già occupato in questo orario", HttpStatus.CONFLICT);
        }
    }

    public List<ReservationDTO> findAllReservations() {
        return reservationMapper.toDtoList(reservationRepository.findAll());
    }

    public ReservationDTO findReservationById(Integer id) {
        return reservationMapper.toDto(reservationRepository.findById(id)
                .orElseThrow(
                        () -> new AppException("Prenotazione con ID " + id + " non trovata", HttpStatus.NOT_FOUND)));
    }

    public List<ReservationDTO> findReservationsByUserEmail(String email) {
        return reservationMapper.toDtoList(reservationRepository.findByUserEmail(email));
    }

    public List<ReservationDTO> findReservationsByDay(LocalDate date) {
        return reservationMapper.toDtoList(reservationRepository.findByStartDateOnDay(date));
    }

    public List<ReservationDTO> findReservationsByDayAndWorkspace(LocalDate date, Integer workspaceId) {
        return reservationMapper.toDtoList(reservationRepository.findByStartDateOnDayAndWorkspace(date, workspaceId));
    }

    public ReservationDTO createReservation(ReservationDTO reservationDTO) {
        validateReservationDTO(reservationDTO);

        User user = userRepository.findById(reservationDTO.getUserId())
                .orElseThrow(() -> new AppException("Utente non trovato", HttpStatus.NOT_FOUND));

        Workspace workspace = workspaceRepository.findById(reservationDTO.getWorkspaceId())
                .orElseThrow(() -> new AppException("Postazione non trovata", HttpStatus.NOT_FOUND));

        ReservationDuration duration = durationRepository.findByName(reservationDTO.getDurationName())
                .orElseThrow(() -> new AppException("Durata non trovata", HttpStatus.NOT_FOUND));

        Reservation reservation = reservationMapper.toEntity(reservationDTO);
        reservation.setUser(user);
        reservation.setWorkspace(workspace);
        reservation.setReservationDuration(duration);

        return reservationMapper.toDto(reservationRepository.save(reservation));
    }

    public ReservationDTO updateReservation(Integer id, ReservationDTO reservationDTO) {
        Reservation existingReservation = reservationRepository.findById(id)
                .orElseThrow(
                        () -> new AppException("Prenotazione con ID " + id + " non trovata", HttpStatus.NOT_FOUND));

        reservationMapper.updateReservationFromDto(reservationDTO, existingReservation);

        if (reservationDTO.getUserId() != null) {
            User user = userRepository.findById(reservationDTO.getUserId())
                    .orElseThrow(() -> new AppException("Utente non trovato", HttpStatus.NOT_FOUND));
            existingReservation.setUser(user);
        }
        if (reservationDTO.getWorkspaceId() != null) {
            Workspace workspace = workspaceRepository.findById(reservationDTO.getWorkspaceId())
                    .orElseThrow(() -> new AppException("Postazione non trovata", HttpStatus.NOT_FOUND));
            existingReservation.setWorkspace(workspace);
        }
        if (reservationDTO.getDurationName() != null) {
            ReservationDuration duration = durationRepository.findByName(reservationDTO.getDurationName())
                    .orElseThrow(() -> new AppException("Durata non trovata", HttpStatus.NOT_FOUND));
            existingReservation.setReservationDuration(duration);
        }

        validateReservationDTO(reservationDTO);

        return reservationMapper.toDto(reservationRepository.save(existingReservation));
    }

    public void deleteReservation(Integer id) {
        if (!reservationRepository.existsById(id)) {
            throw new AppException("Prenotazione con ID " + id + " non trovata", HttpStatus.NOT_FOUND);
        }
        reservationRepository.deleteById(id);
    }

    public List<String> getAvailableTimes(Integer workspaceId, LocalDate data) {
        List<String> tuttiOrari = List.of(
                "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
                "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
                "17:00", "17:30");

        LocalDateTime inizioGiornata = data.atTime(9, 0);
        LocalDateTime fineGiornata = data.atTime(18, 0);
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

}