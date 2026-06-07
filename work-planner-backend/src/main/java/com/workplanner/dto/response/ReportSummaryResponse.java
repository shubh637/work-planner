package com.workplanner.dto.response;

import lombok.*;

import java.util.Map;

@Data @AllArgsConstructor @NoArgsConstructor @Builder
public class ReportSummaryResponse {
    private String label;
    private Map<String, Long> counts;
    private Long total;
}
