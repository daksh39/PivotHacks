-- ---------------------------------------------------------------------------
-- Verte — category knowledge base.  verte-plan.md §07.  Owned by lane/snowflake.
--
-- GENERATED FROM proxy/snowflake.ts. Do not hand-edit: run
--     npx tsx proxy/snowflake.gen.ts
-- after changing SEED, and snowflake.test.ts will confirm the two agree.
--
-- CARBON: a category carries a figure ONLY when CO2_SOURCE names a real
-- reference. Everything else is 0 / '' and isSourced() in src/carbon.ts
-- suppresses the claim rather than printing a number nobody can defend (§09).
--
-- CATEGORY values match the slugs in proxy/categories.ts exactly.
-- Re-running is safe: CATEGORY_GUIDANCE is replaced wholesale, IMPACT_LOG is
-- left alone so its history survives.
-- ---------------------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS VERTE;
USE DATABASE VERTE;
USE SCHEMA PUBLIC;

-- Pure reference data, no user rows: replacing it outright is what makes this
-- file idempotent. Snowflake does not enforce PRIMARY KEY, so a plain INSERT
-- on a re-run would silently duplicate every category.
CREATE OR REPLACE TABLE CATEGORY_GUIDANCE (
  CATEGORY         VARCHAR      NOT NULL PRIMARY KEY,
  VERDICT          VARCHAR      NOT NULL,   -- 'safe' | 'check' | 'avoid'
  CHECK_TIPS       ARRAY,
  EMBODIED_CO2_KG  NUMBER(10,1) NOT NULL,   -- 0 when uncited
  CO2_SOURCE       VARCHAR      NOT NULL,   -- '' when uncited
  NOTE             VARCHAR      NOT NULL,
  -- Needs a car to collect. Drives the no-car demotion in proxy/rank.ts.
  BULKY            BOOLEAN      NOT NULL,
  -- Lifetime emissions dominated by RUNNING it, not making it. Where this is
  -- true a cheap old unit can be a carbon loss, and the card says so.
  USE_DOMINANT     BOOLEAN      NOT NULL
);

