-- =============================================================================
-- SEED 08 — ALLERGEN EXPANSION (2026-06-21)
-- Brings allergen parents from 18 → 40 with real, sourced food allergens beyond
-- the FDA Big-9: regulatory allergens recognised by EU/Canada/Codex (mustard,
-- celery, lupin, buckwheat), seed allergens, legumes, the major LTP/OAS fruits,
-- and other common standalone allergies (corn, coconut, gelatin, oat/barley/rye
-- as grain allergies distinct from gluten intolerance).
-- All rows DRAFT, pending independent validation. Runs after seed_02.
-- Format mirrors seed_02_allergens.sql.
-- =============================================================================

-- Sub-groups (one per standalone parent; sort_order continues after 9) ---------
INSERT INTO sub_groups (sub_group_id, domain, label, sort_order) VALUES
  ('allergen.mustard','ALLERGEN','Mustard',10),
  ('allergen.celery','ALLERGEN','Celery',11),
  ('allergen.lupin','ALLERGEN','Lupin',12),
  ('allergen.buckwheat','ALLERGEN','Buckwheat',13),
  ('allergen.corn','ALLERGEN','Corn',14),
  ('allergen.oat','ALLERGEN','Oat',15),
  ('allergen.barley','ALLERGEN','Barley',16),
  ('allergen.rye','ALLERGEN','Rye',17),
  ('allergen.sunflowerseed','ALLERGEN','Sunflower Seed',18),
  ('allergen.poppyseed','ALLERGEN','Poppy Seed',19),
  ('allergen.flaxseed','ALLERGEN','Flaxseed',20),
  ('allergen.chiaseed','ALLERGEN','Chia Seed',21),
  ('allergen.lentil','ALLERGEN','Lentil',22),
  ('allergen.chickpea','ALLERGEN','Chickpea',23),
  ('allergen.pea','ALLERGEN','Pea',24),
  ('allergen.coconut','ALLERGEN','Coconut',25),
  ('allergen.gelatin','ALLERGEN','Gelatin',26),
  ('allergen.kiwi','ALLERGEN','Kiwi',27),
  ('allergen.banana','ALLERGEN','Banana',28),
  ('allergen.avocado','ALLERGEN','Avocado',29),
  ('allergen.peach','ALLERGEN','Peach',30),
  ('allergen.mango','ALLERGEN','Mango',31);

