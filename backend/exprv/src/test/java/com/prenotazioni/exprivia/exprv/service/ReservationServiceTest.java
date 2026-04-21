package com.prenotazioni.exprivia.exprv.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.prenotazioni.exprivia.exprv.dto.ReservationDTO;
import com.prenotazioni.exprivia.exprv.entity.Reservation;
import com.prenotazioni.exprivia.exprv.entity.ReservationDuration;
import com.prenotazioni.exprivia.exprv.entity.Room;
import com.prenotazioni.exprivia.exprv.entity.User;
import com.prenotazioni.exprivia.exprv.entity.Workspace;
import com.prenotazioni.exprivia.exprv.enumerati.ReservationStatus;
import com.prenotazioni.exprivia.exprv.mapper.ReservationMapper;
import com.prenotazioni.exprivia.exprv.repository.ReservationDurationRepository;
import com.prenotazioni.exprivia.exprv.repository.ReservationRepository;
import com.prenotazioni.exprivia.exprv.repository.UserRepository;
import com.prenotazioni.exprivia.exprv.repository.WorkspaceRepository;

@ExtendWith(MockitoExtension.class)
public class ReservationServiceTest {

    @Mock
    private ReservationRepository reservationRepository;
    @Mock
    private WorkspaceRepository workspaceRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ReservationDurationRepository durationRepository;
    @Mock
    private ReservationMapper reservationMapper;
    @Mock
    private EmailService emailService;

    @InjectMocks
    private ReservationService reservationService;

    private User user;
    private Workspace workspace;
    private Reservation reservation;
    private ReservationDTO reservationDTO;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1);
        user.setEmail("user@example.com");
        user.setName("Mario");
        user.setLastName("Rossi");

        Room room = new Room();
        room.setName("Sala A");

        workspace = new Workspace();
        workspace.setId(1);
        workspace.setName("Postazione 1");
        workspace.setRoom(room);

        reservation = new Reservation();
        reservation.setId(1);
        reservation.setUser(user);
        reservation.setWorkspace(workspace);
        reservation.setStartDate(LocalDateTime.now().plusHours(1));
        reservation.setEndDate(LocalDateTime.now().plusHours(2));
        reservation.setStatus(ReservationStatus.CONFIRMED);

        reservationDTO = new ReservationDTO();
        reservationDTO.setUserId(1);
        reservationDTO.setWorkspaceId(1);
        reservationDTO.setStartDate(reservation.getStartDate());
        reservationDTO.setEndDate(reservation.getEndDate());
        reservationDTO.setDurationName("Giorno");
    }

    @Test
    void testCreateReservation_DefaultStatus() {
        // Arrange
        when(userRepository.findById(1)).thenReturn(Optional.of(user));
        when(workspaceRepository.findById(1)).thenReturn(Optional.of(workspace));
        when(durationRepository.findByName(anyString())).thenReturn(Optional.of(new ReservationDuration()));
        when(reservationMapper.toEntity(any(ReservationDTO.class))).thenReturn(reservation);
        doReturn(reservation).when(reservationRepository).save(any(Reservation.class));
        when(reservationMapper.toDto(any(Reservation.class))).thenReturn(reservationDTO);

        // Act
        reservationService.createReservation(reservationDTO);

        // Assert
        assertEquals(ReservationStatus.CONFIRMED, reservation.getStatus(), "Lo stato deve essere CONFIRMED di default");
        verify(emailService, times(1)).sendBookingConfirmationEmail(anyString(), anyString(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void testExportReservationsToExcel_NotEmpty() {
        // Arrange
        List<Reservation> reservations = new ArrayList<>();
        reservations.add(reservation);
        when(reservationRepository.findByStartDateOnDay(any(LocalDate.class))).thenReturn(reservations);

        // Act
        byte[] result = reservationService.exportReservationsToExcel(LocalDate.now());

        // Assert
        assertNotNull(result);
        assertTrue(result.length > 0);
    }
}
