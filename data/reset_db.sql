-- reset_db.sql : Réinitialisation complète de la base

-- Supprime toutes les tables si elles existent
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `review`;
DROP TABLE IF EXISTS `order_line`;
DROP TABLE IF EXISTS `order`;
DROP TABLE IF EXISTS `product`;
DROP TABLE IF EXISTS `user`;
DROP TABLE IF EXISTS `doctrine_migration_versions`;
SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------
-- Table doctrine_migration_versions
-- --------------------------------------------------------
CREATE TABLE `doctrine_migration_versions` (
  `version` varchar(191) NOT NULL,
  `executed_at` datetime DEFAULT NULL,
  `execution_time` int(11) DEFAULT NULL,
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

INSERT INTO `doctrine_migration_versions` (`version`, `executed_at`, `execution_time`) VALUES
('DoctrineMigrations\\Version20230207211228', '2023-02-07 22:13:21', 166),
('DoctrineMigrations\\Version20230207214603', '2023-02-08 00:00:17', 245),
('DoctrineMigrations\\Version20230207230118', '2023-02-08 00:01:31', 56);

-- --------------------------------------------------------
-- Table user
-- --------------------------------------------------------
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(180) NOT NULL,
  `roles` longtext NOT NULL CHECK (json_valid(`roles`)),
  `password` varchar(255) NOT NULL,
  `firstname` varchar(255) NOT NULL,
  `lastname` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQ_8D93D649E7927C74` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `user` (`id`, `email`, `roles`, `password`, `firstname`, `lastname`) VALUES
(7, 'celine.thomas@free.fr', '[]', '$2y$13$88jXzRWcPpN.jJsS2kqZceSs2FnF2RFDa1OIVyD8YwmlNonoh1/5q', 'Celine', 'THOMAS'),
(8, 'marc.dupont@gmail.com', '[]', '$2y$13$1O3aoeSUjXGRoph5gtmb6OWS7FOFJh28GMyvOMtPYtJVuiK.hYTdy', 'Marc', 'DUPONT'),
(9, 'test@test.fr', '[]', '$2y$13$hH1.0ex/hhGFt5qjqTImJ.d8mGuqmAkjSFYtjvfzDQGfUTqJNHylm', 'Em', 'Cam'),
(10, 'test2@test.fr', '[]', '$2y$13$6jvi1adLxsB9wk6TekaQ3u/ec/gIqVVao91AoGxMnMnJBmTznETea', 'test', 'test'),
(11, 'test3@test.fr', '[]', '$2y$13$5X5OtBkCMEbciL8J9YuIsutsP476BZZokVeLk5e9CtTeDFva0O.NC', 'Test', 'Test');

-- --------------------------------------------------------
-- Table product
-- --------------------------------------------------------
CREATE TABLE `product` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `available_stock` int(11) NOT NULL,
  `skin` varchar(255) DEFAULT NULL,
  `aromas` varchar(255) DEFAULT NULL,
  `ingredients` varchar(255) DEFAULT NULL,
  `description` longtext DEFAULT NULL,
  `price` double NOT NULL,
  `picture` varchar(255) NOT NULL,
  `varieties` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `product` (`id`, `name`, `available_stock`, `skin`, `aromas`, `ingredients`, `description`, `price`, `picture`, `varieties`) VALUES
(3, 'Sentiments printaniers', -8, 'Propre, fraîche', 'Frais et fruité', 'Framboise, zeste de citron et feuille de menthe', 'Savon avec une formule douce à base d’huile de framboise, de citron et de menthe qui nettoie les mains efficacement sans les dessécher.', 60, 'https://cdn.pixabay.com/photo/2020/02/08/10/35/soap-4829708_960_720.jpg', 4),
(4, 'Chuchotements d\'été', 0, 'Sèche', 'Nature et végétal', 'Huile d\'olive, glycérine végétale', 'Savon surgras à l\'huile d\'olive, particulièrement utile contre la peau sèche.', 37, 'https://cdn.pixabay.com/photo/2017/09/07/19/43/soap-2726387_960_720.jpg', 6),
(5, 'Poussière de lune', 23, 'Peau grasse', 'Musc', 'Huiles végétales', 'Essayez notre savon aujourd\'hui pour une expérience de bain rafraîchissante et revitalisante.', 9.99, 'https://cdn.pixabay.com/photo/2016/07/11/15/45/soap-1509963_960_720.jpg', 6),
(6, 'Dans la forêt', 12, 'Peau mixte', 'Bois de santal', 'Soude caustique', 'La mousse riche et onctueuse nettoie en profondeur en laissant votre peau douce et hydratée.', 24, 'https://cdn.pixabay.com/photo/2015/01/06/02/56/soap-589824_960_720.jpg', 9),
(7, 'Extrait de nature', 4, 'Peau sensible', 'Eucalyptuse, Menthe poivrée', 'Herbes et pétales de fleurs', 'Ce savon est doux pour votre peau et convient à tous les types de peau. ', 5, 'https://cdn.pixabay.com/photo/2017/09/07/19/40/soap-2726378_960_720.jpg', 4),
(8, 'Milkyway', 6, 'Mature', 'Lavande, rose', 'Huiles essentielles', 'Savon fabriqué à partir d\'ingrédients naturels tels que l\'huile d\'olive, la cire d\'abeille et l\'huile essentielle de lavande.', 15, 'https://cdn.pixabay.com/photo/2018/01/07/04/21/lavender-3066531_960_720.jpg', 7),
(9, 'Mousse de rêve', 14, 'Peau normale', 'Fleur d\'oranger', 'Cire d\'abeilles', 'Le parfum délicat de lavande vous transporte dans un jardin en fleurs.', 10, 'https://cdn.pixabay.com/photo/2018/01/30/16/54/herbs-3119132_960_720.jpg', 3),
(10, 'Aurore boréale', 19, 'Irritée', 'Vanille', 'Agile verte', 'Ses propriétés apaisantes aident à calmer les nerfs et à améliorer votre bien-être général.', 26, 'https://cdn.pixabay.com/photo/2017/05/22/07/34/soap-2333391_960_720.jpg', 3);

-- --------------------------------------------------------
-- Table order
-- --------------------------------------------------------
CREATE TABLE `order` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `owner_id` int(11) NOT NULL,
  `firstname` varchar(255) DEFAULT NULL,
  `lastname` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `zip_code` varchar(5) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `validated` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_F52993987E3C61F9` (`owner_id`),
  CONSTRAINT `FK_F52993987E3C61F9` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `order` (`id`, `owner_id`, `firstname`, `lastname`, `address`, `zip_code`, `city`, `date`, `validated`) VALUES
(6, 8, 'Marc', 'DUPONT', '1 rue du test', '54000', 'NANCY', '2023-02-12', 1),
(7, 8, NULL, NULL, NULL, NULL, NULL, NULL, 0),
(8, 9, 'Em', 'Cam', '25 rue de la terre', '54000', 'nancy', '2023-02-12', 1),
(9, 9, NULL, NULL, NULL, NULL, NULL, NULL, 0),
(10, 10, 'test', 'test', '12 rue du paradis', '75000', 'Paris', '2023-03-05', 1),
(11, 7, NULL, NULL, NULL, NULL, NULL, NULL, 0),
(12, 10, 'test', 'test', 'nfdsdf', '75000', 'sdf', '2023-03-05', 1),
(13, 10, NULL, NULL, NULL, NULL, NULL, NULL, 0);

-- --------------------------------------------------------
-- Table order_line
-- --------------------------------------------------------
CREATE TABLE `order_line` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `linked_order_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_9CE58EE14584665A` (`product_id`),
  KEY `IDX_9CE58EE1E39F23E7` (`linked_order_id`),
  CONSTRAINT `FK_9CE58EE14584665A` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`),
  CONSTRAINT `FK_9CE58EE1E39F23E7` FOREIGN KEY (`linked_order_id`) REFERENCES `order` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `order_line` (`id`, `product_id`, `linked_order_id`, `quantity`) VALUES
(24, 4, 6, 1),
(26, 8, 6, 2),
(28, 3, 8, 11),
(37, 5, 10, 1),
(38, 5, 12, 22),
(40, 3, 11, 4),
(41, 4, 13, 1);

-- --------------------------------------------------------
-- Table review
-- --------------------------------------------------------
CREATE TABLE `review` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `author_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `title` varchar(255) NOT NULL,
  `comment` varchar(500) DEFAULT NULL,
  `rating` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_794381C6F675F31B` (`author_id`),
  CONSTRAINT `FK_794381C6F675F31B` FOREIGN KEY (`author_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `review` (`id`, `author_id`, `date`, `title`, `comment`, `rating`) VALUES
(6, 7, '2023-02-12', 'Produits au top !', 'J\'aime beaucoup les savons proposés par EcoBlissBath !', 5),
(7, 8, '2023-02-12', 'Bien', 'Bien, mais un peu cher', 4),
(10, 10, '2023-03-05', 'J\'adore !', 'J\'adore l\'odeur des produits !', 5);