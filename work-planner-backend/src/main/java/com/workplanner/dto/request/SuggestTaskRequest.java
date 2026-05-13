package com.workplanner.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class SuggestTaskRequest {
    @NotBlank
    private String title;
    private String description;
    @NotNull
    private Long projectId;
    private LocalDate dueDate;
}
