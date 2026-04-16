package com.prenotazioni.exprivia.exprv.service;

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

}
