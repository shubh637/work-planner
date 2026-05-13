package com.workplanner.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateTaskRequest {
    @NotBlank
    private String title;
    private String description;
    @NotNull
    private Long projectId;
    private Long assignedToUserId;
    private LocalDate dueDate;
}
