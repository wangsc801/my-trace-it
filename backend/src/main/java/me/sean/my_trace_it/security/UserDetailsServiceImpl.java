package me.sean.my_trace_it.security;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import me.sean.my_trace_it.repo.UserRepository;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository users;

    public UserDetailsServiceImpl(UserRepository users) {
        this.users = users;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        me.sean.my_trace_it.domain.User entity = users.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("用户不存在：" + username));
        var authorities = entity.getRoles().stream()
            .map(RoleUtil::authority)
            .map(SimpleGrantedAuthority::new)
            .toList();
        return User.withUsername(entity.getUsername())
            .password(entity.getPassword())
            .authorities(authorities)
            .disabled(!entity.isEnabled())
            .build();
    }
}