package com.workplanner.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterUserRequest {
    @NotBlank
    private String name;
    @NotBlank @Email
    private String email;
    private String password; // optional — not required when manager invites a user
    private String role;     // MANAGER or TEAM_MEMBER — defaults to TEAM_MEMBER if null
}
