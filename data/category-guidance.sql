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
  BULKY            BOOLEAN      NOT NULL
);

-- Accumulates across runs — never replaced.
CREATE TABLE IF NOT EXISTS IMPACT_LOG (
  ID        VARCHAR DEFAULT UUID_STRING(),
  CATEGORY  VARCHAR,
  CO2_KG    NUMBER(10,1),
  SEEN_AT   TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- --- §07 starter set -------------------------------------------------------
-- 24 categories, matching proxy/categories.ts one for one.

INSERT INTO CATEGORY_GUIDANCE
  (CATEGORY, VERDICT, CHECK_TIPS, EMBODIED_CO2_KG, CO2_SOURCE, NOTE, BULKY)
SELECT column1, column2, PARSE_JSON(column3), column4, column5, column6, column7
FROM VALUES


-- SAFE --------------------------------------------------------
('drying-rack','safe','["Confirm the hinges lock open."]',
  0,'','Nothing to go wrong. Always worth checking used first.',FALSE),
('storage-bin','safe','["Check for cracks along the base."]',
  0,'','No meaningful risk. Never buy these new.',FALSE),
('bookshelf','safe','["Check the shelves are not sagging.","Confirm the wall anchor hardware is included."]',
  0,'','Very little that can go wrong.',TRUE),
('dresser','safe','["Open every drawer.","Check the back panel is still attached."]',
  0,'','Heavy, so favour local pickup over shipping.',TRUE),
('microwave','safe','["Check the door latch closes firmly.","The interior should not be scorched or rusted."]',
  0,'','A damaged door seal is the one real safety concern.',FALSE),
('textbook','safe','["Confirm the edition matches the syllabus.","Ask whether an access code is required and still unused."]',
  0,'','A previous edition is often fine, and usually a fraction of the price.',FALSE),
('cookware','safe','["Surface rust on cast iron is cosmetic and scrubs off.","Check stainless pans sit flat on a counter."]',
  0,'','Cast iron and stainless are effectively indestructible.',FALSE),
('bike','safe','["Inspect the frame for cracks near the welds.","Spin both wheels and check they run true.","Chain, brakes and tyres are cheap to replace."]',
  0,'','Frame condition is the only thing that really matters.',FALSE),
('fan','safe','["Run it on every speed setting.","Check the cage is not bent into the blades."]',
  0,'','No meaningful risk.',FALSE),
('mini-fridge','safe','["Check the door seal for cracks or gaps.","Confirm it cools within an hour of plugging in."]',
  0,'','Compressor appliances last well. Buying used avoids nearly all of the footprint.',TRUE),
-- SOURCED: Dell S2421HS Monitor PCF datasheet — 476 kg CO2e total, 67.7% manufacturing
('monitor','safe','["Show a white image and look for dead pixels.","Check the corners for backlight bleed in a dark room.","Confirm which cables are included."]',
  322,'Dell S2421HS Monitor PCF datasheet — 476 kg CO2e total, 67.7% manufacturing','Most of a display''s footprint is in the making of it, so a used one avoids nearly all of it.',FALSE),
('desk','safe','["Check the drawer runners slide cleanly.","Make sure it isn''t particleboard that has been wet."]',
  0,'','Ideal used. Solid wood outlives several owners.',TRUE),

-- CHECK -------------------------------------------------------
('desk-chair','check','["Sit on it and check the gas cylinder does not sink.","Test that the recline lock holds."]',
  0,'','A failed gas cylinder is a real repair, not a quirk.',TRUE),
('blender','check','["Inspect the seal and gasket around the blade assembly.","Cracked plastic near the base means leaks."]',
  0,'','Seals perish long before motors do.',FALSE),
('kettle','check','["Limescale is cosmetic and descales off.","Check the flex and plug for fraying.","Confirm the auto shut-off works."]',
  0,'','A failed auto shut-off is the one thing to avoid.',FALSE),
('headphones','check','["Budget for replacement ear pads.","Test both channels before paying."]',
  0,'','Hygiene is the reason for the caveat, not whether they work.',FALSE),
('winter-coat','check','["Run every zip fully up and down.","Check the insulation still lofts rather than sitting flat."]',
  0,'','Excellent value used. Flattened insulation cannot be restored.',FALSE),
-- SOURCED: Apple 13-inch MacBook Air Product Environmental Report — 161 kg CO2e, 76% production
('laptop','check','["Ask for the battery cycle count.","Confirm it powers on and gets past the setup screen.","Check it is not activation locked to the previous owner."]',
  122,'Apple 13-inch MacBook Air Product Environmental Report — 161 kg CO2e, 76% production','Production dominates a laptop''s footprint. Activation lock is the one thing that makes a cheap one worthless.',FALSE),

-- BUY NEW -----------------------------------------------------
('bike-helmet','avoid','[]',
  0,'','Single-impact protection, and a helmet that has already been dropped looks identical to one that has not.',FALSE),
('non-stick-pan','avoid','[]',
  0,'','The coating degrades and scratches. Buy cast iron or stainless used instead.',FALSE),
('smoke-detector','avoid','[]',
  0,'','Sensors expire on a fixed schedule from manufacture.',FALSE),
('surge-protector','avoid','[]',
  0,'','Protection components wear out invisibly with every surge absorbed.',FALSE),
('pillow','avoid','[]',
  0,'','Hygiene, and they are cheap enough new that it does not sting.',FALSE),
('mattress','avoid','[]',
  0,'','Hygiene and pest risk, and compression is permanent. Buy this one new.',TRUE);
