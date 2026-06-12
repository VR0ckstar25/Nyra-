-- =============================================================================
-- SEED 05 — CROSS-SOURCE / COMPOSITE / GLOBAL TERMS + OPAQUE TERMS + SCAFFOLDS
-- Addresses adversarial review Issues 1 (composition), 3 (cross-source),
-- 4 (jurisdiction), 7/10 (unknown). All rows DRAFT, source EXPERT_REVIEW unless
-- noted, match_class POSSIBLE/AMBIGUOUS to signal "MAY contain" — never "Detected".
-- =============================================================================

-- 1. CROSS-SOURCE INGREDIENTS — modelled as MULTIPLE possible parents (Issue 3).
--    One physical term, several candidate origins; each gets its own edge.
INSERT INTO synonyms (parent_id, term, confidence_level, match_class, source, claim_type, cross_note) VALUES
  ('soy','Lecithin','LOW','AMBIGUOUS','EXPERT_REVIEW','cross_contaminant','Most bare "lecithin" is soy-derived; can be egg/sunflower (egg edge also modelled).'),
  ('soy','Tocopherols','LOW','AMBIGUOUS','EXPERT_REVIEW','cross_contaminant','Often soy-derived; can be sunflower/other. Verify.'),
  ('soy','Vitamin E','LOW','AMBIGUOUS','EXPERT_REVIEW','cross_contaminant','Frequently soy-derived tocopherols.'),
  ('soy','Mono- and diglycerides','LOW','AMBIGUOUS','EXPERT_REVIEW','cross_contaminant','Emulsifier; can be soy-, other-plant-, or animal-derived.'),
  ('milk','Mono- and diglycerides','LOW','AMBIGUOUS','EXPERT_REVIEW','cross_contaminant','Can be animal-fat-derived.'),
  ('milk','Enzymes','LOW','AMBIGUOUS','EXPERT_REVIEW','cross_contaminant','In cheese/dairy products may carry milk.'),
  ('milk','Cultures','LOW','AMBIGUOUS','EXPERT_REVIEW','cross_contaminant','Dairy cultures may carry milk.'),
  ('milk','Lactic acid','LOW','AMBIGUOUS','EXPERT_REVIEW','cross_contaminant','Usually fermented from sugar; occasionally dairy. Verify.'),
  -- hidden carriers that are also opaque (see section 4)
  ('soy','Hydrolyzed vegetable protein','MEDIUM','POSSIBLE','EXPERT_REVIEW','cross_contaminant','HVP is commonly soy-derived.'),
  ('wheat','Hydrolyzed vegetable protein','MEDIUM','POSSIBLE','EXPERT_REVIEW','cross_contaminant','HVP can be wheat-derived.');

-- 2. GLOBAL / CUISINE COMPOSITE TERMS (surfaced by the challenge corpus). These
--    are real label/menu terms that hide Big-9 allergens.
INSERT INTO synonyms (parent_id, term, confidence_level, match_class, source, claim_type, cross_note) VALUES
  ('milk','Paneer','HIGH','DERIVED','EXPERT_REVIEW','derivative','Fresh curdled-milk cheese.'),
  ('soy','Gochujang','MEDIUM','POSSIBLE','EXPERT_REVIEW','derivative','Korean chili paste; fermented soybean.'),
  ('wheat','Gochujang','MEDIUM','POSSIBLE','EXPERT_REVIEW','derivative','Often contains wheat/barley.'),
  ('sesame','Furikake','MEDIUM','POSSIBLE','EXPERT_REVIEW','derivative','Japanese rice seasoning; usually sesame.'),
  ('fish','Furikake','MEDIUM','POSSIBLE','EXPERT_REVIEW','derivative','Often contains bonito (fish).'),
  ('egg','Nougat','MEDIUM','POSSIBLE','EXPERT_REVIEW','derivative','Typically whipped egg white.'),
  ('almond','Nougat','MEDIUM','POSSIBLE','EXPERT_REVIEW','derivative','Often contains almonds/other nuts.'),
  ('fish','Kimchi','LOW','POSSIBLE','EXPERT_REVIEW','cross_contaminant','Often made with fish sauce.'),
  ('crustacean','Kimchi','LOW','POSSIBLE','EXPERT_REVIEW','cross_contaminant','Often made with salted shrimp.'),
  ('soy','Doenjang','MEDIUM','POSSIBLE','EXPERT_REVIEW','derivative','Korean soybean paste.'),
  ('soy','Hoisin','MEDIUM','POSSIBLE','EXPERT_REVIEW','derivative','Usually fermented soybean.');
