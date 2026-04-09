package com.prenotazioni.exprivia.exprv.service;

import com.prenotazioni.exprivia.exprv.dto.DxfResponseDTO;
import com.prenotazioni.exprivia.exprv.dto.FloorMapMetadataDTO;
import com.prenotazioni.exprivia.exprv.dto.FloorMapRequestDTO;
import com.prenotazioni.exprivia.exprv.entity.FloorMap;
import com.prenotazioni.exprivia.exprv.repository.FloorMapRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class FloorMapService {

    private final DxfProcessorService dxfProcessorService;
    private final FloorMapRepository mappaRepository;

    @Transactional
    public FloorMap elaboraESalva(MultipartFile file, FloorMapRequestDTO request) throws IOException {

        // 1. Chiama l'API Python
        DxfResponseDTO dxfResult = dxfProcessorService.processDxf(file);

        // 2. Costruisce l'entity FloorMap
        FloorMap mappa = new FloorMap();
        mappa.setName(request.getName());
        mappa.setDateStart(request.getDateStart());
        mappa.setDateEnd(request.getDateEnd());

        mappa.setImagePng(Base64.getDecoder().decode(dxfResult.getPngBase64()));
        mappa.setFileDxf(Base64.getDecoder().decode(dxfResult.getDxfBase64()));

        var config = dxfResult.getData().getConfig();
        mappa.setXmin(config.getXmin());
        mappa.setXmax(config.getXmax());
        mappa.setYmin(config.getYmin());
        mappa.setYmax(config.getYmax());

        // 3. Converte le postazioni in snapshot JSONB (senza disponibilità/accessibilità)
        List<FloorMap.WorkStationSnapshot> snapshots = dxfResult.getData().getWorkstation().stream()
                .map(p -> {
                    FloorMap.WorkStationSnapshot s = new FloorMap.WorkStationSnapshot();
                    s.setHandleDxf(p.getId());
                    s.setPdl(p.getPdl());
                    s.setStanza(p.getRoom());
                    s.setX(p.getX());
                    s.setY(p.getY());
                    return s;
                })
                .toList();

        mappa.setWorkstation(snapshots);

        // 4. Salva tutto in un'unica riga (PNG + DXF + postazioni JSONB)
        FloorMap salvata = mappaRepository.save(mappa);
        log.info("FloorMap '{}' salvata — id={}, postazioni={}",
                salvata.getName(), salvata.getId(), snapshots.size());

        return salvata;
    }

    public List<FloorMap> findAll() {
        return mappaRepository.findAll();
    }

    public Optional<FloorMap> findById(Long id) {
        return mappaRepository.findById(id);
    }

    public List<FloorMapMetadataDTO> findAllMetadata() {
        return mappaRepository.findAllMetadata();
    }
}