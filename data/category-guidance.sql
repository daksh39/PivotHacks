-- ---------------------------------------------------------------------------
-- Verte — category knowledge base.  verte-plan.md §07.  Owned by lane/snowflake.
--
-- "The most quietly valuable thing we ship — real advice a first-year
--  genuinely does not have, and what separates Verte from a price-comparison
--  widget."
--
-- ⚠ EVERY CO2_SOURCE BELOW IS A PLACEHOLDER.  §09: "Store the source with the
--   number. Use published embodied-carbon estimates per category. Don't
--   compute anything bespoke and don't invent precision."
--   lane/demo replaces these before anything is demoed. Do NOT invent a
--   citation — a judge's first question is where the number came from, and
--   having an answer is worth more than having a bigger number.
--
-- CATEGORY values MUST match the slugs in proxy/categories.ts exactly.
-- ---------------------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS VERTE;
USE DATABASE VERTE;
USE SCHEMA PUBLIC;

CREATE TABLE IF NOT EXISTS CATEGORY_GUIDANCE (
  CATEGORY         VARCHAR PRIMARY KEY,
  VERDICT          VARCHAR NOT NULL,   -- 'safe' | 'check' | 'avoid'
  CHECK_TIPS       ARRAY,
  EMBODIED_CO2_KG  NUMBER(10,1),
  CO2_SOURCE       VARCHAR NOT NULL,
  NOTE             VARCHAR
);