-- ('wheat','Seitan',...) removed — canonical row lives in seed_02 (was a duplicate).

-- 3. OPAQUE TERMS — composite/unspecified; a scan hitting one yields UNKNOWN,
--    never "not found / safe" (Issue 1,7,10).
INSERT INTO opaque_terms (term, note) VALUES
  ('Natural flavors','May contain milk, soy, egg or others — source not declared.'),
  ('Natural flavoring','May contain undeclared allergens.'),
  ('Artificial flavors','May contain undeclared allergens.'),
  ('Flavoring','Unspecified; may hide allergens.'),
  ('Flavor','Unspecified; may hide allergens.'),
  ('Spices','Unspecified blend; may hide allergens (e.g. sesame, mustard).'),
  ('Spice','Unspecified; may hide allergens.'),
  ('Seasoning','Unspecified blend; may hide allergens.'),
  ('Seasoning blend','Composite; may contain soy, wheat, milk, sesame.'),
  ('Spice extract','Unspecified; may hide allergens.'),
  ('Vegetable oil','Unspecified oil; could include peanut/soy/sesame.'),
  ('Vegetable broth','Composite; may contain undeclared allergens.'),
  ('Hydrolyzed vegetable protein','Commonly soy- or wheat-derived; source not always declared.'),
  ('Hydrolyzed plant protein','Commonly soy- or wheat-derived.'),
  ('Modified food starch','Source grain not always declared (may be wheat).'),
  ('Starch','Unspecified source (may be wheat).'),
  ('Emulsifier','Unspecified; may be soy/egg lecithin or animal-derived.'),
  ('Enzymes','Unspecified; may carry milk in dairy contexts.'),
  ('Cultures','Unspecified; may carry milk.');

-- 4. REGULATORY JURISDICTION — EU scaffold (Issue 4). Molluscs ARE a major
--    allergen in the EU/UK even though not FDA-major. (US rows are populated in
--    finalize from parents.regulatory_major_allergen.)
INSERT INTO regulatory_jurisdiction (parent_id, jurisdiction, is_major, basis) VALUES
  ('mollusc','EU',1,'EU FIC Regulation 1169/2011 Annex II — molluscs are a declarable allergen.'),
  ('mollusc','UK',1,'UK FIC (retained EU law) — molluscs declarable.');
-- NOTE: EU/UK also require mustard, celery, lupin and sulphites as major
-- allergens. Those are FUTURE PARENTS — add to `parents` (domain ALLERGEN) with
-- their own synonym graphs before enabling an EU/UK build. Not present at launch.

-- 5. INGREDIENT_DERIVATIVES — SCAFFOLD ONLY (Issue 1). Demonstrates the
--    composite->parent model the synonym graph cannot express. Needs sourcing.
INSERT INTO ingredient_derivatives (composite_term, parent_id, source_strength, confidence, note) VALUES
  ('Seasoning blend','soy','SOMETIMES','LOW','SCAFFOLD — needs label-composition sourcing.'),
  ('Seasoning blend','wheat','SOMETIMES','LOW','SCAFFOLD — needs sourcing.'),
  ('Natural flavors','milk','RARELY','LOW','SCAFFOLD — needs sourcing.');
