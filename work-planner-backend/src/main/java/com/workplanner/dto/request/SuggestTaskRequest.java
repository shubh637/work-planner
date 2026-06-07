package com.workplanner.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class SuggestTaskRequest {
    @NotBlank
    @Size(max = 300)
    private String title;
    private String description;
    @NotNull
    private Long projectId;
    private LocalDate dueDate;
}
