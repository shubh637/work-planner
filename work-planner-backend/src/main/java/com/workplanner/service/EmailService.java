package com.workplanner.service;

import com.workplanner.entity.Task;
import com.workplanner.entity.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    @Async
    public void sendTaskAssignmentEmail(Task task, User assignee) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(assignee.getEmail());
            helper.setSubject("Work Planner — Task Assigned: " + task.getTitle());

            String body = """
                    <html><body style="font-family:Arial,sans-serif;">
                    <h2 style="color:#2563eb;">Task Assigned to You</h2>
                    <p>Hi <strong>%s</strong>,</p>
                    <p>A new task has been assigned to you in <strong>Work Planner</strong>:</p>
                    <table style="border-collapse:collapse;width:100%%;max-width:500px;">
                      <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><b>Title</b></td>
                          <td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                      <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><b>Project</b></td>
                          <td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                      <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><b>Due Date</b></td>
                          <td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                      <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><b>Description</b></td>
                          <td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                    </table>
                    <p>Please log in to Work Planner to view and update your progress.</p>
                    </body></html>
                    """.formatted(
                    assignee.getName(),
                    task.getTitle(),
                    task.getProject().getName(),
                    task.getDueDate() != null ? task.getDueDate().toString() : "Not set",
                    task.getDescription() != null ? task.getDescription() : "-"
            );

            helper.setText(body, true);
            mailSender.send(message);
            log.info("Task assignment email sent to {} for task id={}", assignee.getEmail(), task.getId());
        } catch (MessagingException e) {
            log.error("Failed to send assignment email to {}: {}", assignee.getEmail(), e.getMessage());
        }
    }

    @Async
    public void sendTaskApprovalEmail(Task task, User recipient) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(recipient.getEmail());
            helper.setSubject("Work Planner — Task Approved: " + task.getTitle());

            String body = """
                    <html><body style="font-family:Arial,sans-serif;">
                    <h2 style="color:#16a34a;">Your Task Suggestion Was Approved!</h2>
                    <p>Hi <strong>%s</strong>,</p>
                    <p>Your suggested task <strong>"%s"</strong> has been approved by the manager.</p>
                    <p><b>Due date:</b> %s</p>
                    <p>You can now start working on it. Log in to Work Planner for details.</p>
                    </body></html>
                    """.formatted(
                    recipient.getName(),
                    task.getTitle(),
                    task.getDueDate() != null ? task.getDueDate().toString() : "Not set"
            );

            helper.setText(body, true);
            mailSender.send(message);
            log.info("Approval email sent to {} for task id={}", recipient.getEmail(), task.getId());
        } catch (MessagingException e) {
            log.error("Failed to send approval email: {}", e.getMessage());
        }
    }
}
