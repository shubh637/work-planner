package com.workplanner.repository;

import com.workplanner.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByRoleAndActiveTrue(User.Role role);
    List<User> findByActiveTrue();
    boolean existsByEmail(String email);
}
