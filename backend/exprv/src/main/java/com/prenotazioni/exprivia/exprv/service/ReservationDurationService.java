package com.prenotazioni.exprivia.exprv.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.prenotazioni.exprivia.exprv.dto.ReservationDurationDTO;
import com.prenotazioni.exprivia.exprv.entity.ReservationDuration;
import com.prenotazioni.exprivia.exprv.exceptions.AppException;
import com.prenotazioni.exprivia.exprv.mapper.ReservationDurationMapper;
import com.prenotazioni.exprivia.exprv.repository.ReservationDurationRepository;

@Service
public class ReservationDurationService {

    private final ReservationDurationRepository reservationDurationRepository;
    private final ReservationDurationMapper reservationDurationMapper;

    public ReservationDurationService(ReservationDurationRepository reservationDurationRepository,
            ReservationDurationMapper reservationDurationMapper) {
        this.reservationDurationRepository = reservationDurationRepository;
        this.reservationDurationMapper = reservationDurationMapper;
    }

    public List<ReservationDurationDTO> findAllDurations() {
        return reservationDurationMapper.toDtoList(reservationDurationRepository.findAll());
    }

    public ReservationDurationDTO findDurationByName(String name) {
        return reservationDurationMapper.toDto(reservationDurationRepository.findByName(name)
                .orElseThrow(() -> new AppException("Durata '" + name + "' non trovata", HttpStatus.NOT_FOUND)));
    }

    public ReservationDurationDTO createDuration(ReservationDurationDTO durationDTO) {
        // Verifica che non esista già una durata con lo stesso nome (è la chiave primaria)
        if (reservationDurationRepository.existsByName(durationDTO.getName())) {
            throw new AppException("Esiste già una durata con il nome '" + durationDTO.getName() + "'",
                    HttpStatus.CONFLICT);
        }

        ReservationDuration saved = reservationDurationRepository
                .save(reservationDurationMapper.toEntity(durationDTO));
        return reservationDurationMapper.toDto(saved);
    }

    public ReservationDurationDTO updateDuration(String name, ReservationDurationDTO durationDTO) {
        ReservationDuration existingDuration = reservationDurationRepository.findByName(name)
                .orElseThrow(() -> new AppException("Durata '" + name + "' non trovata", HttpStatus.NOT_FOUND));

        reservationDurationMapper.updateReservationDurationFromDto(durationDTO, existingDuration);
        reservationDurationRepository.save(existingDuration);
        return reservationDurationMapper.toDto(existingDuration);
    }

    public void softDeleteDuration(String name) {
        ReservationDuration existingDuration = reservationDurationRepository.findByName(name)
                .orElseThrow(() -> new AppException("Durata '" + name + "' non trovata", HttpStatus.NOT_FOUND));
        existingDuration.setIs_active(false);
        reservationDurationRepository.save(existingDuration);
    }

    public void hardDeleteDuration(String name) {
        if (!reservationDurationRepository.existsByName(name)) {
            throw new AppException("Durata '" + name + "' non trovata", HttpStatus.NOT_FOUND);
        }
        reservationDurationRepository.deleteById(name);
    }

}
