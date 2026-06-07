package com.workplanner.service;

import com.workplanner.dto.request.CreateProjectRequest;
import com.workplanner.dto.response.ProjectResponse;
import com.workplanner.entity.Project;
import com.workplanner.entity.Project.ProjectStatus;
import com.workplanner.entity.User;
import com.workplanner.exception.ResourceNotFoundException;
import com.workplanner.repository.ProjectRepository;
import com.workplanner.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ProjectResponse> getAll() {
        return projectRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public ProjectResponse create(CreateProjectRequest req, Long managerId) {
        User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found: " + managerId));

        Project project = Project.builder()
                .name(req.getName())
                .description(req.getDescription())
                .manager(manager)
                .status(parseStatus(req.getStatus(), ProjectStatus.NOT_STARTED))
                .build();

        return toResponse(projectRepository.save(project));
    }

    @Transactional
    public ProjectResponse update(Long id, CreateProjectRequest req) {
        Project project = findOrThrow(id);
        project.setName(req.getName());
        if (req.getDescription() != null) project.setDescription(req.getDescription());
        if (req.getStatus() != null) project.setStatus(parseStatus(req.getStatus(), project.getStatus()));
        return toResponse(projectRepository.save(project));
    }

    @Transactional
    public ProjectResponse updateStatus(Long id, String rawStatus) {
        Project project = findOrThrow(id);
        ProjectStatus newStatus = parseStatusStrict(rawStatus);
        ProjectStatus current = project.getStatus();

        boolean valid = (current == ProjectStatus.NOT_STARTED && newStatus == ProjectStatus.IN_PROGRESS)
                     || (current == ProjectStatus.IN_PROGRESS && newStatus == ProjectStatus.DONE)
                     || (current == ProjectStatus.IN_PROGRESS && newStatus == ProjectStatus.NOT_STARTED)
                     || (current == ProjectStatus.DONE && newStatus == ProjectStatus.IN_PROGRESS);

        if (!valid) {
            throw new IllegalArgumentException(
                "Invalid status transition: " + current + " -> " + newStatus);
        }

        project.setStatus(newStatus);
        return toResponse(projectRepository.save(project));
    }

    @Transactional
    public void delete(Long id) {
        findOrThrow(id);
        projectRepository.deleteById(id);
    }

    private Project findOrThrow(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + id));
    }

    private ProjectStatus parseStatus(String raw, ProjectStatus fallback) {
        if (raw == null || raw.isBlank()) return fallback;
        try { return ProjectStatus.valueOf(raw.toUpperCase()); }
        catch (IllegalArgumentException e) { return fallback; }
    }

    private ProjectStatus parseStatusStrict(String raw) {
        if (raw == null || raw.isBlank())
            throw new IllegalArgumentException("Status value is required");
        try { return ProjectStatus.valueOf(raw.toUpperCase()); }
        catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid project status: " + raw);
        }
    }

    public ProjectResponse toResponse(Project p) {
        return ProjectResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .managerId(p.getManager().getId())
                .managerName(p.getManager().getName())
                .status(p.getStatus() != null ? p.getStatus().name() : ProjectStatus.NOT_STARTED.name())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
