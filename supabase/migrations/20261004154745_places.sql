-- The 80 Bucharest and Ilfov places (neighbourhoods and towns) from the prototype, the service area,
-- and the location helpers: fuzzing public pins and naming the nearest place.

create table public.places (
  id smallint primary key,
  name text not null unique,
  zone text not null, -- "Sector 1" … "Sector 6" or "Ilfov"
  loc extensions.geography(point, 4326) not null
);
create index places_loc_idx on public.places using gist (loc);

alter table public.places enable row level security;
grant select on public.places to authenticated;
create policy "places are readable by signed-in users" on public.places
  for select to authenticated using (true);

insert into public.places (id, name, zone, loc) values
  (1, 'Floreasca', 'Sector 1', extensions.st_setsrid(extensions.st_makepoint(26.1047, 44.4598), 4326)::extensions.geography),
  (2, 'Dorobanți', 'Sector 1', extensions.st_setsrid(extensions.st_makepoint(26.092, 44.456), 4326)::extensions.geography),
  (3, 'Primăverii', 'Sector 1', extensions.st_setsrid(extensions.st_makepoint(26.087, 44.465), 4326)::extensions.geography),
  (4, 'Aviatorilor', 'Sector 1', extensions.st_setsrid(extensions.st_makepoint(26.086, 44.461), 4326)::extensions.geography),
  (5, 'Herăstrău', 'Sector 1', extensions.st_setsrid(extensions.st_makepoint(26.08, 44.472), 4326)::extensions.geography),
  (6, 'Băneasa', 'Sector 1', extensions.st_setsrid(extensions.st_makepoint(26.078, 44.495), 4326)::extensions.geography),
  (7, 'Bucureștii Noi', 'Sector 1', extensions.st_setsrid(extensions.st_makepoint(26.045, 44.48), 4326)::extensions.geography),
  (8, 'Damaroaia', 'Sector 1', extensions.st_setsrid(extensions.st_makepoint(26.06, 44.49), 4326)::extensions.geography),
  (9, 'Domenii', 'Sector 1', extensions.st_setsrid(extensions.st_makepoint(26.065, 44.465), 4326)::extensions.geography),
  (10, 'Piața Victoriei', 'Sector 1', extensions.st_setsrid(extensions.st_makepoint(26.086, 44.452), 4326)::extensions.geography),
  (11, 'Piața Romană', 'Sector 1', extensions.st_setsrid(extensions.st_makepoint(26.0975, 44.446), 4326)::extensions.geography),
  (12, 'Grivița', 'Sector 1', extensions.st_setsrid(extensions.st_makepoint(26.065, 44.46), 4326)::extensions.geography),
  (13, 'Tei', 'Sector 2', extensions.st_setsrid(extensions.st_makepoint(26.127, 44.458), 4326)::extensions.geography),
  (14, 'Colentina', 'Sector 2', extensions.st_setsrid(extensions.st_makepoint(26.145, 44.456), 4326)::extensions.geography),
  (15, 'Obor', 'Sector 2', extensions.st_setsrid(extensions.st_makepoint(26.125, 44.45), 4326)::extensions.geography),
  (16, 'Ștefan cel Mare', 'Sector 2', extensions.st_setsrid(extensions.st_makepoint(26.11, 44.452), 4326)::extensions.geography),
  (17, 'Iancului', 'Sector 2', extensions.st_setsrid(extensions.st_makepoint(26.142, 44.44), 4326)::extensions.geography),
  (18, 'Pantelimon', 'Sector 2', extensions.st_setsrid(extensions.st_makepoint(26.17, 44.442), 4326)::extensions.geography),
  (19, 'Pipera', 'Sector 2', extensions.st_setsrid(extensions.st_makepoint(26.118, 44.5), 4326)::extensions.geography),
  (20, 'Moșilor', 'Sector 2', extensions.st_setsrid(extensions.st_makepoint(26.115, 44.442), 4326)::extensions.geography),
  (21, 'Centrul Vechi', 'Sector 3', extensions.st_setsrid(extensions.st_makepoint(26.101, 44.432), 4326)::extensions.geography),
  (22, 'Universitate', 'Sector 3', extensions.st_setsrid(extensions.st_makepoint(26.1015, 44.4355), 4326)::extensions.geography),
  (23, 'Unirii', 'Sector 3', extensions.st_setsrid(extensions.st_makepoint(26.1025, 44.4268), 4326)::extensions.geography),
  (24, 'Titan', 'Sector 3', extensions.st_setsrid(extensions.st_makepoint(26.175, 44.422), 4326)::extensions.geography),
  (25, 'Dristor', 'Sector 3', extensions.st_setsrid(extensions.st_makepoint(26.143, 44.418), 4326)::extensions.geography),
  (26, 'Vitan', 'Sector 3', extensions.st_setsrid(extensions.st_makepoint(26.135, 44.41), 4326)::extensions.geography),
  (27, 'Balta Albă', 'Sector 3', extensions.st_setsrid(extensions.st_makepoint(26.16, 44.415), 4326)::extensions.geography),
  (28, 'Văcărești', 'Sector 4', extensions.st_setsrid(extensions.st_makepoint(26.123, 44.402), 4326)::extensions.geography),
  (29, 'Tineretului', 'Sector 4', extensions.st_setsrid(extensions.st_makepoint(26.108, 44.408), 4326)::extensions.geography),
  (30, 'Berceni', 'Sector 4', extensions.st_setsrid(extensions.st_makepoint(26.12, 44.38), 4326)::extensions.geography),
  (31, 'Olteniței', 'Sector 4', extensions.st_setsrid(extensions.st_makepoint(26.12, 44.388), 4326)::extensions.geography),
  (32, 'Giurgiului', 'Sector 4', extensions.st_setsrid(extensions.st_makepoint(26.085, 44.39), 4326)::extensions.geography),
  (33, 'Rahova', 'Sector 5', extensions.st_setsrid(extensions.st_makepoint(26.055, 44.405), 4326)::extensions.geography),
  (34, 'Ferentari', 'Sector 5', extensions.st_setsrid(extensions.st_makepoint(26.07, 44.402), 4326)::extensions.geography),
  (35, 'Cotroceni', 'Sector 5', extensions.st_setsrid(extensions.st_makepoint(26.07, 44.432), 4326)::extensions.geography),
  (36, '13 Septembrie', 'Sector 5', extensions.st_setsrid(extensions.st_makepoint(26.07, 44.417), 4326)::extensions.geography),
  (37, 'Drumul Taberei', 'Sector 6', extensions.st_setsrid(extensions.st_makepoint(26.03, 44.421), 4326)::extensions.geography),
  (38, 'Militari', 'Sector 6', extensions.st_setsrid(extensions.st_makepoint(26.01, 44.435), 4326)::extensions.geography),
  (39, 'Crângași', 'Sector 6', extensions.st_setsrid(extensions.st_makepoint(26.04, 44.45), 4326)::extensions.geography),
  (40, 'Giulești', 'Sector 6', extensions.st_setsrid(extensions.st_makepoint(26.045, 44.456), 4326)::extensions.geography),
  (41, 'Lujerului', 'Sector 6', extensions.st_setsrid(extensions.st_makepoint(26.031, 44.434), 4326)::extensions.geography),
  (42, 'Otopeni', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(26.07, 44.55), 4326)::extensions.geography),
  (43, 'Voluntari', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(26.18, 44.49), 4326)::extensions.geography),
  (44, 'Pantelimon (oraș)', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(26.21, 44.453), 4326)::extensions.geography),
  (45, 'Popești-Leordeni', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(26.17, 44.38), 4326)::extensions.geography),
  (46, 'Bragadiru', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(25.98, 44.37), 4326)::extensions.geography),
  (47, 'Chiajna', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(25.975, 44.46), 4326)::extensions.geography),
  (48, 'Buftea', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(25.95, 44.565), 4326)::extensions.geography),
  (49, 'Măgurele', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(26.03, 44.35), 4326)::extensions.geography),
  (50, 'Chitila', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(25.98, 44.51), 4326)::extensions.geography),
  (51, 'Mogoșoaia', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(25.997, 44.53), 4326)::extensions.geography),
  (52, 'Snagov', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(26.17, 44.7), 4326)::extensions.geography),
  (53, 'Corbeanca', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(26.04, 44.6), 4326)::extensions.geography),
  (54, 'Tunari', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(26.14, 44.545), 4326)::extensions.geography),
  (55, 'Ștefăneștii de Jos', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(26.19, 44.59), 4326)::extensions.geography),
  (56, 'Afumați', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(26.25, 44.525), 4326)::extensions.geography),
  (57, 'Cernica', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(26.29, 44.42), 4326)::extensions.geography),
  (58, 'Glina', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(26.25, 44.385), 4326)::extensions.geography),
  (59, 'Jilava', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(26.077, 44.333), 4326)::extensions.geography),
  (60, 'Domnești', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(25.92, 44.4), 4326)::extensions.geography),
  (61, 'Cornetu', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(25.95, 44.35), 4326)::extensions.geography),
  (62, 'Berceni (Ilfov)', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(26.12, 44.315), 4326)::extensions.geography),
  (63, '1 Decembrie', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(26.06, 44.29), 4326)::extensions.geography),
  (64, 'Balotești', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(26.11, 44.61), 4326)::extensions.geography),
  (65, 'Ciolpani', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(26.08, 44.73), 4326)::extensions.geography),
  (66, 'Periș', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(26, 44.69), 4326)::extensions.geography),
  (67, 'Moara Vlăsiei', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(26.21, 44.64), 4326)::extensions.geography),
  (68, 'Brănești', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(26.33, 44.46), 4326)::extensions.geography),
  (69, 'Ciorogârla', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(25.88, 44.44), 4326)::extensions.geography),
  (70, 'Clinceni', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(25.95, 44.37), 4326)::extensions.geography),
  (71, 'Vidra', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(26.16, 44.27), 4326)::extensions.geography),
  (72, 'Dobroești', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(26.165, 44.465), 4326)::extensions.geography),
  (73, 'Dascălu', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(26.24, 44.6), 4326)::extensions.geography),
  (74, 'Gruiu', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(26.22, 44.73), 4326)::extensions.geography),
  (75, 'Nuci', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(26.3, 44.71), 4326)::extensions.geography),
  (76, 'Petrăchioaia', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(26.31, 44.58), 4326)::extensions.geography),
  (77, 'Găneasa', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(26.33, 44.42), 4326)::extensions.geography),
  (78, 'Dărăști', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(26, 44.31), 4326)::extensions.geography),
  (79, 'Copăceni', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(26.07, 44.25), 4326)::extensions.geography),
  (80, 'Dragomirești-Vale', 'Ilfov', extensions.st_setsrid(extensions.st_makepoint(25.92, 44.45), 4326)::extensions.geography);

-- Where Pocket works: Bucharest and Ilfov. A generous box around the county (the prototype's BOUNDS);
-- swap in the real county outline later without changing callers.
create function private.in_service_area(p_point extensions.geography)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select extensions.st_intersects(
    p_point::extensions.geometry,
    extensions.st_makeenvelope(25.65, 44.18, 26.55, 44.82, 4326)
  )
$$;

create function private.make_point(p_lat double precision, p_lng double precision)
returns extensions.geography
language sql
immutable
strict
set search_path = ''
as $$
  select extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography
$$;

-- Public pins are moved 70–140 m in a random direction, so the exact address stays private (SPEC §1).
create function private.fuzz(p_point extensions.geography)
returns extensions.geography
language sql
volatile
set search_path = ''
as $$
  select extensions.st_project(p_point, 70 + random() * 70, radians(random() * 360))::extensions.geography
$$;

create function private.nearest_place(p_point extensions.geography)
returns text
language sql
stable
set search_path = ''
as $$
  select p.name from public.places p order by p.loc operator(extensions.<->) p_point limit 1
$$;
