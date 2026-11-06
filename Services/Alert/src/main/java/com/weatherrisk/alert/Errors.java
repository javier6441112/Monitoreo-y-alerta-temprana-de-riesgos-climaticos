package com.weatherrisk.alert;
import java.util.Map;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
class Errors {
 @ExceptionHandler(ResponseStatusException.class)
 ResponseEntity<?> status(ResponseStatusException error,HttpServletRequest request){
  return problem(error.getStatusCode().value(),error.getReason()==null?"Request rejected":error.getReason(),request);
 }
 @ExceptionHandler({IllegalArgumentException.class,org.springframework.http.converter.HttpMessageNotReadableException.class})
 ResponseEntity<?> input(Exception error,HttpServletRequest request){return problem(400,"Invalid request",request);}
 @ExceptionHandler(DataIntegrityViolationException.class)
 ResponseEntity<?> conflict(Exception error,HttpServletRequest request){return problem(409,"Data conflict",request);}
 @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
 ResponseEntity<?> denied(Exception error,HttpServletRequest request){return problem(403,"Insufficient permissions",request);}
 private ResponseEntity<?> problem(int status,String title,HttpServletRequest request){
  return ResponseEntity.status(status).contentType(MediaType.APPLICATION_PROBLEM_JSON).body(Map.of("status",status,"title",title,"instance",request.getRequestURI()));
 }
}
