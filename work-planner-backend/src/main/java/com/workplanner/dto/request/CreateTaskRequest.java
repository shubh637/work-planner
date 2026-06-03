package com.workplanner.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateTaskRequest {
    @NotBlank
    @Size(max = 300)
    private String title;
    private String description;
    @NotNull
    private Long projectId;
    private Long assignedToUserId;
    private LocalDate dueDate;
}
