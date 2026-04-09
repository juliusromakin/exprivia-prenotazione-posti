package com.prenotazioni.exprivia.exprv.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class DxfResponseDTO {

    @JsonProperty("png_base64")
    private String pngBase64;

    @JsonProperty("dxf_base64")
    private String dxfBase64;

    private DxfDataDto data;

    @Data
    public static class DxfDataDto {
        private DxfConfigDto config;
        private List<WorkstationDto> workstation;
    }

    @Data
    public static class DxfConfigDto {
        private String image;
        private double xmin;
        private double xmax;
        private double ymin;
        private double ymax;
    }

    @Data
    public static class WorkstationDto {
        private String id;
        private String pdl;
        private String room;
        private double x;
        private double y;
    }
}