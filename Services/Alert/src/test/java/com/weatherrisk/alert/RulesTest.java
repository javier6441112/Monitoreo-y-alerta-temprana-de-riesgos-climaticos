package com.weatherrisk.alert;
import java.math.BigDecimal;
import java.util.Map;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
class RulesTest {
 @Test void inclusiveThresholdsAndDisabledRules(){
  var rule=Map.<String,Object>of("activo",true,"valorMinimo",new BigDecimal("40"),"valorMaximo",new BigDecimal("60"));
  assertTrue(Api.matches(rule,new BigDecimal("40")));assertTrue(Api.matches(rule,new BigDecimal("60")));
  assertFalse(Api.matches(rule,new BigDecimal("39")));assertFalse(Api.matches(rule,new BigDecimal("61")));
  assertFalse(Api.matches(Map.of("activo",false),new BigDecimal("50")));
 }
}
