package com.workplanner.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data @AllArgsConstructor @NoArgsConstructor @Builder
public class ProjectResponse {
    private Long id;
    private String name;
    private String description;
    private Long managerId;
    private String managerName;
    private String status;
    private LocalDateTime createdAt;
}
