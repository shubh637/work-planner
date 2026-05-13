package com.workplanner.dto.request;

import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateTaskRequest {
    private String title;
    private String description;
    private LocalDate dueDate;
    private String status;
    private String statusNotes;
}
