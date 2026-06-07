package com.workplanner.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateTaskRequest {
    @Size(min = 1, max = 300, message = "title must be between 1 and 300 characters")
    private String title;
    private String description;
    private LocalDate dueDate;
    private String status;
    private String statusNotes;
}
