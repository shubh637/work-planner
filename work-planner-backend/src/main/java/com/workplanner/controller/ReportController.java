package com.workplanner.controller;

import com.workplanner.dto.response.ReportSummaryResponse;
import com.workplanner.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER')")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/tasks-by-status")
    public ResponseEntity<List<ReportSummaryResponse>> tasksByStatus(
            @RequestParam(required = false) Long projectId) {
        return ResponseEntity.ok(reportService.tasksByStatus(projectId));
    }

    @GetMapping("/tasks-by-project")
    public ResponseEntity<List<ReportSummaryResponse>> tasksByProject() {
        return ResponseEntity.ok(reportService.tasksByProject());
    }

    @GetMapping("/tasks-by-member")
    public ResponseEntity<List<ReportSummaryResponse>> tasksByMember() {
        return ResponseEntity.ok(reportService.tasksByMember());
    }
}
