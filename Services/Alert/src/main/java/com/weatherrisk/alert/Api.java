package com.weatherrisk.alert;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class Api {
 private final JdbcTemplate db;private final ObjectMapper json;
 Api(JdbcTemplate db,ObjectMapper json){this.db=db;this.json=json;}
 static final String RULE_COLUMNS="id,nombre,tipo_sensor AS \"tipoSensor\",nivel,valor_minimo AS \"valorMinimo\",valor_maximo AS \"valorMaximo\",fenomeno,mensaje,activo";
 static final Set<String> LEVELS=Set.of("VERDE","AMARILLO","NARANJA","ROJO");
 static String text(Map<String,Object>b,String key){var v=b.get(key);if(!(v instanceof String s)||s.isBlank()||s.length()>500)throw bad("Invalid "+key);return ((String)v).trim();}
 static int id(Map<String,Object>b,String key){if(!(b.get(key) instanceof Number n)||n.intValue()<=0)throw bad("Invalid "+key);return ((Number)b.get(key)).intValue();}
 static BigDecimal decimal(Object v){return v==null?null:new BigDecimal(v.toString());}
 static ResponseStatusException bad(String text){return new ResponseStatusException(HttpStatus.BAD_REQUEST,text);}
 Map<String,Object> parse(Object payload){try{return json.readValue(payload.toString(),new TypeReference<LinkedHashMap<String,Object>>(){});}catch(Exception e){throw new IllegalStateException(e);}}
 String encode(Object body){try{return json.writeValueAsString(body);}catch(Exception e){throw bad("Invalid JSON");}}
 void audit(String actor,String action,Object entityId){
  try{
   var body=new LinkedHashMap<String,Object>();body.put("eventId",UUID.randomUUID().toString());body.put("usuarioId",actor);body.put("accion",action);body.put("entidad","alert");body.put("entidadId",entityId);body.put("descripcion",action);body.put("fechaHora",Instant.now().toString());
   var request=HttpRequest.newBuilder(URI.create(Security.env("AUDIT_URL")+"/internal/audit/events")).timeout(Duration.ofSeconds(5)).header("Content-Type","application/json").header("X-Service-Key",Security.env("SERVICE_KEY")).POST(HttpRequest.BodyPublishers.ofString(encode(body))).build();
   var response=HttpClient.newHttpClient().send(request,HttpResponse.BodyHandlers.discarding());
   if(response.statusCode()>=300)System.err.println("Audit delivery failed: "+action);
  }catch(Exception e){System.err.println("Audit unavailable: "+action);}
 }
 @GetMapping("/health") Map<String,Object> health(){return Map.of("status","ok","service","alert");}
 @GetMapping("/ready") Map<String,Object> ready(){db.queryForObject("SELECT 1",Integer.class);return Map.of("status","ok");}
 @GetMapping({"/api/configuracionalertas","/internal/rules"})
 List<Map<String,Object>> rules(@RequestParam(required=false)String tipoSensor,@RequestParam(required=false)Boolean activo){
  return db.queryForList("SELECT "+RULE_COLUMNS+" FROM rules WHERE (?::text IS NULL OR tipo_sensor=?) AND (?::boolean IS NULL OR activo=?) ORDER BY id",tipoSensor,tipoSensor,activo,activo);
 }
 @GetMapping("/api/configuracionalertas/{id}") Map<String,Object> rule(@PathVariable int id){
  return db.queryForList("SELECT "+RULE_COLUMNS+" FROM rules WHERE id=?",id).stream().findFirst().orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
 }
 void validateRule(Map<String,Object>b){
  text(b,"nombre");text(b,"tipoSensor");text(b,"fenomeno");text(b,"mensaje");
  if(!LEVELS.contains(text(b,"nivel").toUpperCase()))throw bad("Invalid level");
  var min=decimal(b.get("valorMinimo"));var max=decimal(b.get("valorMaximo"));
  if(min==null&&max==null||min!=null&&max!=null&&min.compareTo(max)>0)throw bad("Invalid thresholds");
 }
 Object[] values(Map<String,Object>b){return new Object[]{text(b,"nombre"),text(b,"tipoSensor").toUpperCase(),text(b,"nivel").toUpperCase(),decimal(b.get("valorMinimo")),decimal(b.get("valorMaximo")),text(b,"fenomeno").toUpperCase(),text(b,"mensaje"),b.getOrDefault("activo",true)};}
 @PostMapping("/api/configuracionalertas") @PreAuthorize("hasRole('ADMIN')") @ResponseStatus(HttpStatus.CREATED)
 Map<String,Object> createRule(@RequestBody Map<String,Object>b,@AuthenticationPrincipal Jwt user){
  validateRule(b);var result=db.queryForMap("INSERT INTO rules(nombre,tipo_sensor,nivel,valor_minimo,valor_maximo,fenomeno,mensaje,activo) VALUES(?,?,?,?,?,?,?,?) RETURNING "+RULE_COLUMNS,values(b));
  audit(user.getSubject(),"CREAR_REGLA",result.get("id"));return result;
 }
 @PutMapping("/api/configuracionalertas/{id}") @PreAuthorize("hasRole('ADMIN')")
 Map<String,Object> updateRule(@PathVariable int id,@RequestBody Map<String,Object>b,@AuthenticationPrincipal Jwt user){
  validateRule(b);var params=new ArrayList<>(Arrays.asList(values(b)));params.add(id);
  var rows=db.queryForList("UPDATE rules SET nombre=?,tipo_sensor=?,nivel=?,valor_minimo=?,valor_maximo=?,fenomeno=?,mensaje=?,activo=? WHERE id=? RETURNING "+RULE_COLUMNS,params.toArray());
  if(rows.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND);audit(user.getSubject(),"EDITAR_REGLA",id);return rows.getFirst();
 }
 @PatchMapping("/api/configuracionalertas/{id}/estado") @PreAuthorize("hasRole('ADMIN')")
 Map<String,Object> stateRule(@PathVariable int id,@RequestBody Map<String,Object>b){if(!(b.get("activo")instanceof Boolean))throw bad("activo required");if(db.update("UPDATE rules SET activo=? WHERE id=?",b.get("activo"),id)==0)throw new ResponseStatusException(HttpStatus.NOT_FOUND);return rule(id);}
 @DeleteMapping("/api/configuracionalertas/{id}") @PreAuthorize("hasRole('ADMIN')") @ResponseStatus(HttpStatus.NO_CONTENT)
 void deleteRule(@PathVariable int id){if(db.update("DELETE FROM rules WHERE id=?",id)==0)throw new ResponseStatusException(HttpStatus.NOT_FOUND);}

 @PostMapping("/internal/evaluate") @Transactional
 public Map<String,Object> evaluate(@RequestBody Map<String,Object>b){
  int reading=id(b,"readingId"),sensor=id(b,"sensorId"),community=id(b,"comunidadId");
  var inserted=db.queryForList("INSERT INTO evaluation_receipts(reading_id) VALUES(?) ON CONFLICT DO NOTHING RETURNING reading_id",reading);
  if(inserted.isEmpty()){
   var existing=db.queryForList("SELECT a.payload FROM evaluation_receipts r JOIN alerts a ON a.id=r.alert_id WHERE r.reading_id=?",reading);
   return existing.isEmpty()?Map.of():parse(existing.getFirst().get("payload"));
  }
  var value=decimal(b.get("valor"));if(value==null)throw bad("valor required");
  var matches=rules(text(b,"tipo"),true).stream().filter(r->matches(r,value)).sorted(Comparator.<Map<String,Object>,BigDecimal>comparing(r->Optional.ofNullable(decimal(r.get("valorMinimo"))).orElse(new BigDecimal("-999999999"))).reversed()).toList();
  if(matches.isEmpty())return Map.of();
  var rule=matches.getFirst();var alert=new LinkedHashMap<String,Object>();
  alert.put("sensorId",sensor);alert.put("comunidadId",community);alert.put("sensorNombre",text(b,"sensorNombre"));alert.put("comunidadNombre",b.getOrDefault("comunidadNombre",""));
  alert.put("configuracionAlertaId",rule.get("id"));alert.put("fenomeno",rule.get("fenomeno"));alert.put("nivel",rule.get("nivel"));alert.put("valorDetectado",value);
  alert.put("valorMinimo",rule.get("valorMinimo"));alert.put("valorMaximo",rule.get("valorMaximo"));alert.put("mensaje",rule.get("mensaje"));alert.put("fechaHora",text(b,"fechaHora"));alert.put("estado","ACTIVA");alert.put("activa",true);
  int alertId=db.queryForObject("INSERT INTO alerts(reading_id,sensor_id,comunidad_id,fecha_hora,payload) VALUES(?,?,?,?::timestamptz,?::jsonb) RETURNING id",Integer.class,reading,sensor,community,b.get("fechaHora"),encode(alert));
  alert.put("id",alertId);db.update("UPDATE alerts SET payload=?::jsonb WHERE id=?",encode(alert),alertId);
  db.update("UPDATE evaluation_receipts SET alert_id=? WHERE reading_id=?",alertId,reading);
  var event=new LinkedHashMap<>(alert);event.put("alertaId",alertId);event.put("valor",value);
  int eventId=db.queryForObject("INSERT INTO events(alert_id,sensor_id,comunidad_id,fecha_hora,payload) VALUES(?,?,?,?::timestamptz,?::jsonb) RETURNING id",Integer.class,alertId,sensor,community,b.get("fechaHora"),encode(event));
  event.put("id",eventId);db.update("UPDATE events SET payload=?::jsonb WHERE id=?",encode(event),eventId);
  audit("system","ALERTA_GENERADA",alertId);return alert;
 }
 public static boolean matches(Map<String,Object>r,BigDecimal value){
  var min=decimal(r.get("valorMinimo"));var max=decimal(r.get("valorMaximo"));
  return Boolean.TRUE.equals(r.get("activo"))&&(min==null||min.compareTo(value)<=0)&&(max==null||value.compareTo(max)<=0);
 }
 List<Map<String,Object>> list(String table,Map<String,String>q){
  String sql="SELECT payload FROM "+table+" WHERE true";var params=new ArrayList<Object>();
  for(var key:List.of("sensorId","comunidadId"))if(q.containsKey(key)){sql+=" AND "+(key.equals("sensorId")?"sensor_id":"comunidad_id")+"=?";params.add(Integer.parseInt(q.get(key)));}
  for(var key:List.of("desde","hasta"))if(q.containsKey(key)){sql+=" AND fecha_hora"+(key.equals("desde")?">=":"<=")+"?::timestamptz";params.add(q.get(key));}
  for(var key:List.of("fenomeno","nivel","estado"))if(q.containsKey(key)){sql+=" AND payload->>'"+key+"'=?";params.add(q.get(key));}
  if(q.containsKey("activas")&&table.equals("alerts")){sql+=" AND activa=?";params.add(Boolean.parseBoolean(q.get("activas")));}
  sql+=" ORDER BY fecha_hora DESC,id DESC";
  if(q.containsKey("page")){int page=Integer.parseInt(q.get("page")),size=Integer.parseInt(q.getOrDefault("pageSize","200"));if(page<1||size<1||size>200)throw bad("Invalid pagination");sql+=" LIMIT ? OFFSET ?";params.add(size);params.add((long)(page-1)*size);}
  return db.queryForList(sql,params.toArray()).stream().map(row->parse(row.get("payload"))).toList();
 }
 @GetMapping({"/api/alertas","/internal/alerts"}) List<Map<String,Object>> alerts(@RequestParam Map<String,String>q){return list("alerts",q);}
 @GetMapping("/api/alertas/activas") List<Map<String,Object>> active(){return list("alerts",Map.of("activas","true"));}
 @PatchMapping("/api/alertas/{id}/estado") @PreAuthorize("hasAnyRole('ADMIN','OPERADOR')") @Transactional
 public Map<String,Object> change(@PathVariable int id,@RequestBody Map<String,Object>b,@AuthenticationPrincipal Jwt user){
  var state=text(b,"estado").toUpperCase();if(!Set.of("ACTIVA","ATENDIDA","CERRADA").contains(state))throw bad("Invalid state");
  var rows=db.queryForList("SELECT payload FROM alerts WHERE id=? FOR UPDATE",id);if(rows.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND);
  var alert=parse(rows.getFirst().get("payload"));alert.put("estado",state);alert.put("activa",state.equals("ACTIVA"));
  if(!state.equals("ACTIVA")){String prefix=state.equals("ATENDIDA")?"atendida":"cerrada";alert.put(prefix+"PorId",Integer.parseInt(user.getSubject()));alert.put(prefix+"PorNombre",user.getClaimAsString("name"));alert.put(state.equals("ATENDIDA")?"fechaAtencion":"fechaCierre",Instant.now().toString());}
  db.update("UPDATE alerts SET estado=?,activa=?,payload=?::jsonb WHERE id=?",state,state.equals("ACTIVA"),encode(alert),id);
  db.update("UPDATE events SET payload=payload || ?::jsonb WHERE alert_id=?",encode(Map.of("estado",state)),id);
  audit(user.getSubject(),"ESTADO_ALERTA",id);return alert;
 }
 @PostMapping("/api/alertas/{id}/cerrar") @PreAuthorize("hasAnyRole('ADMIN','OPERADOR')") @Transactional
 public Map<String,Object> close(@PathVariable int id,@AuthenticationPrincipal Jwt user){var result=change(id,Map.of("estado","CERRADA"),user);return Map.of("id",id,"activa",false);}
 @GetMapping({"/api/historial","/internal/events"}) List<Map<String,Object>> events(@RequestParam Map<String,String>q){return list("events",q);}
 @GetMapping("/api/historial/estadisticas") Map<String,Object> stats(@RequestParam Map<String,String>q){
  var rows=list("events",q);var levels=new LinkedHashMap<String,Integer>();var phenomena=new LinkedHashMap<String,Integer>();
  for(var row:rows){levels.merge(String.valueOf(row.get("nivel")),1,Integer::sum);phenomena.merge(String.valueOf(row.get("fenomeno")),1,Integer::sum);}
  return Map.of("totalEventos",rows.size(),"porNivel",levels,"porFenomeno",phenomena);
 }
}
