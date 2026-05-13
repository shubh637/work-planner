package com.workplanner.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AssignTaskRequest {
    @NotNull
    private Long assignedToUserId;
    private LocalDate dueDate;
}
