-- =============================================================================
-- SEED 07 — GAP FILLS v2 (2026-06-18 pre-launch probe sweep)
-- Common real-world product/dish names that resolve to a Big-9 allergen but were
-- missing. Run AFTER seed_06, BEFORE finalize. DRAFT like the rest.
-- match_class: DERIVED = made from / reliably contains it; POSSIBLE = usually but
-- not always (recipe-dependent) → surfaces as "May contain".
-- =============================================================================

-- SESAME ----------------------------------------------------------------------
INSERT INTO synonyms (parent_id, term, match_class, confidence_level, source, cross_note) VALUES
  ('sesame','Halva','DERIVED','HIGH','EXPERT_REVIEW','Sesame-paste confection (tahini-based).'),
  ('sesame','Gomashio','DERIVED','HIGH','EXPERT_REVIEW','Toasted sesame + salt seasoning.'),
  ('sesame','Gomasio','DERIVED','HIGH','EXPERT_REVIEW','Spelling variant of gomashio.');

-- FISH (hidden anchovy / fish-stock dishes) -----------------------------------
INSERT INTO synonyms (parent_id, term, match_class, confidence_level, source, cross_note) VALUES
  ('fish','Worcestershire','POSSIBLE','MEDIUM','EXPERT_REVIEW','Traditionally contains anchovies.'),
  ('fish','Bouillabaisse','DERIVED','HIGH','EXPERT_REVIEW','Fish stew.');

-- TREE NUTS (almond confections) ----------------------------------------------
INSERT INTO synonyms (parent_id, term, match_class, confidence_level, source, cross_note) VALUES
  ('almond','Frangipane','DERIVED','HIGH','EXPERT_REVIEW','Almond cream/paste filling.'),
  ('almond','Amaretto','POSSIBLE','MEDIUM','EXPERT_REVIEW','Almond liqueur; some use apricot kernel.'),
  ('almond','Amaretti','DERIVED','HIGH','EXPERT_REVIEW','Almond macaroons.');

-- EGG (egg-based dishes / emulsions) ------------------------------------------
INSERT INTO synonyms (parent_id, term, match_class, confidence_level, source, cross_note) VALUES
  ('egg','Frittata','DERIVED','HIGH','EXPERT_REVIEW','Egg-based dish.'),
  ('egg','Aioli','POSSIBLE','MEDIUM','EXPERT_REVIEW','Often emulsified with egg yolk.'),
  ('egg','Quiche','DERIVED','HIGH','EXPERT_REVIEW','Egg custard tart.');
