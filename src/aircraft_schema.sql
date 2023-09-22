drop table if exists aircraft;

create table if not exists aircraft (
  icao24 text,
  registration text, 
  manufacturericao text, 
  manufacturername text,
  model text, 
  typecode text, 
  serialnumber text, 
  linenumber text,
  icaoaircrafttype text, 
  operator text, 
  operatorcallsign text, 
  operatoricao text,
  operatoriata text, 
  owner text, 
  category text
);