CREATE TABLE IF NOT EXISTS CAMPUS_LISTINGS (
  ID          VARCHAR PRIMARY KEY,
  CATEGORY    VARCHAR NOT NULL,
  TITLE       VARCHAR NOT NULL,
  PRICE       NUMBER(10,2) NOT NULL,
  URL         VARCHAR NOT NULL,
  IMAGE_URL   VARCHAR,
  CONDITION   VARCHAR,
  DISTANCE_MI NUMBER(5,1),
  POSTED_AT   TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

CREATE TABLE IF NOT EXISTS IMPACT_LOG (
  ID        VARCHAR DEFAULT UUID_STRING(),
  CATEGORY  VARCHAR,
  CO2_KG    NUMBER(10,1),
  SEEN_AT   TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- --- §07 starter set -------------------------------------------------------

INSERT INTO CATEGORY_GUIDANCE
  (CATEGORY, VERDICT, CHECK_TIPS, EMBODIED_CO2_KG, CO2_SOURCE, NOTE)
SELECT column1, column2, PARSE_JSON(column3), column4, column5, column6 FROM VALUES

-- SAFE
('desk','safe','["Check the drawer runners slide cleanly.","Make sure it is not particleboard that has been wet."]',32,'PLACEHOLDER — lane/demo to source','Ideal used. Solid wood outlives several owners.'),
('bookshelf','safe','["Check the shelves have not bowed.","Make sure it is not particleboard that has been wet."]',28,'PLACEHOLDER — lane/demo to source','Ideal used.'),
('dresser','safe','["Check the drawer runners slide cleanly.","Look underneath for water damage."]',40,'PLACEHOLDER — lane/demo to source','Ideal used.'),
('mini-fridge','safe','["Check the door seal for cracks or gaps.","Confirm it cools within an hour of plugging in."]',46,'PLACEHOLDER — lane/demo to source','Compressor appliances last well. Buying used avoids nearly all of the footprint.'),
('microwave','safe','["Check the door latch closes firmly.","Make sure the interior is not scorched or rusted."]',38,'PLACEHOLDER — lane/demo to source','Simple machines. Little to go wrong.'),
('monitor','safe','["Look for dead pixels on a white screen.","Check for backlight bleed in a dark room."]',210,'PLACEHOLDER — lane/demo to source','Electronics carry a heavy manufacturing footprint — the biggest win on this list.'),
('textbook','safe','["Confirm the edition matches the syllabus.","The previous edition is often fine — ask first."]',3,'PLACEHOLDER — lane/demo to source','Always buy used. Always.'),
('cookware','safe','["Effectively indestructible.","Rust on cast iron is cosmetic and scrubs off."]',12,'PLACEHOLDER — lane/demo to source','Cast iron and stainless outlive their owners.'),
('bike','safe','["Check the frame for cracks near the welds.","Chain, brakes and tyres are cheap to replace."]',96,'PLACEHOLDER — lane/demo to source','Frame is what matters. Everything else is a consumable.'),
('storage-bin','safe','["No meaningful risk."]',5,'PLACEHOLDER — lane/demo to source','Never buy these new.'),
('drying-rack','safe','["No meaningful risk."]',8,'PLACEHOLDER — lane/demo to source','Nothing to go wrong. Always worth checking used first.'),
('fan','safe','["No meaningful risk.","Check it spins freely and is not noisy."]',14,'PLACEHOLDER — lane/demo to source','Never buy these new.'),

-- CHECK
('laptop','check','["Ask for the battery cycle count.","Confirm it powers on and is not activation-locked."]',330,'PLACEHOLDER — lane/demo to source','The largest carbon saving here, and the one worth the most diligence.'),
('desk-chair','check','["Test the gas cylinder — if it sinks under your weight that is a real repair.","Check the casters roll."]',54,'PLACEHOLDER — lane/demo to source','A good used chair beats a cheap new one, if the cylinder holds.'),
('blender','check','["Inspect the seals and gaskets.","Limescale is fine; cracked plastic is not."]',18,'PLACEHOLDER — lane/demo to source','Check the jug, not the motor.'),
('kettle','check','["Inspect the seals and the base contacts.","Limescale is fine; cracked plastic is not."]',9,'PLACEHOLDER — lane/demo to source','Cheap to replace, so only buy used if it is nearby.'),
('headphones','check','["Budget for replacement ear pads.","Check both drivers work before you pay."]',7,'PLACEHOLDER — lane/demo to source','Hygiene is the only real issue, and pads are replaceable.'),
('winter-coat','check','["Check the zips run cleanly.","Check the insulation still lofts after a shake."]',26,'PLACEHOLDER — lane/demo to source','Great value used. Clothing has a heavier footprint than people expect.'),

-- BUY NEW
('mattress','avoid','[]',0,'PLACEHOLDER — lane/demo to source','Hygiene and pest risk, and compression is permanent. Buy this one new.'),
('pillow','avoid','[]',0,'PLACEHOLDER — lane/demo to source','Same reasoning as a mattress, and cheap enough that it does not sting.'),
('bike-helmet','avoid','[]',0,'PLACEHOLDER — lane/demo to source','Single-impact protection. You cannot see whether it has already been used.'),
('non-stick-pan','avoid','[]',0,'PLACEHOLDER — lane/demo to source','The coating degrades and scratches. Buy stainless or cast iron used instead.'),
('smoke-detector','avoid','[]',0,'PLACEHOLDER — lane/demo to source','Sensors expire. Do not gamble on this one.'),
('surge-protector','avoid','[]',0,'PLACEHOLDER — lane/demo to source','Protection components wear out invisibly with every surge absorbed.');

-- --- campus listings -------------------------------------------------------
-- SEEDED, and we say so plainly if asked (§09). The groups students actually
-- use are Facebook and GroupMe, which have no API to read from.
-- lane/demo: seed rows that match the exact products in the demo path (§04).

INSERT INTO CAMPUS_LISTINGS (ID, CATEGORY, TITLE, PRICE, URL, IMAGE_URL, CONDITION, DISTANCE_MI) VALUES
('c1','mini-fridge','Mini fridge, used one year, works perfectly',34,'https://example.edu/listings/1',NULL,'Used — good',2.0),
('c2','mini-fridge','Compact fridge — moving out, must go',40,'https://example.edu/listings/2',NULL,'Used — good',0.8),
('c3','desk','IKEA desk, one owner, no marks',25,'https://example.edu/listings/3',NULL,'Used — very good',1.2),
('c4','desk-chair','Office chair, cylinder holds fine',30,'https://example.edu/listings/4',NULL,'Used — good',1.7),
('c5','monitor','24 inch 1080p monitor, no dead pixels',45,'https://example.edu/listings/5',NULL,'Used — very good',0.5);
