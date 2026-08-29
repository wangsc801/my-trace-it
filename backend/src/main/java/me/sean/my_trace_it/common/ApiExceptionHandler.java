package me.sean.my_trace_it.common;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(AuthenticationException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public Result handleAuthentication(AuthenticationException ex) {
        return new Result(false, "用户名或密码错误");
    }

    @ExceptionHandler(IllegalAccessException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public Result handleForbidden(IllegalAccessException ex) {
        return new Result(false, "无权访问该资源");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result handleBadRequest(IllegalArgumentException ex) {
        return new Result(false, ex.getMessage() == null ? "参数错误" : ex.getMessage());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Result handleConflict(DataIntegrityViolationException ex) {
        return new Result(false, "数据冲突，可能存在重复记录");
    }
}