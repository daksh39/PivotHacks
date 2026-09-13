-- ---------------------------------------------------------------------------
-- Verte — category knowledge base.  verte-plan.md §07.  Owned by lane/snowflake.
--
-- "The most quietly valuable thing we ship — real advice a first-year
--  genuinely does not have, and what separates Verte from a price-comparison
--  widget."
--
-- This file is the source of truth for CATEGORY_GUIDANCE. The SEED constant in
-- proxy/snowflake.ts mirrors it so the proxy runs green with no Snowflake
-- account; proxy/snowflake.test.ts fails if the two drift.
--
-- CARBON: a category carries a figure ONLY when CO2_SOURCE names a real
-- reference. Everything else is 0 / '' and isSourced() in src/carbon.ts
-- suppresses the claim rather than printing a number nobody can defend (§09).
-- Do NOT invent a citation to fill one in — a judge's first question is where
-- the number came from, and having an answer beats having a bigger number.
--
-- CATEGORY values MUST match the slugs in proxy/categories.ts exactly.
-- Re-running this file is safe: CATEGORY_GUIDANCE is replaced wholesale,
-- IMPACT_LOG is left alone so its history survives.
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

-- SAFE ----------------------------------------------------------------------
('desk','safe','["Check the drawer runners slide cleanly.","Make sure it is not particleboard that has been wet."]',
  0,'','Ideal used. Solid wood outlives several owners.',TRUE),

('bookshelf','safe','["Check the shelves have not bowed.","Make sure it is not particleboard that has been wet."]',
  0,'','Ideal used.',TRUE),

('dresser','safe','["Check the drawer runners slide cleanly.","Look underneath for water damage."]',
  0,'','Ideal used.',TRUE),

('mini-fridge','safe','["Check the door seal for cracks or gaps.","Confirm it cools within an hour of plugging in."]',
  0,'','Compressor appliances last well. Buying used avoids nearly all of the footprint.',TRUE),

('microwave','safe','["Check the door latch closes firmly.","Make sure the interior is not scorched or rusted."]',
  0,'','Simple machines. Little to go wrong.',TRUE),

-- SOURCED. Dell publishes a per-product carbon footprint datasheet for the
-- S2421HS 24" monitor: 476 kg CO2e over the full life cycle, of which
-- manufacturing is 67.7% -> ~322 kg.
('monitor','safe','["Show a white image and look for dead pixels.","Check the corners for backlight bleed in a dark room.","Confirm which cables are included."]',
  322,'Dell S2421HS Monitor PCF datasheet — 476 kg CO2e total, 67.7% manufacturing',
  'Most of a display''s footprint is in the making of it, so a used one avoids nearly all of it.',FALSE),

('textbook','safe','["Confirm the edition matches the syllabus.","The previous edition is often fine — ask first."]',
  0,'','Always buy used. Always.',FALSE),

('cookware','safe','["Effectively indestructible.","Rust on cast iron is cosmetic and scrubs off."]',
  0,'','Cast iron and stainless outlive their owners.',FALSE),

('bike','safe','["Check the frame for cracks near the welds.","Chain, brakes and tyres are cheap to replace."]',
  0,'','Frame is what matters. Everything else is a consumable.',FALSE),

('storage-bin','safe','["No meaningful risk."]',
  0,'','Never buy these new.',FALSE),

('drying-rack','safe','["No meaningful risk."]',
  0,'','Nothing to go wrong. Always worth checking used first.',TRUE),

('fan','safe','["No meaningful risk.","Check it spins freely and is not noisy."]',
  0,'','Never buy these new.',FALSE),

-- CHECK ---------------------------------------------------------------------
-- SOURCED. Apple's Product Environmental Report for the 13-inch MacBook Air
-- puts life-cycle emissions at ~161 kg CO2e with 76% from production.
('laptop','check','["Ask for the battery cycle count.","Confirm it powers on and gets past the setup screen.","Check it is not activation locked to the previous owner."]',
  122,'Apple 13-inch MacBook Air Product Environmental Report — 161 kg CO2e, 76% production',
  'Production dominates a laptop''s footprint. Activation lock is the one thing that makes a cheap one worthless.',FALSE),

('desk-chair','check','["Test the gas cylinder — if it sinks under your weight that is a real repair.","Check the casters roll."]',
  0,'','A good used chair beats a cheap new one, if the cylinder holds.',TRUE),

('blender','check','["Inspect the seals and gaskets.","Limescale is fine; cracked plastic is not."]',
  0,'','Check the jug, not the motor.',FALSE),

('kettle','check','["Inspect the seals and the base contacts.","Limescale is fine; cracked plastic is not."]',
  0,'','Cheap to replace, so only buy used if it is nearby.',FALSE),

('headphones','check','["Budget for replacement ear pads.","Check both drivers work before you pay."]',
  0,'','Hygiene is the only real issue, and pads are replaceable.',FALSE),

('winter-coat','check','["Check the zips run cleanly.","Check the insulation still lofts after a shake."]',
  0,'','Great value used. Clothing has a heavier footprint than people expect.',FALSE),

-- BUY NEW -------------------------------------------------------------------
('mattress','avoid','[]',
  0,'','Hygiene and pest risk, and compression is permanent. Buy this one new.',TRUE),

('pillow','avoid','[]',
  0,'','Same reasoning as a mattress, and cheap enough that it does not sting.',FALSE),

('bike-helmet','avoid','[]',
  0,'','Single-impact protection. You cannot see whether it has already been used.',FALSE),

('non-stick-pan','avoid','[]',
  0,'','The coating degrades and scratches. Buy stainless or cast iron used instead.',FALSE),

('smoke-detector','avoid','[]',
  0,'','Sensors expire. Do not gamble on this one.',FALSE),

('surge-protector','avoid','[]',
  0,'','Protection components wear out invisibly with every surge absorbed.',FALSE);
