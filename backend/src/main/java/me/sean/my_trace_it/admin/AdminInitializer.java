package me.sean.my_trace_it.admin;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import me.sean.my_trace_it.domain.User;
import me.sean.my_trace_it.repo.UserRepository;
import me.sean.my_trace_it.security.RoleUtil;

/**
 * On startup, requiring the ADMIN_PASSWORD environment variable, ensures the
 * admin user exists and resets its password to that value. Admin credentials
 * are therefore deterministic per launch, as requested.
 */
@Component
public class AdminInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminInitializer.class);

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public AdminInitializer(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        String password = System.getenv("ADMIN_PASSWORD");
        if (password == null || password.isBlank()) {
            throw new IllegalStateException(
                "缺少环境变量 ADMIN_PASSWORD。请用如下方式启动，例如：ADMIN_PASSWORD=MySecret123 java -jar app.jar");
        }
        String username = System.getenv("ADMIN_USERNAME");
        if (username == null || username.isBlank()) {
            username = "admin";
        }

        User admin = users.findByUsername(username).orElse(null);
        if (admin == null) {
            admin = new User(username, passwordEncoder.encode(password), new ArrayList<>(List.of("ADMIN")));
        } else {
            admin.setPassword(passwordEncoder.encode(password));
            admin.setEnabled(true);
            RoleUtil.ensureAdminRole(admin);
        }
        users.save(admin);
        log.info("[my-trace-it] 管理员账号已就绪：{} (密码已被重置为 ADMIN_PASSWORD)", username);
    }
}