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
  -- true, a cheap old unit can be a carbon loss and the card says so.
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
-- 58 categories, matching proxy/categories.ts one for one.

INSERT INTO CATEGORY_GUIDANCE
  (CATEGORY, VERDICT, CHECK_TIPS, EMBODIED_CO2_KG, CO2_SOURCE, NOTE, BULKY, USE_DOMINANT)
SELECT column1, column2, PARSE_JSON(column3), column4, column5, column6, column7, column8
FROM VALUES


-- SAFE --------------------------------------------------------
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
('keyboard','safe','["Test every key in an online key tester.","Check the cable or the battery, whichever it uses."]',
  0,'','Mechanical switches outlive several owners and anything broken is obvious in thirty seconds.',FALSE,FALSE),
('speaker','safe','["Play something bass-heavy and listen for buzzing from a blown driver.","Check the charging port is not loose."]',
  0,'','Drivers and cabinets do not age much. A blown speaker announces itself immediately.',FALSE,FALSE),
('backpack','safe','["Run every zip end to end.","Check the shoulder strap stitching where it meets the body."]',
  0,'','Bags are built for years of abuse, and everything that fails is visible from the outside.',FALSE,FALSE),
('luggage','safe','["Roll it — wheels and bearings are what wear out.","Extend and retract the handle a few times.","Check the shell for cracks around the corners."]',
  0,'','A hard case survives far more trips than one owner takes. Wheels and handles are the only real wear points.',TRUE,FALSE),
('webcam','safe','["Plug it in and check the autofocus settles.","Confirm the mount still grips a monitor."]',
  0,'','Nothing inside wears out, and anything broken shows up the first time you open it.',FALSE,FALSE),
('microphone','safe','["Record a test clip and listen for crackle on the capsule.","Check the stand thread and the shock mount are included."]',
  0,'','Microphones are famously durable — studios run the same ones for decades.',FALSE,FALSE),
('weights','safe','["Check adjustable dumbbells lock at every setting.","Look for cracks in rubber coating, which is cosmetic but spreads."]',
  0,'','Cast iron is the strongest secondhand case there is. It does not wear out, and new ones cost a fortune to ship.',TRUE,FALSE),

-- CHECK -------------------------------------------------------
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
('game-controller','check','["Test both sticks in a drift checker before the return window closes.","Press every face and shoulder button — worn switches feel mushy.","Check the battery still holds a charge through a full session."]',
  0,'','Stick drift is the one failure that makes a cheap controller worthless, and it is easy to test in a minute.',FALSE,FALSE),
-- SOURCED: University of Cambridge study of the PlayStation 4 — ~89 kg CO2e to manufacture and ship one unit
('game-console','check','["Confirm it is not banned from online play — ask the seller to sign in.","Listen to the fan under load; a screaming fan means dust or dried paste.","Check the disc drive reads and the storage is wiped, not just logged out."]',
  89,'University of Cambridge study of the PlayStation 4 — ~89 kg CO2e to manufacture and ship one unit','Consoles last a decade and hold value. The risks are an account ban and a neglected fan, both checkable.',FALSE,FALSE),
('e-reader','check','["Look for cracks under the glass — e-ink screens do not survive a drop.","Confirm it is deregistered from the previous owner''s account.","Ask how long a charge lasts; an old battery is the usual reason for selling."]',
  0,'','E-ink barely ages, so a used one is close to a new one. A screen crack is the thing that ends it.',FALSE,FALSE),
-- SOURCED: Apple iPad (9th generation) Product Environmental Report — 75 kg CO2e life cycle, 78% production
('tablet','check','["Confirm it is not activation locked to the previous owner.","Ask for the battery health percentage.","Check it still receives OS updates — old tablets get dropped quietly."]',
  59,'Apple iPad (9th generation) Product Environmental Report — 75 kg CO2e life cycle, 78% production','Production dominates a tablet''s footprint. Activation lock is the one thing that makes a cheap one worthless.',FALSE,FALSE),
('smart-tv','check','["Have it powered on before you commit — look for lines, dark patches or dead pixels.","Check the panel for pressure marks, which show as clouding on a white screen.","Confirm the stand and remote are included."]',
  0,'','A panel fault is invisible on a switched-off screen, and it is the only defect that really matters.',FALSE,FALSE),
('camera','check','["Ask for the shutter count — it is a camera''s odometer.","Shoot a plain bright surface and look for sensor dust spots.","Check the lens mount and threads for dents."]',
  0,'','Bodies are built for far more actuations than most owners ever use, so a low shutter count is a genuinely good buy.',FALSE,FALSE),
('computer-mouse','check','["Click each button twenty times and listen for double-clicks.","Check the feet and the scroll wheel for wear."]',
  0,'','Switches wear out before anything else, and a double-clicking mouse is unusable for work.',FALSE,FALSE),
('router','check','["Check the manufacturer still ships firmware updates for that model.","Factory reset it before use — never trust an inherited configuration."]',
  0,'','A router with no security updates is a liability on your network, so the model''s support status matters more than its age.',FALSE,FALSE),
