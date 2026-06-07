package com.workplanner.dto.response;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @AllArgsConstructor @NoArgsConstructor @Builder
public class TaskResponse {
    private Long id;
    private String title;
    private String description;
    private Long projectId;
    private String projectName;
    private Long assignedToId;
    private String assignedToName;
    private Long createdById;
    private String createdByName;
    private Long suggestedById;
    private String suggestedByName;
    private String status;
    private LocalDate dueDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
