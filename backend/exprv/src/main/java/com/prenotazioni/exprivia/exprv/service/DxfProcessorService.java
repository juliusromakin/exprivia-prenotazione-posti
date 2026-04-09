package com.prenotazioni.exprivia.exprv.service;

import com.prenotazioni.exprivia.exprv.dto.DxfResponseDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Slf4j
@Service
@RequiredArgsConstructor
public class DxfProcessorService {

    private final RestTemplate restTemplate;

    @Value("${dxf.processor.url:http://localhost:8080/process-dxf}")
    private String dxfProcessorUrl;

    public DxfResponseDTO processDxf(MultipartFile file) throws IOException {
        log.info("Invio file DXF '{}' ({} KB) all'API Python",
                file.getOriginalFilename(), file.getSize() / 1024);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename();
            }
        };
        body.add("file", resource);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<DxfResponseDTO> response = restTemplate.postForEntity(
                dxfProcessorUrl, request, DxfResponseDTO.class);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("API DXF Processor ha risposto con: " + response.getStatusCode());
        }

        log.info("Elaborazione completata — postazioni trovate: {}",
                response.getBody().getData().getWorkstation().size());

        return response.getBody();
    }
}