('printer','check','["Price the cartridges before you buy — they often cost more than the printer.","Print a test page; a clogged inkjet head is usually unfixable.","Laser printers survive storage far better than inkjets."]',
  0,'','The purchase price is the small part. A cheap used inkjet with expensive clogged heads is no bargain.',TRUE,FALSE),
('multi-cooker','check','["Inspect the sealing ring — it holds smells and is the usual thing that fails.","Confirm the pressure release valve moves freely.","Check the inner pot coating is not scratched through."]',
  0,'','The body lasts for years and the two parts that do not — the ring and the valve — are cheap to replace.',FALSE,FALSE),
('coffee-maker','check','["Ask when it was last descaled; scale is what kills these.","Run a cycle and check for leaks around the seals.","Confirm the basket, carafe and any pods system are all there."]',
  0,'','A descaled machine lasts a decade. A neglected one is a repair job, and you can tell which you are looking at.',FALSE,FALSE),
('vacuum','check','["Check the filter and whether replacements are still sold.","For a cordless, ask how long it runs on a full charge.","Look at the brush roll for hair damage and worn bristles."]',
  0,'','Motors long outlast batteries and filters. Price the consumables before you decide it is a bargain.',TRUE,FALSE),
('air-purifier','check','["Price a replacement filter — assume you will need one immediately.","Check the unit''s filter indicator has been reset, not ignored."]',
  0,'','The machine is fine used. Always budget for a new filter on day one — the old one is not worth inheriting.',TRUE,FALSE),
('fitness-tracker','check','["Confirm it is unpaired and removed from the previous owner''s account.","Ask for battery life in real terms — these degrade fast.","Check whether the strap is a standard size you can replace."]',
  0,'','Account locks and tired batteries are the two things that turn a cheap tracker into a paperweight.',FALSE,FALSE),
('shoes','check','["Look at the sole tread and the midsole for compression creases.","Check the heel counter still holds its shape.","Running shoes lose cushioning well before they look worn out."]',
  0,'','Fine for casual and fashion pairs. For running, worn midsoles are a genuine injury risk however good they look.',FALSE,FALSE),
('toys','check','["Check the piece count against the box — missing pieces are the norm.","Look up the model for a safety recall.","For anything with small parts, check the age rating matches."]',
  0,'','Toys are one of the strongest secondhand cases: barely used, and children outgrow them long before they wear out.',FALSE,FALSE),
('external-drive','check','["Ask for the SMART power-on hours before you buy.","Run a full read test on arrival, while you can still return it.","Never keep your only copy of anything on a used drive."]',
  0,'','Enclosures and interfaces last, but a drive''s remaining life is the whole question — and SMART data answers it honestly.',FALSE,FALSE),
('streaming-stick','check','["Factory reset it so it is off the previous owner''s account.","Check the model still gets app updates — old sticks lose Netflix quietly."]',
  0,'','The hardware is fine. What dates these is app support, so the model year matters more than the condition.',FALSE,FALSE),
('smart-home','check','["Confirm it has been removed from the previous owner''s account — many are useless until it is.","Check the model still receives security updates.","For anything wired, confirm the mounting plate and screws are included."]',
  0,'','The one thing that bricks these is an account the seller forgot to release, and it is free to check before you pay.',FALSE,FALSE),
('hair-dryer','check','["Run it on every heat setting and smell for burning.","Check the cord where it meets the body for kinks.","Look at the plates or filter for scorching and residue."]',
  0,'','Motors and elements last well. A frayed cord is the one fault worth walking away from.',FALSE,FALSE),
('sunglasses','check','["Hold the lenses to the light at an angle to find scratches.","Check the hinges are tight and the frame is not sprung.","Ask whether the lenses are still the original UV-coated ones."]',
  0,'','Frames outlive lenses. A scratched or relensed pair may no longer block what it claims to.',FALSE,FALSE),
('exercise-machine','check','["Run it at speed for five minutes and listen to the belt and bearings.","Check whether the subscription the console depends on is transferable.","Measure your doorway before you commit — these rarely come apart."]',
  0,'','Bought new with good intentions and sold barely used, so condition is usually excellent. The catch is the subscription and getting it home.',TRUE,FALSE),

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
  0,'','Hygiene and pest risk, and compression is permanent. Buy this one new.',TRUE,FALSE),
('power-bank','avoid','[]',
  0,'','Lithium cells degrade with every cycle and with age, and a used pack''s history is unknowable. A damaged cell is a fire risk. Buy this one new.',FALSE,FALSE),
('water-bottle','avoid','[]',
  0,'','You cannot verify how a bottle was cleaned or what was kept in it, and the seal and straw are where that matters. Buy this one new.',FALSE,FALSE),
('water-filter','avoid','[]',
  0,'','A filter''s job is what it has already absorbed. Buying that history secondhand defeats the point. Buy this one new.',FALSE,FALSE),
('electric-toothbrush','avoid','[]',
  0,'','A used toothbrush handle cannot be meaningfully sanitised where it matters, around the head seal. Buy this one new.',FALSE,FALSE),
('memory-card','avoid','[]',
  0,'','Flash memory wears out silently with use, and the secondhand market for cards is full of relabelled fakes. Buy this one new.',FALSE,FALSE);