-- Parents ----------------------------------------------------------------------
INSERT INTO parents
  (parent_id, domain, sub_group_id, common_name, technical_name,
   regulatory_major_allergen, regulatory_basis, source) VALUES
  ('mustard','ALLERGEN','allergen.mustard','Mustard',NULL,0,'EU/UK/Canada labelling allergen; not a US FDA major allergen.','EXPERT_REVIEW'),
  ('celery','ALLERGEN','allergen.celery','Celery',NULL,0,'EU/UK labelling allergen (celery and celeriac).','EXPERT_REVIEW'),
  ('lupin','ALLERGEN','allergen.lupin','Lupin',NULL,0,'EU/UK/Australia labelling allergen; cross-reacts with peanut.','EXPERT_REVIEW'),
  ('buckwheat','ALLERGEN','allergen.buckwheat','Buckwheat',NULL,0,'Recognised allergen in Japan/Korea; severe reactions reported.','EXPERT_REVIEW'),
  ('corn','ALLERGEN','allergen.corn','Corn','maize',0,'Recognised food allergy; not a US major allergen.','EXPERT_REVIEW'),
  ('oat','ALLERGEN','allergen.oat','Oat',NULL,0,'Cereal allergy distinct from gluten intolerance; avenin protein.','EXPERT_REVIEW'),
  ('barley','ALLERGEN','allergen.barley','Barley',NULL,0,'Cereal allergy (hordein); also a gluten source.','EXPERT_REVIEW'),
  ('rye','ALLERGEN','allergen.rye','Rye',NULL,0,'Cereal allergy (secalin); also a gluten source.','EXPERT_REVIEW'),
  ('sunflower_seed','ALLERGEN','allergen.sunflowerseed','Sunflower Seed',NULL,0,'Seed allergy; reactions to seed and seed butter.','EXPERT_REVIEW'),
  ('poppy_seed','ALLERGEN','allergen.poppyseed','Poppy Seed',NULL,0,'Seed allergy; documented anaphylaxis.','EXPERT_REVIEW'),
  ('flaxseed','ALLERGEN','allergen.flaxseed','Flaxseed','linseed',0,'Seed allergy; growing with flax use.','EXPERT_REVIEW'),
  ('chia_seed','ALLERGEN','allergen.chiaseed','Chia Seed',NULL,0,'Seed allergy; reported with chia popularity.','EXPERT_REVIEW'),
  ('lentil','ALLERGEN','allergen.lentil','Lentil',NULL,0,'Legume allergy; common in Mediterranean/South Asian diets.','EXPERT_REVIEW'),
  ('chickpea','ALLERGEN','allergen.chickpea','Chickpea','garbanzo',0,'Legume allergy; hummus/gram flour.','EXPERT_REVIEW'),
  ('pea','ALLERGEN','allergen.pea','Pea',NULL,0,'Legume allergy; pea protein increasingly common in foods.','EXPERT_REVIEW'),
  ('coconut','ALLERGEN','allergen.coconut','Coconut',NULL,0,'FDA classifies coconut as a tree nut for labelling; tracked separately here.','EXPERT_REVIEW'),
  ('gelatin','ALLERGEN','allergen.gelatin','Gelatin',NULL,0,'Animal-protein allergy (bovine/porcine/fish-derived).','EXPERT_REVIEW'),
  ('kiwi','ALLERGEN','allergen.kiwi','Kiwi',NULL,0,'Fruit allergy; can be severe in children.','EXPERT_REVIEW'),
  ('banana','ALLERGEN','allergen.banana','Banana',NULL,0,'Fruit allergy; latex-fruit syndrome cross-reactivity.','EXPERT_REVIEW'),
  ('avocado','ALLERGEN','allergen.avocado','Avocado',NULL,0,'Fruit allergy; latex-fruit syndrome cross-reactivity.','EXPERT_REVIEW'),
  ('peach','ALLERGEN','allergen.peach','Peach',NULL,0,'Rosaceae fruit allergy; lipid-transfer-protein reactions.','EXPERT_REVIEW'),
  ('mango','ALLERGEN','allergen.mango','Mango',NULL,0,'Fruit allergy; cross-reacts with cashew/pistachio and poison ivy.','EXPERT_REVIEW');

