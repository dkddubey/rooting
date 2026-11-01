-- =====================================================================
-- RootsConnect: Recursive Common Table Expressions (CTEs)
-- High-performance ancestral tree graph traversal and kinship discovery
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Fetch Complete Ancestor Pedigree (Ascendant Tree) for a Given User/Ancestor
-- Traverses up through father_id and mother_id to any depth.
-- ---------------------------------------------------------------------
WITH RECURSIVE ancestor_pedigree AS (
    -- Anchor member: Start with root ancestor(s)
    SELECT 
        id,
        user_id,
        first_name,
        last_name,
        gender,
        birth_year,
        death_year,
        birth_place,
        father_id,
        mother_id,
        spouse_id,
        0 AS generation_depth,
        ARRAY[id] AS lineage_path
    FROM ancestors
    WHERE id = :target_ancestor_id

    UNION ALL

    -- Recursive member: Move upward to parents
    SELECT 
        parent.id,
        parent.user_id,
        parent.first_name,
        parent.last_name,
        parent.gender,
        parent.birth_year,
        parent.death_year,
        parent.birth_place,
        parent.father_id,
        parent.mother_id,
        parent.spouse_id,
        tree.generation_depth + 1 AS generation_depth,
        tree.lineage_path || parent.id AS lineage_path
    FROM ancestors parent
    JOIN ancestor_pedigree tree 
      ON (parent.id = tree.father_id OR parent.id = tree.mother_id)
    -- Cycle prevention
    WHERE NOT (parent.id = ANY(tree.lineage_path))
)
SELECT * FROM ancestor_pedigree ORDER BY generation_depth ASC;


-- ---------------------------------------------------------------------
-- 2. Fetch All Descendants (Children, Grandchildren, etc.)
-- Traverses downward where an ancestor is referenced as father_id or mother_id.
-- ---------------------------------------------------------------------
WITH RECURSIVE descendant_tree AS (
    -- Anchor member: The patriarch or matriarch
    SELECT 
        id,
        user_id,
        first_name,
        last_name,
        gender,
        birth_year,
        father_id,
        mother_id,
        0 AS descendant_depth,
        ARRAY[id] AS path
    FROM ancestors
    WHERE id = :patriarch_ancestor_id

    UNION ALL

    -- Recursive member: Find children who have this person as father or mother
    SELECT 
        child.id,
        child.user_id,
        child.first_name,
        child.last_name,
        child.gender,
        child.birth_year,
        child.father_id,
        child.mother_id,
        d.descendant_depth + 1 AS descendant_depth,
        d.path || child.id AS path
    FROM ancestors child
    JOIN descendant_tree d 
      ON (child.father_id = d.id OR child.mother_id = d.id)
    WHERE NOT (child.id = ANY(d.path))
)
SELECT * FROM descendant_tree ORDER BY descendant_depth ASC;


-- ---------------------------------------------------------------------
-- 3. Find Lowest Common Ancestor (LCA) Between Two Users' Trees
-- Traverses upward from both ancestors to find the first intersection point.
-- ---------------------------------------------------------------------
WITH RECURSIVE 
tree_a AS (
    SELECT id, father_id, mother_id, 0 AS depth_a, ARRAY[id] AS path_a
    FROM ancestors WHERE id = :ancestor_a_id
    UNION ALL
    SELECT p.id, p.father_id, p.mother_id, tree_a.depth_a + 1, tree_a.path_a || p.id
    FROM ancestors p
    JOIN tree_a ON (p.id = tree_a.father_id OR p.id = tree_a.mother_id)
    WHERE NOT (p.id = ANY(tree_a.path_a))
),
tree_b AS (
    SELECT id, father_id, mother_id, 0 AS depth_b, ARRAY[id] AS path_b
    FROM ancestors WHERE id = :ancestor_b_id
    UNION ALL
    SELECT p.id, p.father_id, p.mother_id, tree_b.depth_b + 1, tree_b.path_b || p.id
    FROM ancestors p
    JOIN tree_b ON (p.id = tree_b.father_id OR p.id = tree_b.mother_id)
    WHERE NOT (p.id = ANY(tree_b.path_b))
)
SELECT 
    lca.id AS common_ancestor_id,
    anc.first_name,
    anc.last_name,
    anc.birth_year,
    anc.birth_place,
    tree_a.depth_a AS generations_from_a,
    tree_b.depth_b AS generations_from_b,
    (tree_a.depth_a + tree_b.depth_b) AS total_graph_distance,
    CASE
        WHEN tree_a.depth_a = 0 AND tree_b.depth_b = 0 THEN 'Same Person'
        WHEN tree_a.depth_a = 1 AND tree_b.depth_b = 1 THEN 'Siblings'
        WHEN tree_a.depth_a = 1 AND tree_b.depth_b = 2 THEN 'Aunt/Uncle & Nephew/Niece'
        WHEN tree_a.depth_a = 2 AND tree_b.depth_b = 1 THEN 'Nephew/Niece & Aunt/Uncle'
        WHEN tree_a.depth_a = 2 AND tree_b.depth_b = 2 THEN 'First Cousins'
        WHEN tree_a.depth_a = 2 AND tree_b.depth_b = 3 THEN 'First Cousins Once Removed'
        WHEN tree_a.depth_a = 3 AND tree_b.depth_b = 2 THEN 'First Cousins Once Removed'
        WHEN tree_a.depth_a = 3 AND tree_b.depth_b = 3 THEN 'Second Cousins'
        WHEN tree_a.depth_a = 4 AND tree_b.depth_b = 4 THEN 'Third Cousins'
        ELSE CONCAT('Cousins (', LEAST(tree_a.depth_a, tree_b.depth_b) - 1, 'th degree, ', ABS(tree_a.depth_a - tree_b.depth_b), ' removed)')
    END AS kinship_relationship
FROM tree_a
JOIN tree_b ON tree_a.id = tree_b.id
JOIN ancestors anc ON anc.id = tree_a.id
ORDER BY (tree_a.depth_a + tree_b.depth_b) ASC
LIMIT 1;