-- Accumulates across runs — never replaced.
CREATE TABLE IF NOT EXISTS IMPACT_LOG (
  ID        VARCHAR DEFAULT UUID_STRING(),
  CATEGORY  VARCHAR,
  CO2_KG    NUMBER(10,1),
  SEEN_AT   TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- --- §07 starter set -------------------------------------------------------
-- 39 categories, matching proxy/categories.ts one for one.

INSERT INTO CATEGORY_GUIDANCE
  (CATEGORY, VERDICT, CHECK_TIPS, EMBODIED_CO2_KG, CO2_SOURCE, NOTE, BULKY, USE_DOMINANT)
SELECT column1, column2, PARSE_JSON(column3), column4, column5, column6, column7, column8
FROM VALUES


-- SAFE --------------------------------------------------------
('toaster','safe','["Shake out the crumb tray and check the element glows evenly."]',
  0,'','Almost nothing to go wrong.',FALSE,FALSE),
('lamp','safe','["Check the switch and that the cord is not frayed.","Bulbs are cheap — a dead bulb is not a dead lamp."]',
  0,'','Nothing meaningful degrades. Ideal used.',FALSE,FALSE),
('backpack','safe','["Run every zip.","Check the base and strap seams, which fail first."]',
  0,'','Excellent used. Straps and zips tell you everything.',FALSE,FALSE),
('drying-rack','safe','["Confirm the hinges lock open."]',
  0,'','Nothing to go wrong. Always worth checking used first.',FALSE,FALSE),
('storage-bin','safe','["Check for cracks along the base."]',
  0,'','No meaningful risk. Never buy these new.',FALSE,FALSE),
('bookshelf','safe','["Check the shelves are not sagging.","Confirm the wall anchor hardware is included."]',
  0,'','Very little that can go wrong.',TRUE,FALSE),
('dresser','safe','["Open every drawer.","Check the back panel is still attached."]',
  0,'','Heavy, so favour local pickup over shipping.',TRUE,FALSE),
('microwave','safe','["Check the door latch closes firmly.","The interior should not be scorched or rusted."]',
  0,'','A damaged door seal is the one real safety concern.',FALSE,FALSE),
-- SOURCED: Wells et al. 2012, Journal of Industrial Ecology — 2.71 kg CO2e per paperback, cradle-to-gate
('textbook','safe','["Confirm the edition matches the syllabus.","Ask whether an access code is required and still unused."]',
  3,'Wells et al. 2012, Journal of Industrial Ecology — 2.71 kg CO2e per paperback, cradle-to-gate','A previous edition is often fine, and usually a fraction of the price.',FALSE,FALSE),
('cookware','safe','["Surface rust on cast iron is cosmetic and scrubs off.","Check stainless pans sit flat on a counter."]',
  0,'','Cast iron and stainless are effectively indestructible.',FALSE,FALSE),
-- SOURCED: Trek Bicycle 2021 Sustainability Report — Marlin hardtail, 116 kg CO2e per bike manufactured
('bike','safe','["Inspect the frame for cracks near the welds.","Spin both wheels and check they run true.","Chain, brakes and tyres are cheap to replace."]',
  116,'Trek Bicycle 2021 Sustainability Report — Marlin hardtail, 116 kg CO2e per bike manufactured','Frame condition is the only thing that really matters.',FALSE,FALSE),
('fan','safe','["Run it on every speed setting.","Check the cage is not bent into the blades."]',
  0,'','No meaningful risk.',FALSE,FALSE),
('mini-fridge','safe','["Check the door seal for cracks or gaps.","Confirm it cools within an hour of plugging in."]',
  0,'','Compressor appliances last well, but the electricity is the real cost here — a cheap old one is not automatically the greener choice.',TRUE,TRUE),
-- SOURCED: Dell S2421HS Monitor PCF datasheet — 476 kg CO2e total, 67.7% manufacturing
('monitor','safe','["Show a white image and look for dead pixels.","Check the corners for backlight bleed in a dark room.","Confirm which cables are included."]',
  322,'Dell S2421HS Monitor PCF datasheet — 476 kg CO2e total, 67.7% manufacturing','Most of a display''s footprint is in the making of it, so a used one avoids nearly all of it.',FALSE,FALSE),
('desk','safe','["Check the drawer runners slide cleanly.","Make sure it isn''t particleboard that has been wet."]',
  0,'','Ideal used. Solid wood outlives several owners.',TRUE,FALSE),

-- CHECK -------------------------------------------------------
-- SOURCED: Published smartphone LCAs — ~55 kg CO2e manufacturing, 85-95% of lifetime footprint
('phone','check','["Ask for the battery health percentage.","Confirm it is not carrier-locked or activation-locked.","Check the IMEI is not blacklisted before paying."]',
  55,'Published smartphone LCAs — ~55 kg CO2e manufacturing, 85-95% of lifetime footprint','Manufacturing is almost the entire footprint of a phone, so a used one avoids nearly all of it.',FALSE,FALSE),
('pressure-cooker','check','["Check the lid gasket — it perishes and is the usual failure.","Confirm the pressure-release valve moves freely."]',
  0,'','The pot outlives several gaskets, and gaskets are cheap.',FALSE,FALSE),
('air-fryer','check','["Check the basket coating is not flaking.","Run it once to check the fan and thermostat."]',
  0,'','A flaking basket is the one thing worth walking away from.',FALSE,FALSE),
('rice-cooker','check','["Check the inner pot coating for scratches.","Confirm the keep-warm setting still works."]',
  0,'','Inner pots can usually be replaced separately.',FALSE,FALSE),
('vacuum','check','["Budget for a new filter.","Check the brush bar spins and the hose is not split."]',
  0,'','Filters and belts are consumables, not faults.',FALSE,FALSE),
('humidifier','check','["Check for limescale and mould in the tank.","Confirm the tank seal does not leak."]',
  0,'','Hygiene is the thing to inspect, not the motor.',FALSE,FALSE),
('mouse','check','["Click every button, including the scroll wheel.","Worn feet are cheap to replace; a failing switch is not."]',
  0,'','Switches wear before anything else does.',FALSE,FALSE),
('keyboard','check','["Test every key.","Ask whether it has been cleaned — they collect a lot."]',
  0,'','Mechanical keyboards in particular outlast several owners.',FALSE,FALSE),
('speaker','check','["Play something at volume and listen for rattle.","Check the charging port if it is portable."]',
  0,'','Drivers last a long time; batteries do not.',FALSE,FALSE),
('coffee-maker','check','["Descale before first use.","Check the carafe and seals for cracks."]',
  0,'','Limescale is cosmetic. Cracked seals leak.',FALSE,FALSE),
-- SOURCED: Herman Miller Aeron Chair Environmental Product Declaration (2016) — 85.3 kg CO2e cradle-to-gate, A1–A3
('desk-chair','check','["Sit on it and check the gas cylinder does not sink.","Test that the recline lock holds."]',
  85,'Herman Miller Aeron Chair Environmental Product Declaration (2016) — 85.3 kg CO2e cradle-to-gate, A1–A3','A failed gas cylinder is a real repair, not a quirk.',TRUE,FALSE),
('blender','check','["Inspect the seal and gasket around the blade assembly.","Cracked plastic near the base means leaks."]',
  0,'','Seals perish long before motors do.',FALSE,FALSE),
('kettle','check','["Limescale is cosmetic and descales off.","Check the flex and plug for fraying.","Confirm the auto shut-off works."]',
  0,'','A failed auto shut-off is the one thing to avoid.',FALSE,FALSE),
('headphones','check','["Budget for replacement ear pads.","Test both channels before paying."]',
  0,'','Hygiene is the reason for the caveat, not whether they work.',FALSE,FALSE),
('winter-coat','check','["Run every zip fully up and down.","Check the insulation still lofts rather than sitting flat."]',
  0,'','Excellent value used. Flattened insulation cannot be restored.',FALSE,FALSE),
-- SOURCED: Apple 13-inch MacBook Air Product Environmental Report — 161 kg CO2e, 76% production
('laptop','check','["Ask for the battery cycle count.","Confirm it powers on and gets past the setup screen.","Check it is not activation locked to the previous owner."]',
  122,'Apple 13-inch MacBook Air Product Environmental Report — 161 kg CO2e, 76% production','Production dominates a laptop''s footprint. Activation lock is the one thing that makes a cheap one worthless.',FALSE,FALSE),
-- SOURCED: Apple iPad (9th generation) Product Environmental Report — 75 kg CO2e life cycle, 78% production
('tablet','check','["Confirm it is not activation locked to the previous owner.","Ask for the battery health percentage.","Check it still receives OS updates — old tablets get dropped quietly."]',
  59,'Apple iPad (9th generation) Product Environmental Report — 75 kg CO2e life cycle, 78% production','Production dominates a tablet’s footprint. Activation lock is the one thing that makes a cheap one worthless.',FALSE,FALSE),
-- SOURCED: University of Cambridge study of the PlayStation 4 — ~89 kg CO2e to manufacture and ship one unit
('game-console','check','["Confirm it is not banned from online play — ask the seller to sign in.","Listen to the fan under load; a screaming fan means dust or dried paste.","Check the storage is wiped, not just logged out."]',
  89,'University of Cambridge study of the PlayStation 4 — ~89 kg CO2e to manufacture and ship one unit','Consoles last a decade and hold value. The risks are an account ban and a neglected fan, both checkable.',FALSE,FALSE),

-- BUY NEW -----------------------------------------------------
('bike-helmet','avoid','[]',
  0,'','Single-impact protection, and a helmet that has already been dropped looks identical to one that has not.',FALSE,FALSE),
('non-stick-pan','avoid','[]',
  0,'','The coating degrades and scratches. Buy cast iron or stainless used instead.',FALSE,FALSE),
('smoke-detector','avoid','[]',
  0,'','Sensors expire on a fixed schedule from manufacture.',FALSE,FALSE),
('surge-protector','avoid','[]',
  0,'','Protection components wear out invisibly with every surge absorbed.',FALSE,FALSE),
('pillow','avoid','[]',
  0,'','Hygiene, and they are cheap enough new that it does not sting.',FALSE,FALSE),
('mattress','avoid','[]',
  0,'','Hygiene and pest risk, and compression is permanent. Buy this one new.',TRUE,FALSE);
