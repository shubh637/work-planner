package com.workplanner.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data @AllArgsConstructor @NoArgsConstructor @Builder
public class ErrorResponse {
    private LocalDateTime timestamp;
    private int status;
    private String message;
}
