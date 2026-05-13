package com.workplanner.dto.response;

import lombok.*;

@Data @AllArgsConstructor @NoArgsConstructor @Builder
public class AuthResponse {
    private String token;
    private String role;
    private Long userId;
    private String name;
    private String email;
}
