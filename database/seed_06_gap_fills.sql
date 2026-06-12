-- =============================================================================
-- SEED 06 — GAP FILLS (adversarial-sweep findings)
-- Adds hidden synonyms the sweep surfaced as false negatives. Run in the build
-- pipeline AFTER seed_05 and BEFORE finalize (so normalized_term is populated).
-- match_class is set explicitly. DRAFT like the rest — pending validation.
--
-- SAFETY NOTE: generic dairy terms (Cheese/Butter/Cream) are matched to the milk
-- ALLERGEN here (previously only on the lactose parent — a milk-allergic user got
-- no warning on "cheese"). The runtime plant-word guard suppresses "coconut milk",
-- "cocoa butter", "cream of tartar", etc., so these do not create false positives.
-- =============================================================================

-- MILK — generic dairy forms the graph was missing -----------------------------
INSERT INTO synonyms (parent_id, term, match_class, confidence_level, source, cross_note) VALUES
  -- NOTE: generic Cheese/Butter/Cream live in seed_02_allergens.sql (milk parent);
  -- do not duplicate them here (was causing "Butter, Butter" in result aliases).
  ('milk','Quark','DERIVED','HIGH','FARE',NULL),
  ('milk','Kefir','DERIVED','HIGH','FARE',NULL),
  ('milk','Khoa','DERIVED','HIGH','EXPERT_REVIEW',NULL),
  ('milk','Mawa','DERIVED','HIGH','EXPERT_REVIEW',NULL),
  ('milk','Custard','DERIVED','MEDIUM','FARE',NULL),
  ('milk','Dulce de leche','DERIVED','HIGH','EXPERT_REVIEW',NULL),
  ('milk','Condensed milk','DERIVED','HIGH','FARE',NULL),
  ('milk','Evaporated milk','DERIVED','HIGH','FARE',NULL),
  ('milk','Sour cream','DERIVED','HIGH','FARE',NULL),
  ('milk','Clotted cream','DERIVED','HIGH','FARE',NULL),
  ('milk','Mascarpone','DERIVED','HIGH','FARE',NULL),
  ('milk','Ricotta','DERIVED','HIGH','FARE',NULL);

-- MILK — everyday fermented forms the graph was missing (review-confirmed FN:
-- "yogurt" returned no milk finding). Lactose row is POSSIBLE: fermentation
-- reduces (doesn't eliminate) lactose.
INSERT INTO synonyms (parent_id, term, match_class, confidence_level, source, cross_note) VALUES
  ('milk','Yogurt','DERIVED','HIGH','FARE',NULL),
  ('milk','Yoghurt','DERIVED','HIGH','FARE','Spelling variant.'),
  ('milk','Greek yogurt','DERIVED','HIGH','FARE',NULL),
  ('lactose','Yogurt','POSSIBLE','MEDIUM','EXPERT_REVIEW','Fermentation reduces but rarely eliminates lactose.');

-- EGG — protein names beyond the seeded set ------------------------------------
-- (Ovotransferrin/Conalbumin live in seed_02 — FARE canonical; do not duplicate.)
INSERT INTO synonyms (parent_id, term, match_class, confidence_level, source, cross_note) VALUES
  ('egg','Avidin','DERIVED','HIGH','EXPERT_REVIEW',NULL),
  ('egg','Apovitellin','DERIVED','HIGH','EXPERT_REVIEW',NULL);

-- WHEAT — regional / culinary names ('Farina' lives in seed_02) -----------------
INSERT INTO synonyms (parent_id, term, match_class, confidence_level, source, cross_note) VALUES
  ('wheat','Maida','DERIVED','HIGH','EXPERT_REVIEW',NULL),
  ('wheat','Atta','DERIVED','HIGH','EXPERT_REVIEW',NULL),
  ('wheat','Panko','DERIVED','HIGH','EXPERT_REVIEW',NULL),
  ('wheat','Freekeh','DERIVED','HIGH','EXPERT_REVIEW',NULL),
  ('wheat','Rusk','POSSIBLE','MEDIUM','EXPERT_REVIEW',NULL);

-- SOY -------------------------------------------------------------------------
INSERT INTO synonyms (parent_id, term, match_class, confidence_level, source, cross_note) VALUES
  ('soy','Kinako','DERIVED','HIGH','EXPERT_REVIEW',NULL);

-- TREE NUTS — botanical / foreign names ('Gianduja' lives in seed_02) ------------
INSERT INTO synonyms (parent_id, term, match_class, confidence_level, source, cross_note) VALUES
  ('cashew','Anacardium','DERIVED','HIGH','EXPERT_REVIEW',NULL),
  ('hazelnut','Noisette','DERIVED','HIGH','EXPERT_REVIEW',NULL);

-- FISH — named fish products ---------------------------------------------------
INSERT INTO synonyms (parent_id, term, match_class, confidence_level, source, cross_note) VALUES
  ('fish','Nam pla','DERIVED','HIGH','EXPERT_REVIEW',NULL),
  ('fish','Garum','DERIVED','HIGH','EXPERT_REVIEW',NULL),
  ('fish','Dashi','POSSIBLE','MEDIUM','EXPERT_REVIEW',NULL),
  ('fish','Bottarga','DERIVED','HIGH','EXPERT_REVIEW',NULL);

-- SESAME — foreign-language names ----------------------------------------------
INSERT INTO synonyms (parent_id, term, match_class, confidence_level, source, cross_note) VALUES
  ('sesame','Goma','DERIVED','HIGH','EXPERT_REVIEW',NULL),
  ('sesame','Ajonjoli','DERIVED','HIGH','EXPERT_REVIEW',NULL);
