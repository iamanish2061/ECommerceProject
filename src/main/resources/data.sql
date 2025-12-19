INSERT INTO brands (name, slug, logo_url) VALUES
('Beardo',                 'beardo',                 '/uploads/brands/beardo.png'),
('Ustraa',                 'ustraa',                 '/uploads/brands/ustraa.png'),
('L''Oréal Professionnel',  'loreal-professionnel',   '/uploads/brands/loreal-professionnel.png'),
('Kérastase',              'kerastase',              '/uploads/brands/kerastase.png'),
('Olaplex',                'olaplex',                '/uploads/brands/olaplex.png'),
('Minimalist',             'minimalist',             '/uploads/brands/minimalist.png'),
('Arata',                  'arata',                  '/uploads/brands/arata.png'),
('Garnier',                 'garnier',              '/uploads/brands/garnier.png'),
('The Man Company',        'the-man-company',        '/uploads/brands/the-man-company.png'),
('Plum Goodness',          'plum-goodness',          '/uploads/brands/plum.png');


INSERT INTO categories (name, slug, parent_id, image_url) VALUES
('Hair Care',           'hair-care',        NULL, '/uploads/categories/hair-care.jpg'),
('Beard & Moustache',   'beard-moustache',  NULL, '/uploads/categories/beard-moustache.jpg'),
('Color & Treatments',  'color-treatments', NULL, '/uploads/categories/color-treatments.jpg'),

('Shampoo & Cleansers',     'shampoo-cleansers',     1, '/uploads/categories/shampoo-cleansers.jpg'),
('Conditioner & Masks',     'conditioner-masks',     1, '/uploads/categories/conditioner-masks.jpg'),
('Hair Oil & Serum',        'hair-oil-serum',        1, '/uploads/categories/hair-oil-serum.jpg'),

('Beard Oil & Balm',        'beard-oil-balm',        2, '/uploads/categories/beard-oil-balm.jpg'),
('Beard Wash & Softener',   'beard-wash-softener',   2, '/uploads/categories/beard-wash-softener.jpg'),
('Beard Growth & Trim',     'beard-growth-trim',     2, '/uploads/categories/beard-growth-trim.jpg'),

('Hair Color',              'hair-color',            3, '/uploads/categories/hair-color.jpg'),
('Keratin & Smoothing',     'keratin-smoothing',     3, '/uploads/categories/keratin-smoothing.jpg'),
('Repair & Bond Builder',   'repair-bond-builder',   3, '/uploads/categories/repair-bond-builder.jpg');


INSERT INTO tags (name, slug) VALUES
('For Curly Hair',       'for-curly-hair'),
('For Straight Hair',    'for-straight-hair'),
('Anti Hair Fall',       'anti-hair-fall'),
('Dandruff Control',     'dandruff-control'),
('Damaged Hair Repair',  'damaged-hair-repair'),
('Hair Growth',          'hair-growth'),

('Beard Growth',         'beard-growth'),
('Beard Softener',       'beard-softener'),
('Non-Greasy Beard',     'non-greasy-beard'),

('Sulfate-Free',         'sulfate-free'),
('Paraben-Free',         'paraben-free'),
('Silicone-Free',        'silicone-free'),
('100% Natural',         '100-natural'),
('Vegan',                'vegan'),
('Cruelty-Free',         'cruelty-free'),

('For Men',              'for-men'),
('For Women',            'for-women'),
('Unisex',               'unisex'),

('Salon Professional',   'salon-professional'),
('Bond Builder',         'bond-builder'),
('Keratin Treatment',    'keratin-treatment'),
('Color Safe',           'color-safe'),
('Best Seller',          'best-seller'),
('New Arrival',          'new-arrival'),
('On Sale',              'on-sale'),

('Volume & Thickness',   'volume-thickness'),
('Shine & Smooth',       'shine-smooth'),
('Scalp Care',           'scalp-care');