-- Synonyms / label forms -------------------------------------------------------
INSERT INTO synonyms (parent_id, term, confidence_level, match_class, source, cross_note) VALUES
  ('mustard','Mustard','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('mustard','Mustard seed','HIGH','DERIVED','EXPERT_REVIEW',NULL),
  ('mustard','Mustard flour','HIGH','DERIVED','EXPERT_REVIEW',NULL),
  ('mustard','Dijon','MEDIUM','DERIVED','EXPERT_REVIEW','Dijon mustard.'),
  ('mustard','Mustard oil','MEDIUM','DERIVED','EXPERT_REVIEW',NULL),
  ('celery','Celery','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('celery','Celeriac','HIGH','DERIVED','EXPERT_REVIEW',NULL),
  ('celery','Celery salt','HIGH','DERIVED','EXPERT_REVIEW',NULL),
  ('celery','Celery seed','HIGH','DERIVED','EXPERT_REVIEW',NULL),
  ('lupin','Lupin','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('lupin','Lupine','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('lupin','Lupin flour','HIGH','DERIVED','EXPERT_REVIEW',NULL),
  ('lupin','Lupini beans','HIGH','DERIVED','EXPERT_REVIEW',NULL),
  ('buckwheat','Buckwheat','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('buckwheat','Soba','MEDIUM','DERIVED','EXPERT_REVIEW','Soba noodles are buckwheat.'),
  ('buckwheat','Kasha','MEDIUM','DERIVED','EXPERT_REVIEW',NULL),
  ('corn','Corn','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('corn','Maize','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('corn','Cornstarch','HIGH','DERIVED','EXPERT_REVIEW',NULL),
  ('corn','Corn syrup','MEDIUM','DERIVED','EXPERT_REVIEW','Highly refined corn syrup is usually tolerated; verify.'),
  ('corn','Cornmeal','HIGH','DERIVED','EXPERT_REVIEW',NULL),
  ('corn','Corn flour','HIGH','DERIVED','EXPERT_REVIEW',NULL),
  ('corn','Polenta','MEDIUM','DERIVED','EXPERT_REVIEW',NULL),
  ('oat','Oat','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('oat','Oats','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('oat','Oatmeal','HIGH','DERIVED','EXPERT_REVIEW',NULL),
  ('oat','Oat flour','HIGH','DERIVED','EXPERT_REVIEW',NULL),
  ('oat','Avenin','MEDIUM','DERIVED','EXPERT_REVIEW','Oat protein.'),
  ('barley','Barley','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('barley','Pearl barley','HIGH','DERIVED','EXPERT_REVIEW',NULL),
  ('barley','Barley malt','MEDIUM','DERIVED','EXPERT_REVIEW','Bare "malt" is omitted — it fuzzy-collides with "salt".'),
  ('rye','Rye','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('rye','Rye flour','HIGH','DERIVED','EXPERT_REVIEW',NULL),
  ('rye','Pumpernickel','MEDIUM','DERIVED','EXPERT_REVIEW','Pumpernickel is a rye bread.'),
  ('sunflower_seed','Sunflower seed','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('sunflower_seed','Sunflower butter','HIGH','DERIVED','EXPERT_REVIEW',NULL),
  ('sunflower_seed','Sunflower kernel','HIGH','DERIVED','EXPERT_REVIEW',NULL),
  ('poppy_seed','Poppy seed','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('poppy_seed','Poppyseed','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('flaxseed','Flaxseed','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('flaxseed','Linseed','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('flaxseed','Ground flax','HIGH','DERIVED','EXPERT_REVIEW',NULL),
  ('chia_seed','Chia','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('chia_seed','Chia seed','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('lentil','Lentil','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('lentil','Lentils','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('lentil','Red lentil','HIGH','DERIVED','EXPERT_REVIEW',NULL),
  ('lentil','Dal','MEDIUM','DERIVED','EXPERT_REVIEW','Dal is usually lentils.'),
  ('chickpea','Chickpea','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('chickpea','Garbanzo','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('chickpea','Gram flour','HIGH','DERIVED','EXPERT_REVIEW',NULL),
  ('chickpea','Besan','MEDIUM','DERIVED','EXPERT_REVIEW','Besan is chickpea flour.'),
  ('chickpea','Aquafaba','MEDIUM','DERIVED','EXPERT_REVIEW','Chickpea water.'),
  ('pea','Pea','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('pea','Peas','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('pea','Pea protein','HIGH','DERIVED','EXPERT_REVIEW',NULL),
  ('pea','Green pea','HIGH','DERIVED','EXPERT_REVIEW',NULL),
  ('pea','Split pea','HIGH','DERIVED','EXPERT_REVIEW',NULL),
  ('pea','Pea flour','HIGH','DERIVED','EXPERT_REVIEW',NULL),
  ('coconut','Coconut','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('coconut','Coconut milk','HIGH','DERIVED','EXPERT_REVIEW',NULL),
  ('coconut','Coconut oil','MEDIUM','DERIVED','EXPERT_REVIEW',NULL),
  ('coconut','Coconut flour','HIGH','DERIVED','EXPERT_REVIEW',NULL),
  ('coconut','Copra','MEDIUM','DERIVED','EXPERT_REVIEW','Dried coconut.'),
  ('gelatin','Gelatin','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('gelatin','Gelatine','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('gelatin','Collagen','MEDIUM','DERIVED','EXPERT_REVIEW',NULL),
  ('kiwi','Kiwi','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('kiwi','Kiwifruit','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('banana','Banana','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('banana','Plantain','MEDIUM','DERIVED','EXPERT_REVIEW',NULL),
  ('avocado','Avocado','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('avocado','Guacamole','MEDIUM','DERIVED','EXPERT_REVIEW',NULL),
  ('peach','Peach','HIGH','DIRECT','EXPERT_REVIEW',NULL),
  ('peach','Nectarine','MEDIUM','DERIVED','EXPERT_REVIEW','Closely related stone fruit.'),
  ('mango','Mango','HIGH','DIRECT','EXPERT_REVIEW',NULL);

-- Tag each new allergen parent's name-matching term as its identity synonym so the
-- coverage test (every allergen parent has a major_allergen_identity term) passes.
-- Idempotent + scoped to allergen parents whose term equals their common name.
UPDATE synonyms SET claim_type='major_allergen_identity'
WHERE claim_type != 'major_allergen_identity'
  AND lower(term) = lower((SELECT p.common_name FROM parents p
                           WHERE p.parent_id = synonyms.parent_id AND p.domain='ALLERGEN'));
