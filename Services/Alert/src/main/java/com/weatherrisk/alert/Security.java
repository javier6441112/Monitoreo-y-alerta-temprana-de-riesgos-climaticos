package com.weatherrisk.alert;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.net.URI;
import java.net.http.*;
import java.util.*;
import javax.crypto.spec.SecretKeySpec;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.filter.OncePerRequestFilter;

@Configuration @EnableMethodSecurity
class Security {
 static String env(String name){String v=System.getenv(name);if(v==null||v.isBlank())throw new IllegalStateException("Missing "+name);return v;}
 @Bean SecurityFilterChain filterChain(HttpSecurity http,ObjectMapper mapper)throws Exception{
  byte[] key=env("JWT_KEY").getBytes(StandardCharsets.UTF_8);
  if(key.length<32||env("SERVICE_KEY").length()<32)throw new IllegalStateException("Keys require 32 bytes");
  var decoder=NimbusJwtDecoder.withSecretKey(new SecretKeySpec(key,"HmacSHA256")).macAlgorithm(MacAlgorithm.HS256).build();
  OAuth2TokenValidator<Jwt> audience=token->token.getAudience().contains(env("JWT_AUDIENCE"))&&token.getId()!=null&&token.getExpiresAt()!=null ? OAuth2TokenValidatorResult.success():OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token"));
  decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(new JwtTimestampValidator(Duration.ZERO),new JwtIssuerValidator(env("JWT_ISSUER")),audience));
  var converter=new JwtAuthenticationConverter();
  converter.setJwtGrantedAuthoritiesConverter(token->List.of(new SimpleGrantedAuthority("ROLE_"+token.getClaimAsString("role"))));
  var filter=new OncePerRequestFilter(){
   @Override protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain)throws ServletException,IOException{
    if(req.getRequestURI().startsWith("/internal/")){
     var supplied=String.valueOf(req.getHeader("X-Service-Key")).getBytes(StandardCharsets.UTF_8);
     if(!MessageDigest.isEqual(supplied,env("SERVICE_KEY").getBytes(StandardCharsets.UTF_8))){res.sendError(401);return;}
    } else if(req.getRequestURI().startsWith("/api/")){
     var authorization=req.getHeader("Authorization");
     if(authorization==null||!authorization.startsWith("Bearer ")){res.sendError(401);return;}
     try{
      var client=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build();
      var request=HttpRequest.newBuilder(URI.create(env("AUTH_URL")+"/internal/auth/introspect")).timeout(Duration.ofSeconds(8))
       .header("Content-Type","application/json").header("X-Service-Key",env("SERVICE_KEY"))
       .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(Map.of("token",authorization.substring(7))))).build();
      var response=client.send(request,HttpResponse.BodyHandlers.ofString());
      if(response.statusCode()!=200||!mapper.readTree(response.body()).path("active").asBoolean()){res.sendError(401);return;}
     }catch(Exception e){res.sendError(503);return;}
    }
    chain.doFilter(req,res);
   }
  };
  return http.csrf(c->c.disable()).sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
   .authorizeHttpRequests(a->a.requestMatchers("/health","/ready","/actuator/health/**","/internal/**").permitAll().anyRequest().authenticated())
   .oauth2ResourceServer(o->o.jwt(j->j.decoder(decoder).jwtAuthenticationConverter(converter)))
   .addFilterAfter(filter,BearerTokenAuthenticationFilter.class).build();
 }
}
