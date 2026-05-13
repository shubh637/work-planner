package com.workplanner.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data @AllArgsConstructor @NoArgsConstructor @Builder
public class TaskProgressResponse {
    private Long id;
    private Long taskId;
    private String taskTitle;
    private Long changedById;
    private String changedByName;
    private String oldStatus;
    private String newStatus;
    private String notes;
    private LocalDateTime changedAt;
}
