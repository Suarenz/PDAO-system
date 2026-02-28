-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: pdao_db_new
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `action_type` enum('login','logout','created','updated','deleted','restored','approved','rejected','exported','imported','backup','restore') NOT NULL,
  `model_type` varchar(255) DEFAULT NULL,
  `model_id` bigint(20) unsigned DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `activity_logs_user_id_index` (`user_id`),
  KEY `activity_logs_action_type_index` (`action_type`),
  KEY `activity_logs_model_type_model_id_index` (`model_type`,`model_id`),
  KEY `activity_logs_created_at_index` (`created_at`),
  CONSTRAINT `activity_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
INSERT INTO `activity_logs` VALUES (1,1,'deleted',NULL,NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Cleared 29 activity logs','2026-02-06 00:26:49','2026-02-06 00:26:49'),(2,1,'created','App\\Models\\PwdProfile',4,NULL,'{\"pwd_number\":null,\"first_name\":\"Kate Ashley\",\"last_name\":\"Macasaet\",\"middle_name\":null,\"suffix\":null,\"date_applied\":\"2026-02-05T16:00:00.000000Z\",\"status\":\"ACTIVE\",\"current_version\":1,\"remarks\":null,\"accessibility_needs\":null,\"service_needs\":null,\"updated_at\":\"2026-02-06T00:34:58.000000Z\",\"created_at\":\"2026-02-06T00:34:58.000000Z\",\"id\":4}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Created PwdProfile: Kate Ashley Macasaet','2026-02-06 00:34:58','2026-02-06 00:34:58'),(3,1,'created','App\\Models\\Backup',9,NULL,'{\"file_name\":\"pdao_backup_2026-02-06_105817.sql\",\"file_path\":\"pdao_backup_2026-02-06_105817.sql\",\"status\":\"IN_PROGRESS\",\"notes\":\"Manual backup created from dashboard\",\"created_by\":1,\"updated_at\":\"2026-02-06T02:58:17.000000Z\",\"created_at\":\"2026-02-06T02:58:17.000000Z\",\"id\":9}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Created Backup: 9','2026-02-06 02:58:17','2026-02-06 02:58:17');
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activity_logs_archive`
--

DROP TABLE IF EXISTS `activity_logs_archive`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_logs_archive` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `archive_month` varchar(7) NOT NULL,
  `original_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `action_type` varchar(255) NOT NULL,
  `model_type` varchar(255) DEFAULT NULL,
  `model_id` bigint(20) unsigned DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `original_created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `activity_logs_archive_archive_month_index` (`archive_month`),
  KEY `activity_logs_archive_user_id_index` (`user_id`),
  KEY `activity_logs_archive_action_type_index` (`action_type`),
  KEY `activity_logs_archive_model_type_model_id_index` (`model_type`,`model_id`),
  KEY `activity_logs_archive_original_created_at_index` (`original_created_at`),
  CONSTRAINT `activity_logs_archive_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=80 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs_archive`
--

LOCK TABLES `activity_logs_archive` WRITE;
/*!40000 ALTER TABLE `activity_logs_archive` DISABLE KEYS */;
INSERT INTO `activity_logs_archive` VALUES (1,'2026-02',1,NULL,'created','App\\Models\\User',1,NULL,'{\"id_number\":\"admin\",\"first_name\":\"Admin\",\"last_name\":\"User\",\"role\":\"ADMIN\",\"status\":\"ACTIVE\",\"updated_at\":\"2026-02-04T05:11:30.000000Z\",\"created_at\":\"2026-02-04T05:11:30.000000Z\",\"id\":1}','127.0.0.1','Symfony','Created User: Admin User','2026-02-04 05:11:30','2026-02-04 08:02:28','2026-02-04 08:02:28'),(2,'2026-02',2,NULL,'created','App\\Models\\User',2,NULL,'{\"id_number\":\"staff\",\"first_name\":\"Staff\",\"last_name\":\"User\",\"role\":\"STAFF\",\"status\":\"ACTIVE\",\"updated_at\":\"2026-02-04T05:11:31.000000Z\",\"created_at\":\"2026-02-04T05:11:31.000000Z\",\"id\":2}','127.0.0.1','Symfony','Created User: Staff User','2026-02-04 05:11:31','2026-02-04 08:02:28','2026-02-04 08:02:28'),(3,'2026-02',3,NULL,'created','App\\Models\\User',3,NULL,'{\"id_number\":\"mayor\",\"first_name\":\"Mayor\",\"last_name\":\"User\",\"role\":\"ADMIN\",\"status\":\"ACTIVE\",\"updated_at\":\"2026-02-04T05:11:31.000000Z\",\"created_at\":\"2026-02-04T05:11:31.000000Z\",\"id\":3}','127.0.0.1','Symfony','Created User: Mayor User','2026-02-04 05:11:31','2026-02-04 08:02:28','2026-02-04 08:02:28'),(4,'2026-02',4,NULL,'created','App\\Models\\User',4,NULL,'{\"id_number\":\"user\",\"first_name\":\"Regular\",\"last_name\":\"User\",\"role\":\"USER\",\"status\":\"ACTIVE\",\"updated_at\":\"2026-02-04T05:11:31.000000Z\",\"created_at\":\"2026-02-04T05:11:31.000000Z\",\"id\":4}','127.0.0.1','Symfony','Created User: Regular User','2026-02-04 05:11:31','2026-02-04 08:02:28','2026-02-04 08:02:28'),(5,'2026-02',5,NULL,'login','App\\Models\\User',1,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','User logged in: Admin User','2026-02-04 05:15:07','2026-02-04 08:02:28','2026-02-04 08:02:28'),(6,'2026-02',6,NULL,'updated','App\\Models\\User',1,'{\"password\":\"$2y$12$etIInBB0XSa8O4s3Q8pdjeUwtAMcyem4UE7AUbt99YDtDIEoXPpe.\"}','{\"password\":\"$2y$12$Am4e6fOmy5QVv\\/73qTgoM.F5GUdmN7vlCq1UZWufqwsvPJ6hF2ARa\"}','127.0.0.1','Symfony','Updated User: Admin User','2026-02-04 05:27:01','2026-02-04 08:02:28','2026-02-04 08:02:28'),(7,'2026-02',7,NULL,'updated','App\\Models\\User',2,'{\"password\":\"$2y$12$g6VtJzTP7ku7oKb8QkWcl.KlgzYWkog8eybBSgzOgHLDQ\\/.pIpew6\"}','{\"password\":\"$2y$12$UF6pXB41HiqiWkrcPhd8VORvd4MLWgxC1QpmCm9MFaC.yLvPZFWua\"}','127.0.0.1','Symfony','Updated User: Staff User','2026-02-04 05:27:01','2026-02-04 08:02:28','2026-02-04 08:02:28'),(8,'2026-02',8,NULL,'updated','App\\Models\\User',3,'{\"password\":\"$2y$12$iP540vfqXRI05jXmRHKF6.JEO.XJu71.G.ejAT.b9CF6yw.k0.j\\/.\"}','{\"password\":\"$2y$12$kTsJc1AiisA2LZeH9bSk..61U1gQFYw8BWxbmjzvPVyRi295V.a\\/q\"}','127.0.0.1','Symfony','Updated User: Mayor User','2026-02-04 05:27:01','2026-02-04 08:02:28','2026-02-04 08:02:28'),(9,'2026-02',9,NULL,'updated','App\\Models\\User',4,'{\"password\":\"$2y$12$KMaHK2uGRGK1K67No\\/AMmue6fS1fL76FIzoLwSwhYhH6XSnLHXqf.\"}','{\"password\":\"$2y$12$GdsZcUc\\/IpTSMMwjrkg4O.Njwjvqmi4bvjTY.ACIFR7A4bs2VCFDG\"}','127.0.0.1','Symfony','Updated User: Regular User','2026-02-04 05:27:02','2026-02-04 08:02:28','2026-02-04 08:02:28'),(10,'2026-02',10,NULL,'updated','App\\Models\\User',1,'{\"password\":\"$2y$12$Am4e6fOmy5QVv\\/73qTgoM.F5GUdmN7vlCq1UZWufqwsvPJ6hF2ARa\"}','{\"password\":\"$2y$12$ohwrxLc9lFqgUX.fqrKwLeaw2X0cVqgkuCuuAOK3kAivGZ2k6MYwK\"}','127.0.0.1','Symfony','Updated User: Admin User','2026-02-04 05:27:14','2026-02-04 08:02:28','2026-02-04 08:02:28'),(11,'2026-02',11,NULL,'updated','App\\Models\\User',2,'{\"password\":\"$2y$12$UF6pXB41HiqiWkrcPhd8VORvd4MLWgxC1QpmCm9MFaC.yLvPZFWua\"}','{\"password\":\"$2y$12$E01K2KEWQPqfsS4\\/6sowVeNQmea8aa9.d3mM\\/Lnro.yDy8YmlpBm6\"}','127.0.0.1','Symfony','Updated User: Staff User','2026-02-04 05:27:14','2026-02-04 08:02:28','2026-02-04 08:02:28'),(12,'2026-02',12,NULL,'updated','App\\Models\\User',3,'{\"password\":\"$2y$12$kTsJc1AiisA2LZeH9bSk..61U1gQFYw8BWxbmjzvPVyRi295V.a\\/q\"}','{\"password\":\"$2y$12$QZjWaWkbma5H\\/oWWLBKsh.sM4eLGz72bAeMnIiYvWUGG3YI.vvP4e\"}','127.0.0.1','Symfony','Updated User: Mayor User','2026-02-04 05:27:15','2026-02-04 08:02:28','2026-02-04 08:02:28'),(13,'2026-02',13,NULL,'updated','App\\Models\\User',4,'{\"password\":\"$2y$12$GdsZcUc\\/IpTSMMwjrkg4O.Njwjvqmi4bvjTY.ACIFR7A4bs2VCFDG\"}','{\"password\":\"$2y$12$oWJI3XuvRWDhNcseBRHpYeRmGa4cogbG9OJih1Q.kQ4MR3nkSHEs2\"}','127.0.0.1','Symfony','Updated User: Regular User','2026-02-04 05:27:16','2026-02-04 08:02:29','2026-02-04 08:02:29'),(14,'2026-02',14,1,'logout','App\\Models\\User',1,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','User logged out: Admin User','2026-02-04 05:28:53','2026-02-04 08:02:29','2026-02-04 08:02:29'),(15,'2026-02',15,NULL,'login','App\\Models\\User',4,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','User logged in: Regular User','2026-02-04 05:29:05','2026-02-04 08:02:29','2026-02-04 08:02:29'),(16,'2026-02',16,4,'logout','App\\Models\\User',4,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','User logged out: Regular User','2026-02-04 05:29:16','2026-02-04 08:02:29','2026-02-04 08:02:29'),(17,'2026-02',17,NULL,'login','App\\Models\\User',1,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','User logged in: Admin User','2026-02-04 05:29:22','2026-02-04 08:02:29','2026-02-04 08:02:29'),(18,'2026-02',18,1,'logout','App\\Models\\User',1,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','User logged out: Admin User','2026-02-04 05:29:31','2026-02-04 08:02:29','2026-02-04 08:02:29'),(19,'2026-02',19,NULL,'login','App\\Models\\User',4,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','User logged in: Regular User','2026-02-04 05:29:36','2026-02-04 08:02:29','2026-02-04 08:02:29'),(20,'2026-02',20,4,'created','App\\Models\\PwdProfile',1,NULL,'{\"pwd_number\":null,\"first_name\":\"Jan Reinnen\",\"last_name\":\"Calapao\",\"middle_name\":\"Suarez\",\"suffix\":null,\"date_applied\":\"2026-02-03T16:00:00.000000Z\",\"status\":\"PENDING\",\"current_version\":1,\"remarks\":\"hahahaha\",\"accessibility_needs\":\"Wheel chair\",\"service_needs\":\"Medical Assurance\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"id\":1}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Created PwdProfile: Jan Reinnen Suarez Calapao','2026-02-04 05:34:10','2026-02-04 08:02:29','2026-02-04 08:02:29'),(21,'2026-02',21,4,'created','App\\Models\\PendingRegistration',1,NULL,'{\"pwd_profile_id\":1,\"user_id\":4,\"submission_type\":\"NEW\",\"status\":\"PENDING\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"id\":1}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Created PendingRegistration: 1','2026-02-04 05:34:10','2026-02-04 08:02:29','2026-02-04 08:02:29'),(22,'2026-02',22,4,'logout','App\\Models\\User',4,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','User logged out: Regular User','2026-02-04 05:34:16','2026-02-04 08:02:29','2026-02-04 08:02:29'),(23,'2026-02',23,NULL,'login','App\\Models\\User',1,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','User logged in: Admin User','2026-02-04 05:34:19','2026-02-04 08:02:29','2026-02-04 08:02:29'),(24,'2026-02',24,1,'updated','App\\Models\\PwdProfile',1,'{\"status\":\"PENDING\"}','{\"status\":\"ACTIVE\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Updated PwdProfile: Jan Reinnen Suarez Calapao','2026-02-04 05:34:45','2026-02-04 08:02:29','2026-02-04 08:02:29'),(25,'2026-02',25,1,'updated','App\\Models\\PendingRegistration',1,'{\"status\":\"PENDING\",\"reviewed_by\":null,\"reviewed_at\":null}','{\"status\":\"APPROVED\",\"reviewed_by\":1,\"reviewed_at\":\"2026-02-04 13:34:45\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Updated PendingRegistration: 1','2026-02-04 05:34:45','2026-02-04 08:02:29','2026-02-04 08:02:29'),(26,'2026-02',26,1,'updated','App\\Models\\PwdProfile',1,'{\"current_version\":3}','{\"current_version\":4}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Updated PwdProfile: Jan Reinnen Suarez Calapao','2026-02-04 05:36:44','2026-02-04 08:02:29','2026-02-04 08:02:29'),(27,'2026-02',27,1,'updated','App\\Models\\PwdProfile',1,'{\"status\":\"ACTIVE\"}','{\"status\":\"DECEASED\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Updated PwdProfile: Jan Reinnen Suarez Calapao','2026-02-04 05:45:35','2026-02-04 08:02:29','2026-02-04 08:02:29'),(28,'2026-02',28,1,'updated','App\\Models\\PwdProfile',1,'{\"current_version\":5}','{\"current_version\":6}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Updated PwdProfile: Jan Reinnen Suarez Calapao','2026-02-04 05:45:36','2026-02-04 08:02:29','2026-02-04 08:02:29'),(29,'2026-02',29,NULL,'updated','App\\Models\\User',1,'{\"password\":\"$2y$12$ohwrxLc9lFqgUX.fqrKwLeaw2X0cVqgkuCuuAOK3kAivGZ2k6MYwK\"}','{\"password\":\"$2y$12$xA8.i.E6KAtYBQURckJnN.L45V8UYg.17hIBsC1NPCcv3nvIuFj3a\"}','127.0.0.1','Symfony','Updated User: Admin User','2026-02-04 06:14:59','2026-02-04 08:02:29','2026-02-04 08:02:29'),(30,'2026-02',30,NULL,'updated','App\\Models\\User',2,'{\"password\":\"$2y$12$E01K2KEWQPqfsS4\\/6sowVeNQmea8aa9.d3mM\\/Lnro.yDy8YmlpBm6\"}','{\"password\":\"$2y$12$jC0GPoYBkm7vXD7e4yMjbOkU\\/DhN0HAMRCyeP\\/Kn0JWsnA7VshhYC\"}','127.0.0.1','Symfony','Updated User: Staff User','2026-02-04 06:15:00','2026-02-04 08:02:29','2026-02-04 08:02:29'),(31,'2026-02',31,NULL,'updated','App\\Models\\User',3,'{\"password\":\"$2y$12$QZjWaWkbma5H\\/oWWLBKsh.sM4eLGz72bAeMnIiYvWUGG3YI.vvP4e\"}','{\"password\":\"$2y$12$R8bepe0hbTe3ES1\\/I6tJh.Tx5IhL.MlL5dYaYv632x3LeaMEx0oBa\"}','127.0.0.1','Symfony','Updated User: Mayor User','2026-02-04 06:15:00','2026-02-04 08:02:29','2026-02-04 08:02:29'),(32,'2026-02',32,NULL,'updated','App\\Models\\User',4,'{\"password\":\"$2y$12$oWJI3XuvRWDhNcseBRHpYeRmGa4cogbG9OJih1Q.kQ4MR3nkSHEs2\"}','{\"password\":\"$2y$12$7.gqq7esrsJxYfSk8NLiBeYlKI2EuRK2\\/v3ba7kVplPnjwR00jlnG\"}','127.0.0.1','Symfony','Updated User: Regular User','2026-02-04 06:15:00','2026-02-04 08:02:29','2026-02-04 08:02:29'),(33,'2026-02',33,1,'updated','App\\Models\\PwdProfile',1,'{\"pwd_number\":null}','{\"pwd_number\":\"123333\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Updated PwdProfile: Jan Reinnen Suarez Calapao','2026-02-04 06:17:02','2026-02-04 08:02:29','2026-02-04 08:02:29'),(34,'2026-02',34,1,'updated','App\\Models\\PwdProfile',1,'{\"current_version\":7}','{\"current_version\":8}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Updated PwdProfile: Jan Reinnen Suarez Calapao','2026-02-04 06:17:02','2026-02-04 08:02:29','2026-02-04 08:02:29'),(35,'2026-02',35,NULL,'created','App\\Models\\Backup',1,NULL,'{\"file_name\":\"pdao_backup_2026-02-04_143307.sql\",\"file_path\":\"pdao_backup_2026-02-04_143307.sql\",\"status\":\"IN_PROGRESS\",\"notes\":\"Agent Test Backup\",\"created_by\":1,\"updated_at\":\"2026-02-04T06:33:07.000000Z\",\"created_at\":\"2026-02-04T06:33:07.000000Z\",\"id\":1}','127.0.0.1','Symfony','Created Backup: 1','2026-02-04 06:33:07','2026-02-04 08:02:29','2026-02-04 08:02:29'),(36,'2026-02',36,NULL,'updated','App\\Models\\Backup',1,'{\"status\":\"IN_PROGRESS\"}','{\"status\":\"COMPLETED\",\"size\":\"76.01 KB\"}','127.0.0.1','Symfony','Updated Backup: 1','2026-02-04 06:33:09','2026-02-04 08:02:29','2026-02-04 08:02:29'),(37,'2026-02',37,NULL,'backup','App\\Models\\Backup',1,NULL,NULL,'127.0.0.1','Symfony','Created backup: pdao_backup_2026-02-04_143307.sql','2026-02-04 06:33:09','2026-02-04 08:02:29','2026-02-04 08:02:29'),(38,'2026-02',38,1,'created','App\\Models\\Backup',2,NULL,'{\"file_name\":\"pdao_backup_2026-02-04_150359.sql\",\"file_path\":\"pdao_backup_2026-02-04_150359.sql\",\"status\":\"IN_PROGRESS\",\"notes\":\"Manual backup created from dashboard\",\"created_by\":1,\"updated_at\":\"2026-02-04T07:03:59.000000Z\",\"created_at\":\"2026-02-04T07:03:59.000000Z\",\"id\":2}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Created Backup: 2','2026-02-04 07:03:59','2026-02-04 08:02:29','2026-02-04 08:02:29'),(39,'2026-02',39,1,'updated','App\\Models\\Backup',2,'{\"status\":\"IN_PROGRESS\"}','{\"status\":\"FAILED\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Updated Backup: 2','2026-02-04 07:03:59','2026-02-04 08:02:29','2026-02-04 08:02:29'),(40,'2026-02',40,1,'created','App\\Models\\Backup',3,NULL,'{\"file_name\":\"pdao_backup_2026-02-04_150403.sql\",\"file_path\":\"pdao_backup_2026-02-04_150403.sql\",\"status\":\"IN_PROGRESS\",\"notes\":\"Manual backup created from dashboard\",\"created_by\":1,\"updated_at\":\"2026-02-04T07:04:03.000000Z\",\"created_at\":\"2026-02-04T07:04:03.000000Z\",\"id\":3}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Created Backup: 3','2026-02-04 07:04:03','2026-02-04 08:02:29','2026-02-04 08:02:29'),(41,'2026-02',41,1,'updated','App\\Models\\Backup',3,'{\"status\":\"IN_PROGRESS\"}','{\"status\":\"FAILED\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Updated Backup: 3','2026-02-04 07:04:03','2026-02-04 08:02:29','2026-02-04 08:02:29'),(42,'2026-02',42,1,'created','App\\Models\\Backup',4,NULL,'{\"file_name\":\"pdao_backup_2026-02-04_150508.sql\",\"file_path\":\"pdao_backup_2026-02-04_150508.sql\",\"status\":\"IN_PROGRESS\",\"notes\":\"Debugging Backup\",\"created_by\":1,\"updated_at\":\"2026-02-04T07:05:08.000000Z\",\"created_at\":\"2026-02-04T07:05:08.000000Z\",\"id\":4}','127.0.0.1','Symfony','Created Backup: 4','2026-02-04 07:05:08','2026-02-04 08:02:29','2026-02-04 08:02:29'),(43,'2026-02',43,1,'updated','App\\Models\\Backup',4,'{\"status\":\"IN_PROGRESS\"}','{\"status\":\"COMPLETED\",\"size\":\"78.91 KB\"}','127.0.0.1','Symfony','Updated Backup: 4','2026-02-04 07:05:09','2026-02-04 08:02:29','2026-02-04 08:02:29'),(44,'2026-02',44,1,'backup','App\\Models\\Backup',4,NULL,NULL,'127.0.0.1','Symfony','Created backup: pdao_backup_2026-02-04_150508.sql','2026-02-04 07:05:09','2026-02-04 08:02:29','2026-02-04 08:02:29'),(45,'2026-02',45,1,'created','App\\Models\\Backup',5,NULL,'{\"file_name\":\"pdao_backup_2026-02-04_151020.sql\",\"file_path\":\"pdao_backup_2026-02-04_151020.sql\",\"status\":\"IN_PROGRESS\",\"notes\":\"Manual backup created from dashboard\",\"created_by\":1,\"updated_at\":\"2026-02-04T07:10:20.000000Z\",\"created_at\":\"2026-02-04T07:10:20.000000Z\",\"id\":5}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Created Backup: 5','2026-02-04 07:10:20','2026-02-04 08:02:29','2026-02-04 08:02:29'),(46,'2026-02',46,1,'updated','App\\Models\\Backup',5,'{\"status\":\"IN_PROGRESS\"}','{\"status\":\"FAILED\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Updated Backup: 5','2026-02-04 07:10:21','2026-02-04 08:02:29','2026-02-04 08:02:29'),(47,'2026-02',47,1,'created','App\\Models\\Backup',6,NULL,'{\"file_name\":\"pdao_backup_2026-02-04_151038.sql\",\"file_path\":\"pdao_backup_2026-02-04_151038.sql\",\"status\":\"IN_PROGRESS\",\"notes\":\"Manual backup created from dashboard\",\"created_by\":1,\"updated_at\":\"2026-02-04T07:10:38.000000Z\",\"created_at\":\"2026-02-04T07:10:38.000000Z\",\"id\":6}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Created Backup: 6','2026-02-04 07:10:38','2026-02-04 08:02:29','2026-02-04 08:02:29'),(48,'2026-02',48,1,'updated','App\\Models\\Backup',6,'{\"status\":\"IN_PROGRESS\"}','{\"status\":\"FAILED\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Updated Backup: 6','2026-02-04 07:10:38','2026-02-04 08:02:29','2026-02-04 08:02:29'),(49,'2026-02',49,1,'created','App\\Models\\Backup',7,NULL,'{\"file_name\":\"pdao_backup_2026-02-04_151546.sql\",\"file_path\":\"pdao_backup_2026-02-04_151546.sql\",\"status\":\"IN_PROGRESS\",\"notes\":\"Manual backup created from dashboard\",\"created_by\":1,\"updated_at\":\"2026-02-04T07:15:46.000000Z\",\"created_at\":\"2026-02-04T07:15:46.000000Z\",\"id\":7}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Created Backup: 7','2026-02-04 07:15:46','2026-02-04 08:02:29','2026-02-04 08:02:29'),(50,'2026-02',50,1,'restore',NULL,NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Database restored from backup','2026-02-04 07:16:43','2026-02-04 08:02:29','2026-02-04 08:02:29'),(51,'2026-02',1,1,'deleted',NULL,NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Cleared 50 activity logs','2026-02-04 08:02:29','2026-02-06 00:26:49','2026-02-06 00:26:49'),(52,'2026-02',2,NULL,'login','App\\Models\\User',4,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','User logged in: Regular User','2026-02-04 08:04:44','2026-02-06 00:26:49','2026-02-06 00:26:49'),(53,'2026-02',3,4,'logout','App\\Models\\User',4,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','User logged out: Regular User','2026-02-04 08:05:00','2026-02-06 00:26:49','2026-02-06 00:26:49'),(54,'2026-02',4,NULL,'login','App\\Models\\User',1,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','User logged in: Admin User','2026-02-04 08:05:05','2026-02-06 00:26:49','2026-02-06 00:26:49'),(55,'2026-02',5,1,'created','App\\Models\\PwdProfile',2,NULL,'{\"pwd_number\":null,\"first_name\":\"Rolan\",\"last_name\":\"Sotomayor\",\"middle_name\":\"Castillo\",\"suffix\":null,\"date_applied\":\"2026-02-04T16:00:00.000000Z\",\"status\":\"ACTIVE\",\"current_version\":1,\"remarks\":\"For printing ID\",\"accessibility_needs\":\"Wheelchair\",\"service_needs\":\"Livelihood\",\"updated_at\":\"2026-02-05T01:31:12.000000Z\",\"created_at\":\"2026-02-05T01:31:12.000000Z\",\"id\":2}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Created PwdProfile: Rolan Castillo Sotomayor','2026-02-05 01:31:12','2026-02-06 00:26:49','2026-02-06 00:26:49'),(56,'2026-02',6,1,'updated','App\\Models\\PwdProfile',1,'{\"current_version\":8}','{\"current_version\":9}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Updated PwdProfile: Jan Reinnen Suarez Calapao','2026-02-05 02:01:21','2026-02-06 00:26:49','2026-02-06 00:26:49'),(57,'2026-02',7,1,'updated','App\\Models\\PwdProfile',2,'{\"current_version\":2}','{\"current_version\":3}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Updated PwdProfile: Rolan Castillo Sotomayor','2026-02-05 02:07:32','2026-02-06 00:26:49','2026-02-06 00:26:49'),(58,'2026-02',8,1,'updated','App\\Models\\PwdProfile',2,'{\"current_version\":3}','{\"current_version\":4}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Updated PwdProfile: Rolan Castillo Sotomayor','2026-02-05 02:20:31','2026-02-06 00:26:49','2026-02-06 00:26:49'),(59,'2026-02',9,1,'updated','App\\Models\\PwdProfile',1,'{\"current_version\":9}','{\"current_version\":10}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Updated PwdProfile: Jan Reinnen Suarez Calapao','2026-02-05 02:21:26','2026-02-06 00:26:49','2026-02-06 00:26:49'),(60,'2026-02',10,1,'updated','App\\Models\\PwdProfile',2,'{\"current_version\":4}','{\"current_version\":5}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Updated PwdProfile: Rolan Castillo Sotomayor','2026-02-05 02:21:49','2026-02-06 00:26:49','2026-02-06 00:26:49'),(61,'2026-02',11,1,'created','App\\Models\\Backup',8,NULL,'{\"file_name\":\"pdao_backup_2026-02-05_102811.sql\",\"file_path\":\"pdao_backup_2026-02-05_102811.sql\",\"status\":\"IN_PROGRESS\",\"notes\":\"Manual backup created from dashboard\",\"created_by\":1,\"updated_at\":\"2026-02-05T02:28:11.000000Z\",\"created_at\":\"2026-02-05T02:28:11.000000Z\",\"id\":8}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Created Backup: 8','2026-02-05 02:28:11','2026-02-06 00:26:49','2026-02-06 00:26:49'),(62,'2026-02',12,1,'updated','App\\Models\\Backup',8,'{\"status\":\"IN_PROGRESS\"}','{\"status\":\"COMPLETED\",\"size\":\"106.92 KB\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Updated Backup: 8','2026-02-05 02:28:13','2026-02-06 00:26:49','2026-02-06 00:26:49'),(63,'2026-02',13,1,'backup','App\\Models\\Backup',8,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Created backup: pdao_backup_2026-02-05_102811.sql','2026-02-05 02:28:13','2026-02-06 00:26:49','2026-02-06 00:26:49'),(64,'2026-02',14,1,'logout','App\\Models\\User',1,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','User logged out: Admin User','2026-02-05 02:47:03','2026-02-06 00:26:49','2026-02-06 00:26:49'),(65,'2026-02',15,NULL,'login','App\\Models\\User',4,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','User logged in: Regular User','2026-02-05 02:47:25','2026-02-06 00:26:49','2026-02-06 00:26:49'),(66,'2026-02',16,4,'logout','App\\Models\\User',4,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','User logged out: Regular User','2026-02-05 02:50:23','2026-02-06 00:26:49','2026-02-06 00:26:49'),(67,'2026-02',17,NULL,'login','App\\Models\\User',1,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','User logged in: Admin User','2026-02-05 02:50:27','2026-02-06 00:26:49','2026-02-06 00:26:49'),(68,'2026-02',18,1,'logout','App\\Models\\User',1,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','User logged out: Admin User','2026-02-05 02:50:58','2026-02-06 00:26:49','2026-02-06 00:26:49'),(69,'2026-02',19,NULL,'login','App\\Models\\User',4,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','User logged in: Regular User','2026-02-05 02:51:02','2026-02-06 00:26:49','2026-02-06 00:26:49'),(70,'2026-02',20,4,'created','App\\Models\\PwdProfile',3,NULL,'{\"pwd_number\":null,\"first_name\":\"Jencel\",\"last_name\":\"Sofer\",\"middle_name\":null,\"suffix\":null,\"date_applied\":\"2026-02-04T16:00:00.000000Z\",\"status\":\"PENDING\",\"current_version\":1,\"remarks\":null,\"accessibility_needs\":null,\"service_needs\":null,\"updated_at\":\"2026-02-05T02:53:37.000000Z\",\"created_at\":\"2026-02-05T02:53:37.000000Z\",\"id\":3}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Created PwdProfile: Jencel Sofer','2026-02-05 02:53:37','2026-02-06 00:26:49','2026-02-06 00:26:49'),(71,'2026-02',21,4,'created','App\\Models\\PendingRegistration',2,NULL,'{\"pwd_profile_id\":3,\"user_id\":4,\"submission_type\":\"NEW\",\"status\":\"PENDING\",\"updated_at\":\"2026-02-05T02:53:37.000000Z\",\"created_at\":\"2026-02-05T02:53:37.000000Z\",\"id\":2}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Created PendingRegistration: 2','2026-02-05 02:53:37','2026-02-06 00:26:49','2026-02-06 00:26:49'),(72,'2026-02',22,4,'logout','App\\Models\\User',4,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','User logged out: Regular User','2026-02-05 02:53:44','2026-02-06 00:26:49','2026-02-06 00:26:49'),(73,'2026-02',23,NULL,'login','App\\Models\\User',1,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','User logged in: Admin User','2026-02-05 02:53:52','2026-02-06 00:26:49','2026-02-06 00:26:49'),(74,'2026-02',24,1,'updated','App\\Models\\PwdProfile',3,'{\"status\":\"PENDING\"}','{\"status\":\"ACTIVE\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Updated PwdProfile: Jencel Sofer','2026-02-05 02:54:27','2026-02-06 00:26:49','2026-02-06 00:26:49'),(75,'2026-02',25,1,'updated','App\\Models\\PendingRegistration',2,'{\"status\":\"PENDING\",\"reviewed_by\":null,\"reviewed_at\":null}','{\"status\":\"APPROVED\",\"reviewed_by\":1,\"reviewed_at\":\"2026-02-05 10:54:27\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Updated PendingRegistration: 2','2026-02-05 02:54:28','2026-02-06 00:26:49','2026-02-06 00:26:49'),(76,'2026-02',26,1,'logout','App\\Models\\User',1,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','User logged out: Admin User','2026-02-05 03:14:24','2026-02-06 00:26:49','2026-02-06 00:26:49'),(77,'2026-02',27,NULL,'login','App\\Models\\User',1,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','User logged in: Admin User','2026-02-05 05:42:40','2026-02-06 00:26:49','2026-02-06 00:26:49'),(78,'2026-02',28,1,'created','App\\Models\\GeneratedReport',1,NULL,'{\"file_name\":\"masterlist_2026-02-05_141908.xlsx\",\"file_path\":\"masterlist_2026-02-05_141908.xlsx\",\"file_type\":\"EXCEL\",\"report_type\":\"MASTERLIST\",\"size\":\"242 B\",\"parameters\":{\"barangay_id\":null,\"disability_type_id\":null,\"year\":2026},\"generated_by\":1,\"updated_at\":\"2026-02-05T06:19:08.000000Z\",\"created_at\":\"2026-02-05T06:19:08.000000Z\",\"id\":1}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Created GeneratedReport: 1','2026-02-05 06:19:08','2026-02-06 00:26:49','2026-02-06 00:26:49'),(79,'2026-02',29,1,'exported','App\\Models\\GeneratedReport',1,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','Generated MASTERLIST report','2026-02-05 06:19:08','2026-02-06 00:26:49','2026-02-06 00:26:49');
/*!40000 ALTER TABLE `activity_logs_archive` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `backups`
--

DROP TABLE IF EXISTS `backups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `backups` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `size` varchar(255) DEFAULT NULL,
  `status` enum('COMPLETED','FAILED','IN_PROGRESS') NOT NULL DEFAULT 'COMPLETED',
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `backups_created_by_foreign` (`created_by`),
  KEY `backups_status_index` (`status`),
  KEY `backups_created_at_index` (`created_at`),
  CONSTRAINT `backups_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backups`
--

LOCK TABLES `backups` WRITE;
/*!40000 ALTER TABLE `backups` DISABLE KEYS */;
INSERT INTO `backups` VALUES (1,'pdao_backup_2026-02-04_143307.sql','pdao_backup_2026-02-04_143307.sql','76.01 KB','COMPLETED','Agent Test Backup',1,'2026-02-04 06:33:07','2026-02-04 06:33:09'),(2,'pdao_backup_2026-02-04_150359.sql','pdao_backup_2026-02-04_150359.sql',NULL,'FAILED','Manual backup created from dashboard',1,'2026-02-04 07:03:59','2026-02-04 07:03:59'),(3,'pdao_backup_2026-02-04_150403.sql','pdao_backup_2026-02-04_150403.sql',NULL,'FAILED','Manual backup created from dashboard',1,'2026-02-04 07:04:03','2026-02-04 07:04:03'),(4,'pdao_backup_2026-02-04_150508.sql','pdao_backup_2026-02-04_150508.sql','78.91 KB','COMPLETED','Debugging Backup',1,'2026-02-04 07:05:08','2026-02-04 07:05:09'),(5,'pdao_backup_2026-02-04_151020.sql','pdao_backup_2026-02-04_151020.sql',NULL,'FAILED','Manual backup created from dashboard',1,'2026-02-04 07:10:20','2026-02-04 07:10:21'),(6,'pdao_backup_2026-02-04_151038.sql','pdao_backup_2026-02-04_151038.sql',NULL,'FAILED','Manual backup created from dashboard',1,'2026-02-04 07:10:38','2026-02-04 07:10:38'),(7,'pdao_backup_2026-02-04_151546.sql','pdao_backup_2026-02-04_151546.sql',NULL,'IN_PROGRESS','Manual backup created from dashboard',1,'2026-02-04 07:15:46','2026-02-04 07:15:46'),(8,'pdao_backup_2026-02-05_102811.sql','pdao_backup_2026-02-05_102811.sql','106.92 KB','COMPLETED','Manual backup created from dashboard',1,'2026-02-05 02:28:11','2026-02-05 02:28:13'),(9,'pdao_backup_2026-02-06_105817.sql','pdao_backup_2026-02-06_105817.sql',NULL,'IN_PROGRESS','Manual backup created from dashboard',1,'2026-02-06 02:58:17','2026-02-06 02:58:17');
/*!40000 ALTER TABLE `backups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `barangays`
--

DROP TABLE IF EXISTS `barangays`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `barangays` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `barangays_name_unique` (`name`),
  UNIQUE KEY `barangays_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `barangays`
--

LOCK TABLES `barangays` WRITE;
/*!40000 ALTER TABLE `barangays` DISABLE KEYS */;
INSERT INTO `barangays` VALUES (1,'Anibong','ANI',1,'2026-02-04 05:26:53','2026-02-04 05:26:53'),(2,'Barangay I','B01',1,'2026-02-04 05:26:53','2026-02-04 05:26:53'),(3,'Barangay II','B02',1,'2026-02-04 05:26:53','2026-02-04 05:26:53'),(4,'Barangay III','B03',1,'2026-02-04 05:26:53','2026-02-04 05:26:53'),(5,'Biñan','BIN',1,'2026-02-04 05:26:53','2026-02-04 05:26:53'),(6,'Buboy','BUB',1,'2026-02-04 05:26:53','2026-02-04 05:26:53'),(7,'Cabanbanan','CAB',1,'2026-02-04 05:26:53','2026-02-04 05:26:53'),(8,'Calusiche','CAL',1,'2026-02-04 05:26:53','2026-02-04 05:26:53'),(9,'Dingin','DIN',1,'2026-02-04 05:26:53','2026-02-04 05:26:53'),(10,'Lambac','LAM',1,'2026-02-04 05:26:53','2026-02-04 05:26:53'),(11,'Layugan','LAY',1,'2026-02-04 05:26:53','2026-02-04 05:26:53'),(12,'Magdapio','MAG',1,'2026-02-04 05:26:53','2026-02-04 05:26:53'),(13,'Maulawin','MAU',1,'2026-02-04 05:26:53','2026-02-04 05:26:53'),(14,'Pinagsanjan','PIN',1,'2026-02-04 05:26:53','2026-02-04 05:26:53'),(15,'Sabang','SAB',1,'2026-02-04 05:26:53','2026-02-04 05:26:53'),(16,'Sampaloc','SAM',1,'2026-02-04 05:26:53','2026-02-04 05:26:53'),(17,'San Isidro','SIS',1,'2026-02-04 05:26:53','2026-02-04 05:26:53');
/*!40000 ALTER TABLE `barangays` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `disability_types`
--

DROP TABLE IF EXISTS `disability_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `disability_types` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `disability_types_name_unique` (`name`),
  UNIQUE KEY `disability_types_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `disability_types`
--

LOCK TABLES `disability_types` WRITE;
/*!40000 ALTER TABLE `disability_types` DISABLE KEYS */;
INSERT INTO `disability_types` VALUES (1,'Cancer','CAN','Disability due to cancer or its treatment effects',1,'2026-02-04 05:26:41','2026-02-04 05:26:41'),(2,'Deaf or Hard of Hearing','DHH','Hearing impairment or deafness',1,'2026-02-04 05:26:41','2026-02-04 05:26:41'),(3,'Intellectual','INT','Intellectual disability affecting cognitive functions',1,'2026-02-04 05:26:41','2026-02-04 05:26:41'),(4,'Learning','LRN','Learning disabilities such as dyslexia, dyscalculia',1,'2026-02-04 05:26:41','2026-02-04 05:26:41'),(5,'Mental','MEN','Mental health conditions affecting daily functioning',1,'2026-02-04 05:26:41','2026-02-04 05:26:41'),(6,'Orthopedic','ORT','Bone, joint, or muscle disorders',1,'2026-02-04 05:26:41','2026-02-04 05:26:41'),(7,'Physical','PHY','Physical disabilities affecting mobility or motor functions',1,'2026-02-04 05:26:41','2026-02-04 05:26:41'),(8,'Psychosocial','PSY','Psychosocial disabilities affecting social interactions',1,'2026-02-04 05:26:41','2026-02-04 05:26:41'),(9,'Rare Disease','RAR','Rare diseases causing disability',1,'2026-02-04 05:26:41','2026-02-04 05:26:41'),(10,'Speech/Language','SPL','Speech or language impairments',1,'2026-02-04 05:26:41','2026-02-04 05:26:41'),(11,'Visual','VIS','Visual impairment or blindness',1,'2026-02-04 05:26:41','2026-02-04 05:26:41'),(12,'Chronic Illness','CHR','Chronic illnesses causing long-term disability',1,'2026-02-04 05:26:41','2026-02-04 05:26:41');
/*!40000 ALTER TABLE `disability_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `generated_reports`
--

DROP TABLE IF EXISTS `generated_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `generated_reports` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_type` enum('PDF','EXCEL') NOT NULL DEFAULT 'EXCEL',
  `report_type` enum('YOUTH_PWD','DILG_FORMAT','LGU_COMPLIANCE','MASTERLIST','CUSTOM') NOT NULL,
  `size` varchar(255) DEFAULT NULL,
  `parameters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`parameters`)),
  `generated_by` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `generated_reports_report_type_index` (`report_type`),
  KEY `generated_reports_generated_by_index` (`generated_by`),
  KEY `generated_reports_created_at_index` (`created_at`),
  CONSTRAINT `generated_reports_generated_by_foreign` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `generated_reports`
--

LOCK TABLES `generated_reports` WRITE;
/*!40000 ALTER TABLE `generated_reports` DISABLE KEYS */;
INSERT INTO `generated_reports` VALUES (1,'masterlist_2026-02-05_141908.xlsx','masterlist_2026-02-05_141908.xlsx','EXCEL','MASTERLIST','242 B','{\"barangay_id\":null,\"disability_type_id\":null,\"year\":2026}',1,'2026-02-05 06:19:08','2026-02-05 06:19:08');
/*!40000 ALTER TABLE `generated_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2024_01_01_000001_create_barangays_table',1),(5,'2024_01_01_000002_create_disability_types_table',1),(6,'2024_01_01_000003_create_pwd_profiles_table',1),(7,'2024_01_01_000004_create_pwd_personal_info_table',1),(8,'2024_01_01_000005_create_pwd_addresses_table',1),(9,'2024_01_01_000006_create_pwd_contacts_table',1),(10,'2024_01_01_000007_create_pwd_disabilities_table',1),(11,'2024_01_01_000008_create_pwd_employment_table',1),(12,'2024_01_01_000009_create_pwd_education_table',1),(13,'2024_01_01_000010_create_pwd_family_table',1),(14,'2024_01_01_000011_create_pwd_government_ids_table',1),(15,'2024_01_01_000012_create_pwd_economic_info_table',1),(16,'2024_01_01_000013_create_pwd_organizations_table',1),(17,'2024_01_01_000014_create_pwd_profile_versions_table',1),(18,'2024_01_01_000015_create_pending_registrations_table',1),(19,'2024_01_01_000016_create_activity_logs_table',1),(20,'2024_01_01_000017_create_activity_logs_archive_table',1),(21,'2024_01_01_000018_create_generated_reports_table',1),(22,'2024_01_01_000019_create_backups_table',1),(23,'2024_01_01_000020_create_personal_access_tokens_table',1),(24,'2026_01_31_000001_update_pwd_education_attainment_column',1),(25,'2026_02_01_000001_create_notifications_table',1),(26,'2026_02_02_000001_add_accessibility_and_service_needs_to_pwd_profiles_table',1),(27,'2026_02_03_000001_add_pending_status_to_pwd_profiles_table',1),(28,'2026_02_03_091231_update_living_arrangement_value',1),(29,'2026_02_03_155751_add_user_id_to_pending_registrations_table',1);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `type` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `related_type` varchar(255) DEFAULT NULL,
  `related_id` bigint(20) unsigned DEFAULT NULL,
  `action_by` varchar(255) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_user_id_is_read_index` (`user_id`,`is_read`),
  KEY `notifications_user_id_created_at_index` (`user_id`,`created_at`),
  CONSTRAINT `notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,4,'approval','Registration Approved','Your PWD registration has been approved and you are now officially registered in the masterlist.','pending_registration',1,'Admin User',0,NULL,'2026-02-04 05:34:45','2026-02-04 05:34:45'),(2,4,'approval','Registration Approved','Your PWD registration has been approved and you are now officially registered in the masterlist.','pending_registration',2,'Admin User',0,NULL,'2026-02-05 02:54:28','2026-02-05 02:54:28');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pending_registrations`
--

DROP TABLE IF EXISTS `pending_registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pending_registrations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `pwd_profile_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `submission_type` enum('NEW','EXISTING','RENEWAL') NOT NULL DEFAULT 'NEW',
  `status` enum('PENDING','APPROVED','REJECTED','UNDER_REVIEW') NOT NULL DEFAULT 'PENDING',
  `reviewed_by` bigint(20) unsigned DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `review_notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pending_registrations_pwd_profile_id_foreign` (`pwd_profile_id`),
  KEY `pending_registrations_reviewed_by_foreign` (`reviewed_by`),
  KEY `pending_registrations_status_index` (`status`),
  KEY `pending_registrations_submission_type_index` (`submission_type`),
  KEY `pending_registrations_created_at_index` (`created_at`),
  KEY `pending_registrations_user_id_foreign` (`user_id`),
  CONSTRAINT `pending_registrations_pwd_profile_id_foreign` FOREIGN KEY (`pwd_profile_id`) REFERENCES `pwd_profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pending_registrations_reviewed_by_foreign` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `pending_registrations_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pending_registrations`
--

LOCK TABLES `pending_registrations` WRITE;
/*!40000 ALTER TABLE `pending_registrations` DISABLE KEYS */;
INSERT INTO `pending_registrations` VALUES (1,1,4,'NEW','APPROVED',1,'2026-02-04 05:34:45',NULL,'2026-02-04 05:34:10','2026-02-04 05:34:45',NULL),(2,3,4,'NEW','APPROVED',1,'2026-02-05 02:54:27',NULL,'2026-02-05 02:53:37','2026-02-05 02:54:28',NULL);
/*!40000 ALTER TABLE `pending_registrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
INSERT INTO `personal_access_tokens` VALUES (5,'App\\Models\\User',1,'auth-token','f174e37285ec1bfbd65925f62775f2df7b8a3d53a40f21c7ce206f9230dfbf33','[\"*\"]','2026-02-04 08:03:49',NULL,'2026-02-04 05:34:19','2026-02-04 08:03:49'),(12,'App\\Models\\User',1,'auth-token','dc4906e375e7d8d81d4d9732100f30e5ef0d5242ce26b088e1b11eb3cdd696db','[\"*\"]','2026-02-06 02:58:16',NULL,'2026-02-05 05:42:39','2026-02-06 02:58:16');
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pwd_addresses`
--

DROP TABLE IF EXISTS `pwd_addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pwd_addresses` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `pwd_profile_id` bigint(20) unsigned NOT NULL,
  `house_street` varchar(255) DEFAULT NULL,
  `barangay_id` bigint(20) unsigned DEFAULT NULL,
  `city` varchar(255) NOT NULL DEFAULT 'Pagsanjan',
  `province` varchar(255) NOT NULL DEFAULT 'Laguna',
  `region` varchar(255) NOT NULL DEFAULT 'Region 4A',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pwd_addresses_pwd_profile_id_foreign` (`pwd_profile_id`),
  KEY `pwd_addresses_barangay_id_index` (`barangay_id`),
  CONSTRAINT `pwd_addresses_barangay_id_foreign` FOREIGN KEY (`barangay_id`) REFERENCES `barangays` (`id`) ON DELETE SET NULL,
  CONSTRAINT `pwd_addresses_pwd_profile_id_foreign` FOREIGN KEY (`pwd_profile_id`) REFERENCES `pwd_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pwd_addresses`
--

LOCK TABLES `pwd_addresses` WRITE;
/*!40000 ALTER TABLE `pwd_addresses` DISABLE KEYS */;
INSERT INTO `pwd_addresses` VALUES (1,1,'052 Ibaba Subdivision',14,'Pagsanjan','Laguna','4A','2026-02-04 05:34:10','2026-02-04 05:34:10'),(2,2,'69 Kalye Putol',7,'Pagsanjan','Laguna','4A','2026-02-05 01:31:13','2026-02-05 01:31:13'),(3,3,'JNT Warehouse',11,'Pagsanjan','Laguna','4A','2026-02-05 02:53:37','2026-02-05 02:53:37'),(4,4,'023 Kalye dikoalam',12,'Pagsanjan','Laguna','4A','2026-02-06 00:34:58','2026-02-06 00:34:58');
/*!40000 ALTER TABLE `pwd_addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pwd_contacts`
--

DROP TABLE IF EXISTS `pwd_contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pwd_contacts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `pwd_profile_id` bigint(20) unsigned NOT NULL,
  `mobile` varchar(255) DEFAULT NULL,
  `landline` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `guardian_contact` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pwd_contacts_pwd_profile_id_foreign` (`pwd_profile_id`),
  KEY `pwd_contacts_mobile_index` (`mobile`),
  KEY `pwd_contacts_email_index` (`email`),
  CONSTRAINT `pwd_contacts_pwd_profile_id_foreign` FOREIGN KEY (`pwd_profile_id`) REFERENCES `pwd_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pwd_contacts`
--

LOCK TABLES `pwd_contacts` WRITE;
/*!40000 ALTER TABLE `pwd_contacts` DISABLE KEYS */;
INSERT INTO `pwd_contacts` VALUES (1,1,'09616969801',NULL,'renzcalapao12@gmail.com','09996871601','2026-02-04 05:34:10','2026-02-04 05:34:10'),(2,2,'091231238855','132777','rolan@gmail.com',NULL,'2026-02-05 01:31:13','2026-02-05 01:31:13'),(3,3,'091424774744',NULL,'jencel@gmail.com','091231232111','2026-02-05 02:53:37','2026-02-05 02:53:37'),(4,4,'0932423444',NULL,'kate@gmail.com',NULL,'2026-02-06 00:34:58','2026-02-06 00:34:58');
/*!40000 ALTER TABLE `pwd_contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pwd_disabilities`
--

DROP TABLE IF EXISTS `pwd_disabilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pwd_disabilities` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `pwd_profile_id` bigint(20) unsigned NOT NULL,
  `disability_type_id` bigint(20) unsigned NOT NULL,
  `cause` enum('Acquired','Congenital') DEFAULT NULL,
  `cause_details` text DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pwd_disabilities_pwd_profile_id_disability_type_id_index` (`pwd_profile_id`,`disability_type_id`),
  KEY `pwd_disabilities_disability_type_id_index` (`disability_type_id`),
  CONSTRAINT `pwd_disabilities_disability_type_id_foreign` FOREIGN KEY (`disability_type_id`) REFERENCES `disability_types` (`id`),
  CONSTRAINT `pwd_disabilities_pwd_profile_id_foreign` FOREIGN KEY (`pwd_profile_id`) REFERENCES `pwd_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pwd_disabilities`
--

LOCK TABLES `pwd_disabilities` WRITE;
/*!40000 ALTER TABLE `pwd_disabilities` DISABLE KEYS */;
INSERT INTO `pwd_disabilities` VALUES (8,1,5,'Acquired',NULL,1,'2026-02-05 02:21:26','2026-02-05 02:21:26'),(9,2,2,'Acquired',NULL,1,'2026-02-05 02:21:49','2026-02-05 02:21:49'),(10,3,10,'Acquired',NULL,1,'2026-02-05 02:53:37','2026-02-05 02:53:37'),(11,4,8,'Acquired',NULL,1,'2026-02-06 00:34:58','2026-02-06 00:34:58');
/*!40000 ALTER TABLE `pwd_disabilities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pwd_education`
--

DROP TABLE IF EXISTS `pwd_education`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pwd_education` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `pwd_profile_id` bigint(20) unsigned NOT NULL,
  `attainment` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pwd_education_pwd_profile_id_foreign` (`pwd_profile_id`),
  KEY `pwd_education_attainment_index` (`attainment`),
  CONSTRAINT `pwd_education_pwd_profile_id_foreign` FOREIGN KEY (`pwd_profile_id`) REFERENCES `pwd_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pwd_education`
--

LOCK TABLES `pwd_education` WRITE;
/*!40000 ALTER TABLE `pwd_education` DISABLE KEYS */;
INSERT INTO `pwd_education` VALUES (1,1,'College','2026-02-04 05:34:10','2026-02-04 05:34:10'),(2,2,'College','2026-02-05 01:31:13','2026-02-05 01:31:13'),(3,3,'Non-formal','2026-02-05 02:53:37','2026-02-05 02:53:37'),(4,4,'College','2026-02-06 00:34:58','2026-02-06 00:34:58');
/*!40000 ALTER TABLE `pwd_education` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pwd_employment`
--

DROP TABLE IF EXISTS `pwd_employment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pwd_employment` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `pwd_profile_id` bigint(20) unsigned NOT NULL,
  `status` enum('Employed','Unemployed','Self-Employed') DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `occupation` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pwd_employment_pwd_profile_id_foreign` (`pwd_profile_id`),
  KEY `pwd_employment_status_index` (`status`),
  CONSTRAINT `pwd_employment_pwd_profile_id_foreign` FOREIGN KEY (`pwd_profile_id`) REFERENCES `pwd_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pwd_employment`
--

LOCK TABLES `pwd_employment` WRITE;
/*!40000 ALTER TABLE `pwd_employment` DISABLE KEYS */;
INSERT INTO `pwd_employment` VALUES (1,1,'Self-Employed',NULL,NULL,'None','2026-02-04 05:34:10','2026-02-04 05:34:10'),(2,2,'Unemployed',NULL,NULL,'None','2026-02-05 01:31:13','2026-02-05 01:31:13'),(3,3,'Employed','Private','Permanent/Regular','Loverboy','2026-02-05 02:53:37','2026-02-05 02:53:37'),(4,4,'Self-Employed',NULL,'Casual','Freelance','2026-02-06 00:34:58','2026-02-06 00:34:58');
/*!40000 ALTER TABLE `pwd_employment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pwd_family`
--

DROP TABLE IF EXISTS `pwd_family`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pwd_family` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `pwd_profile_id` bigint(20) unsigned NOT NULL,
  `relation_type` enum('Father','Mother','Guardian','Spouse') NOT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `middle_name` varchar(255) DEFAULT NULL,
  `age` int(10) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pwd_family_pwd_profile_id_relation_type_index` (`pwd_profile_id`,`relation_type`),
  CONSTRAINT `pwd_family_pwd_profile_id_foreign` FOREIGN KEY (`pwd_profile_id`) REFERENCES `pwd_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pwd_family`
--

LOCK TABLES `pwd_family` WRITE;
/*!40000 ALTER TABLE `pwd_family` DISABLE KEYS */;
INSERT INTO `pwd_family` VALUES (1,1,'Father','Reynaldo','Calapao','Suarez',NULL,'2026-02-04 05:34:10','2026-02-04 05:34:10'),(2,1,'Mother','Anatalia','Calapao','Suarez',NULL,'2026-02-04 05:34:10','2026-02-04 05:34:10');
/*!40000 ALTER TABLE `pwd_family` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pwd_government_ids`
--

DROP TABLE IF EXISTS `pwd_government_ids`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pwd_government_ids` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `pwd_profile_id` bigint(20) unsigned NOT NULL,
  `id_type` enum('SSS','GSIS','PhilHealth','Pag-IBIG') NOT NULL,
  `id_number` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pwd_government_ids_pwd_profile_id_id_type_index` (`pwd_profile_id`,`id_type`),
  KEY `pwd_government_ids_id_number_index` (`id_number`),
  CONSTRAINT `pwd_government_ids_pwd_profile_id_foreign` FOREIGN KEY (`pwd_profile_id`) REFERENCES `pwd_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pwd_government_ids`
--

LOCK TABLES `pwd_government_ids` WRITE;
/*!40000 ALTER TABLE `pwd_government_ids` DISABLE KEYS */;
INSERT INTO `pwd_government_ids` VALUES (1,2,'SSS','45532','2026-02-05 01:31:13','2026-02-05 01:31:13'),(2,2,'GSIS','234422','2026-02-05 01:31:13','2026-02-05 01:31:13'),(3,2,'PhilHealth','1245655','2026-02-05 01:31:13','2026-02-05 01:31:13'),(4,2,'Pag-IBIG','1245324','2026-02-05 01:31:13','2026-02-05 01:31:13');
/*!40000 ALTER TABLE `pwd_government_ids` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pwd_household_info`
--

DROP TABLE IF EXISTS `pwd_household_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pwd_household_info` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `pwd_profile_id` bigint(20) unsigned NOT NULL,
  `living_arrangement` varchar(255) DEFAULT NULL,
  `receiving_support` tinyint(1) NOT NULL DEFAULT 0,
  `is_pensioner` tinyint(1) NOT NULL DEFAULT 0,
  `pension_type` varchar(255) DEFAULT NULL,
  `monthly_pension` decimal(12,2) DEFAULT NULL,
  `income_source` varchar(255) DEFAULT NULL,
  `monthly_income` decimal(12,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pwd_economic_info_pwd_profile_id_foreign` (`pwd_profile_id`),
  KEY `pwd_economic_info_is_pensioner_index` (`is_pensioner`),
  CONSTRAINT `pwd_economic_info_pwd_profile_id_foreign` FOREIGN KEY (`pwd_profile_id`) REFERENCES `pwd_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pwd_household_info`
--

LOCK TABLES `pwd_household_info` WRITE;
/*!40000 ALTER TABLE `pwd_household_info` DISABLE KEYS */;
INSERT INTO `pwd_household_info` VALUES (1,1,'Living with Family',0,0,NULL,NULL,'Allowance',3000.00,'2026-02-04 05:34:10','2026-02-04 05:34:10'),(2,2,'Living with Husband/Wife',0,0,NULL,NULL,'Allowance',100000.00,'2026-02-05 01:31:13','2026-02-05 01:31:13'),(3,3,'Living Alone',0,0,NULL,NULL,'Work',766999.00,'2026-02-05 02:53:37','2026-02-05 02:53:37'),(4,4,'Living with Family',0,0,NULL,NULL,'Salary',50000.00,'2026-02-06 00:34:58','2026-02-06 00:34:58');
/*!40000 ALTER TABLE `pwd_household_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pwd_organizations`
--

DROP TABLE IF EXISTS `pwd_organizations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pwd_organizations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `pwd_profile_id` bigint(20) unsigned NOT NULL,
  `organization_name` varchar(255) DEFAULT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `telephone` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pwd_organizations_pwd_profile_id_foreign` (`pwd_profile_id`),
  CONSTRAINT `pwd_organizations_pwd_profile_id_foreign` FOREIGN KEY (`pwd_profile_id`) REFERENCES `pwd_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pwd_organizations`
--

LOCK TABLES `pwd_organizations` WRITE;
/*!40000 ALTER TABLE `pwd_organizations` DISABLE KEYS */;
/*!40000 ALTER TABLE `pwd_organizations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pwd_personal_info`
--

DROP TABLE IF EXISTS `pwd_personal_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pwd_personal_info` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `pwd_profile_id` bigint(20) unsigned NOT NULL,
  `birth_date` date DEFAULT NULL,
  `birth_place` varchar(255) DEFAULT NULL,
  `sex` enum('Male','Female') DEFAULT NULL,
  `religion` varchar(255) DEFAULT NULL,
  `ethnic_group` varchar(255) DEFAULT NULL,
  `civil_status` enum('Single','Married','Widowed','Separated','Divorced') DEFAULT NULL,
  `blood_type` enum('A+','A-','B+','B-','O+','O-','AB+','AB-') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pwd_personal_info_pwd_profile_id_foreign` (`pwd_profile_id`),
  KEY `pwd_personal_info_birth_date_index` (`birth_date`),
  KEY `pwd_personal_info_sex_index` (`sex`),
  KEY `pwd_personal_info_civil_status_index` (`civil_status`),
  CONSTRAINT `pwd_personal_info_pwd_profile_id_foreign` FOREIGN KEY (`pwd_profile_id`) REFERENCES `pwd_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pwd_personal_info`
--

LOCK TABLES `pwd_personal_info` WRITE;
/*!40000 ALTER TABLE `pwd_personal_info` DISABLE KEYS */;
INSERT INTO `pwd_personal_info` VALUES (1,1,'2003-10-07','Sn. Pablo City','Male','Catholic','Aeta','Single','O+','2026-02-04 05:34:10','2026-02-05 02:21:26'),(2,2,'2003-07-16','Magdalena, Laguna','Male','Catholic',NULL,'Married','A+','2026-02-05 01:31:13','2026-02-05 02:21:49'),(3,3,'2002-05-16','Duhat','Male','Catholic',NULL,'Single','B+','2026-02-05 02:53:37','2026-02-05 02:53:37'),(4,4,'2000-02-17','Bay, Laguna','Male','Catholic',NULL,'Single','A-','2026-02-06 00:34:58','2026-02-06 00:34:58');
/*!40000 ALTER TABLE `pwd_personal_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pwd_profile_versions`
--

DROP TABLE IF EXISTS `pwd_profile_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pwd_profile_versions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `pwd_profile_id` bigint(20) unsigned NOT NULL,
  `version_number` int(10) unsigned NOT NULL,
  `snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`snapshot`)),
  `changed_by` bigint(20) unsigned DEFAULT NULL,
  `change_summary` varchar(255) DEFAULT NULL,
  `changed_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pwd_profile_versions_changed_by_foreign` (`changed_by`),
  KEY `pwd_profile_versions_pwd_profile_id_version_number_index` (`pwd_profile_id`,`version_number`),
  KEY `pwd_profile_versions_changed_at_index` (`changed_at`),
  CONSTRAINT `pwd_profile_versions_changed_by_foreign` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `pwd_profile_versions_pwd_profile_id_foreign` FOREIGN KEY (`pwd_profile_id`) REFERENCES `pwd_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pwd_profile_versions`
--

LOCK TABLES `pwd_profile_versions` WRITE;
/*!40000 ALTER TABLE `pwd_profile_versions` DISABLE KEYS */;
INSERT INTO `pwd_profile_versions` VALUES (1,1,1,'{\"pwd_number\":null,\"first_name\":\"Jan Reinnen\",\"last_name\":\"Calapao\",\"middle_name\":\"Suarez\",\"suffix\":null,\"date_applied\":\"2026-02-03T16:00:00.000000Z\",\"status\":\"PENDING\",\"current_version\":1,\"remarks\":\"hahahaha\",\"accessibility_needs\":\"Wheel chair\",\"service_needs\":\"Medical Assurance\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"id\":1,\"personal_info\":null,\"address\":null,\"contacts\":null,\"disabilities\":[],\"employment\":null,\"education\":null,\"family_members\":[],\"government_ids\":[],\"household_info\":null,\"organization\":null}',4,'Initial registration','2026-02-04 05:34:10','2026-02-04 05:34:10','2026-02-04 05:34:10'),(2,1,2,'{\"id\":1,\"pwd_number\":null,\"first_name\":\"Jan Reinnen\",\"last_name\":\"Calapao\",\"middle_name\":\"Suarez\",\"suffix\":null,\"date_applied\":\"2026-02-03T16:00:00.000000Z\",\"status\":\"ACTIVE\",\"current_version\":2,\"remarks\":\"hahahaha\",\"accessibility_needs\":\"Wheel chair\",\"service_needs\":\"Medical Assurance\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:45.000000Z\",\"deleted_at\":null,\"personal_info\":{\"id\":1,\"pwd_profile_id\":1,\"birth_date\":\"2003-07-09T16:00:00.000000Z\",\"birth_place\":\"Sn. Pablo City\",\"sex\":\"Male\",\"religion\":\"Catholic\",\"ethnic_group\":\"Aeta\",\"civil_status\":\"Single\",\"blood_type\":\"O+\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"address\":{\"id\":1,\"pwd_profile_id\":1,\"house_street\":\"052 Ibaba Subdivision\",\"barangay_id\":14,\"city\":\"Pagsanjan\",\"province\":\"Laguna\",\"region\":\"4A\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\",\"barangay\":{\"id\":14,\"name\":\"Pinagsanjan\",\"code\":\"PIN\",\"is_active\":true,\"created_at\":\"2026-02-04T05:26:53.000000Z\",\"updated_at\":\"2026-02-04T05:26:53.000000Z\"}},\"contacts\":{\"id\":1,\"pwd_profile_id\":1,\"mobile\":\"09616969801\",\"landline\":null,\"email\":\"renzcalapao12@gmail.com\",\"guardian_contact\":\"09996871601\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"disabilities\":[{\"id\":1,\"pwd_profile_id\":1,\"disability_type_id\":5,\"cause\":\"Acquired\",\"cause_details\":null,\"is_primary\":true,\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\",\"disability_type\":{\"id\":5,\"name\":\"Mental\",\"code\":\"MEN\",\"description\":\"Mental health conditions affecting daily functioning\",\"is_active\":true,\"created_at\":\"2026-02-04T05:26:41.000000Z\",\"updated_at\":\"2026-02-04T05:26:41.000000Z\"}}],\"employment\":{\"id\":1,\"pwd_profile_id\":1,\"status\":\"Self-Employed\",\"category\":null,\"type\":null,\"occupation\":\"None\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"education\":{\"id\":1,\"pwd_profile_id\":1,\"attainment\":\"College\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"family_members\":[{\"id\":1,\"pwd_profile_id\":1,\"relation_type\":\"Father\",\"first_name\":\"Reynaldo\",\"last_name\":\"Calapao\",\"middle_name\":\"Suarez\",\"age\":null,\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},{\"id\":2,\"pwd_profile_id\":1,\"relation_type\":\"Mother\",\"first_name\":\"Anatalia\",\"last_name\":\"Calapao\",\"middle_name\":\"Suarez\",\"age\":null,\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"}],\"government_ids\":[],\"household_info\":{\"id\":1,\"pwd_profile_id\":1,\"living_arrangement\":\"Living with Family\",\"receiving_support\":false,\"is_pensioner\":false,\"pension_type\":null,\"monthly_pension\":null,\"income_source\":\"Allowance\",\"monthly_income\":\"3000.00\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"organization\":null}',1,'Updated: status','2026-02-04 05:34:45','2026-02-04 05:34:45','2026-02-04 05:34:45'),(3,1,4,'{\"id\":1,\"pwd_number\":null,\"first_name\":\"Jan Reinnen\",\"last_name\":\"Calapao\",\"middle_name\":\"Suarez\",\"suffix\":null,\"date_applied\":\"2026-02-03T16:00:00.000000Z\",\"status\":\"ACTIVE\",\"current_version\":3,\"remarks\":\"hahahaha\",\"accessibility_needs\":\"Wheel chair\",\"service_needs\":\"Medical Assurance\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:45.000000Z\",\"deleted_at\":null,\"address\":{\"id\":1,\"pwd_profile_id\":1,\"house_street\":\"052 Ibaba Subdivision\",\"barangay_id\":14,\"city\":\"Pagsanjan\",\"province\":\"Laguna\",\"region\":\"4A\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\",\"barangay\":{\"id\":14,\"name\":\"Pinagsanjan\",\"code\":\"PIN\",\"is_active\":true,\"created_at\":\"2026-02-04T05:26:53.000000Z\",\"updated_at\":\"2026-02-04T05:26:53.000000Z\"}},\"personal_info\":{\"id\":1,\"pwd_profile_id\":1,\"birth_date\":\"2003-07-08T16:00:00.000000Z\",\"birth_place\":\"Sn. Pablo City\",\"sex\":\"Male\",\"religion\":\"Catholic\",\"ethnic_group\":\"Aeta\",\"civil_status\":\"Single\",\"blood_type\":\"O+\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:36:44.000000Z\"},\"contacts\":{\"id\":1,\"pwd_profile_id\":1,\"mobile\":\"09616969801\",\"landline\":null,\"email\":\"renzcalapao12@gmail.com\",\"guardian_contact\":\"09996871601\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"disabilities\":[{\"id\":2,\"pwd_profile_id\":1,\"disability_type_id\":5,\"cause\":\"Acquired\",\"cause_details\":null,\"is_primary\":true,\"created_at\":\"2026-02-04T05:36:44.000000Z\",\"updated_at\":\"2026-02-04T05:36:44.000000Z\",\"disability_type\":{\"id\":5,\"name\":\"Mental\",\"code\":\"MEN\",\"description\":\"Mental health conditions affecting daily functioning\",\"is_active\":true,\"created_at\":\"2026-02-04T05:26:41.000000Z\",\"updated_at\":\"2026-02-04T05:26:41.000000Z\"}}],\"employment\":{\"id\":1,\"pwd_profile_id\":1,\"status\":\"Self-Employed\",\"category\":null,\"type\":null,\"occupation\":\"None\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"education\":{\"id\":1,\"pwd_profile_id\":1,\"attainment\":\"College\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"family_members\":[{\"id\":1,\"pwd_profile_id\":1,\"relation_type\":\"Father\",\"first_name\":\"Reynaldo\",\"last_name\":\"Calapao\",\"middle_name\":\"Suarez\",\"age\":null,\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},{\"id\":2,\"pwd_profile_id\":1,\"relation_type\":\"Mother\",\"first_name\":\"Anatalia\",\"last_name\":\"Calapao\",\"middle_name\":\"Suarez\",\"age\":null,\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"}],\"government_ids\":[],\"household_info\":{\"id\":1,\"pwd_profile_id\":1,\"living_arrangement\":\"Living with Family\",\"receiving_support\":false,\"is_pensioner\":false,\"pension_type\":null,\"monthly_pension\":null,\"income_source\":\"Allowance\",\"monthly_income\":\"3000.00\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"organization\":null}',1,'address, disabilities','2026-02-04 05:36:44','2026-02-04 05:36:44','2026-02-04 05:36:44'),(4,1,4,'{\"id\":1,\"pwd_number\":null,\"first_name\":\"Jan Reinnen\",\"last_name\":\"Calapao\",\"middle_name\":\"Suarez\",\"suffix\":null,\"date_applied\":\"2026-02-03T16:00:00.000000Z\",\"status\":\"DECEASED\",\"current_version\":4,\"remarks\":\"hahahaha\",\"accessibility_needs\":\"Wheel chair\",\"service_needs\":\"Medical Assurance\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:45:35.000000Z\",\"deleted_at\":null,\"personal_info\":{\"id\":1,\"pwd_profile_id\":1,\"birth_date\":\"2003-07-08T16:00:00.000000Z\",\"birth_place\":\"Sn. Pablo City\",\"sex\":\"Male\",\"religion\":\"Catholic\",\"ethnic_group\":\"Aeta\",\"civil_status\":\"Single\",\"blood_type\":\"O+\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:36:44.000000Z\"},\"address\":{\"id\":1,\"pwd_profile_id\":1,\"house_street\":\"052 Ibaba Subdivision\",\"barangay_id\":14,\"city\":\"Pagsanjan\",\"province\":\"Laguna\",\"region\":\"4A\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\",\"barangay\":{\"id\":14,\"name\":\"Pinagsanjan\",\"code\":\"PIN\",\"is_active\":true,\"created_at\":\"2026-02-04T05:26:53.000000Z\",\"updated_at\":\"2026-02-04T05:26:53.000000Z\"}},\"contacts\":{\"id\":1,\"pwd_profile_id\":1,\"mobile\":\"09616969801\",\"landline\":null,\"email\":\"renzcalapao12@gmail.com\",\"guardian_contact\":\"09996871601\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"disabilities\":[{\"id\":2,\"pwd_profile_id\":1,\"disability_type_id\":5,\"cause\":\"Acquired\",\"cause_details\":null,\"is_primary\":true,\"created_at\":\"2026-02-04T05:36:44.000000Z\",\"updated_at\":\"2026-02-04T05:36:44.000000Z\",\"disability_type\":{\"id\":5,\"name\":\"Mental\",\"code\":\"MEN\",\"description\":\"Mental health conditions affecting daily functioning\",\"is_active\":true,\"created_at\":\"2026-02-04T05:26:41.000000Z\",\"updated_at\":\"2026-02-04T05:26:41.000000Z\"}}],\"employment\":{\"id\":1,\"pwd_profile_id\":1,\"status\":\"Self-Employed\",\"category\":null,\"type\":null,\"occupation\":\"None\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"education\":{\"id\":1,\"pwd_profile_id\":1,\"attainment\":\"College\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"family_members\":[{\"id\":1,\"pwd_profile_id\":1,\"relation_type\":\"Father\",\"first_name\":\"Reynaldo\",\"last_name\":\"Calapao\",\"middle_name\":\"Suarez\",\"age\":null,\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},{\"id\":2,\"pwd_profile_id\":1,\"relation_type\":\"Mother\",\"first_name\":\"Anatalia\",\"last_name\":\"Calapao\",\"middle_name\":\"Suarez\",\"age\":null,\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"}],\"government_ids\":[],\"household_info\":{\"id\":1,\"pwd_profile_id\":1,\"living_arrangement\":\"Living with Family\",\"receiving_support\":false,\"is_pensioner\":false,\"pension_type\":null,\"monthly_pension\":null,\"income_source\":\"Allowance\",\"monthly_income\":\"3000.00\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"organization\":null}',1,'Updated: status','2026-02-04 05:45:36','2026-02-04 05:45:36','2026-02-04 05:45:36'),(5,1,6,'{\"id\":1,\"pwd_number\":null,\"first_name\":\"Jan Reinnen\",\"last_name\":\"Calapao\",\"middle_name\":\"Suarez\",\"suffix\":null,\"date_applied\":\"2026-02-03T16:00:00.000000Z\",\"status\":\"DECEASED\",\"current_version\":5,\"remarks\":\"hahahaha\",\"accessibility_needs\":\"Wheel chair\",\"service_needs\":\"Medical Assurance\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:45:35.000000Z\",\"deleted_at\":null,\"personal_info\":{\"id\":1,\"pwd_profile_id\":1,\"birth_date\":\"2003-07-08T16:00:00.000000Z\",\"birth_place\":\"Sn. Pablo City\",\"sex\":\"Male\",\"religion\":\"Catholic\",\"ethnic_group\":\"Aeta\",\"civil_status\":\"Single\",\"blood_type\":\"O+\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:36:44.000000Z\"},\"address\":{\"id\":1,\"pwd_profile_id\":1,\"house_street\":\"052 Ibaba Subdivision\",\"barangay_id\":14,\"city\":\"Pagsanjan\",\"province\":\"Laguna\",\"region\":\"4A\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\",\"barangay\":{\"id\":14,\"name\":\"Pinagsanjan\",\"code\":\"PIN\",\"is_active\":true,\"created_at\":\"2026-02-04T05:26:53.000000Z\",\"updated_at\":\"2026-02-04T05:26:53.000000Z\"}},\"contacts\":{\"id\":1,\"pwd_profile_id\":1,\"mobile\":\"09616969801\",\"landline\":null,\"email\":\"renzcalapao12@gmail.com\",\"guardian_contact\":\"09996871601\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"disabilities\":[{\"id\":2,\"pwd_profile_id\":1,\"disability_type_id\":5,\"cause\":\"Acquired\",\"cause_details\":null,\"is_primary\":true,\"created_at\":\"2026-02-04T05:36:44.000000Z\",\"updated_at\":\"2026-02-04T05:36:44.000000Z\",\"disability_type\":{\"id\":5,\"name\":\"Mental\",\"code\":\"MEN\",\"description\":\"Mental health conditions affecting daily functioning\",\"is_active\":true,\"created_at\":\"2026-02-04T05:26:41.000000Z\",\"updated_at\":\"2026-02-04T05:26:41.000000Z\"}}],\"employment\":{\"id\":1,\"pwd_profile_id\":1,\"status\":\"Self-Employed\",\"category\":null,\"type\":null,\"occupation\":\"None\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"education\":{\"id\":1,\"pwd_profile_id\":1,\"attainment\":\"College\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"family_members\":[{\"id\":1,\"pwd_profile_id\":1,\"relation_type\":\"Father\",\"first_name\":\"Reynaldo\",\"last_name\":\"Calapao\",\"middle_name\":\"Suarez\",\"age\":null,\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},{\"id\":2,\"pwd_profile_id\":1,\"relation_type\":\"Mother\",\"first_name\":\"Anatalia\",\"last_name\":\"Calapao\",\"middle_name\":\"Suarez\",\"age\":null,\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"}],\"government_ids\":[],\"household_info\":{\"id\":1,\"pwd_profile_id\":1,\"living_arrangement\":\"Living with Family\",\"receiving_support\":false,\"is_pensioner\":false,\"pension_type\":null,\"monthly_pension\":null,\"income_source\":\"Allowance\",\"monthly_income\":\"3000.00\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"organization\":null}',1,'Status changed from ACTIVE to DECEASED','2026-02-04 05:45:36','2026-02-04 05:45:36','2026-02-04 05:45:36'),(6,1,6,'{\"id\":1,\"pwd_number\":\"123333\",\"first_name\":\"Jan Reinnen\",\"last_name\":\"Calapao\",\"middle_name\":\"Suarez\",\"suffix\":null,\"date_applied\":\"2026-02-03T16:00:00.000000Z\",\"status\":\"DECEASED\",\"current_version\":6,\"remarks\":\"hahahaha\",\"accessibility_needs\":\"Wheel chair\",\"service_needs\":\"Medical Assurance\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T06:17:02.000000Z\",\"deleted_at\":null,\"personal_info\":{\"id\":1,\"pwd_profile_id\":1,\"birth_date\":\"2003-07-08T16:00:00.000000Z\",\"birth_place\":\"Sn. Pablo City\",\"sex\":\"Male\",\"religion\":\"Catholic\",\"ethnic_group\":\"Aeta\",\"civil_status\":\"Single\",\"blood_type\":\"O+\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:36:44.000000Z\"},\"address\":{\"id\":1,\"pwd_profile_id\":1,\"house_street\":\"052 Ibaba Subdivision\",\"barangay_id\":14,\"city\":\"Pagsanjan\",\"province\":\"Laguna\",\"region\":\"4A\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\",\"barangay\":{\"id\":14,\"name\":\"Pinagsanjan\",\"code\":\"PIN\",\"is_active\":true,\"created_at\":\"2026-02-04T05:26:53.000000Z\",\"updated_at\":\"2026-02-04T05:26:53.000000Z\"}},\"contacts\":{\"id\":1,\"pwd_profile_id\":1,\"mobile\":\"09616969801\",\"landline\":null,\"email\":\"renzcalapao12@gmail.com\",\"guardian_contact\":\"09996871601\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"disabilities\":[{\"id\":2,\"pwd_profile_id\":1,\"disability_type_id\":5,\"cause\":\"Acquired\",\"cause_details\":null,\"is_primary\":true,\"created_at\":\"2026-02-04T05:36:44.000000Z\",\"updated_at\":\"2026-02-04T05:36:44.000000Z\",\"disability_type\":{\"id\":5,\"name\":\"Mental\",\"code\":\"MEN\",\"description\":\"Mental health conditions affecting daily functioning\",\"is_active\":true,\"created_at\":\"2026-02-04T05:26:41.000000Z\",\"updated_at\":\"2026-02-04T05:26:41.000000Z\"}}],\"employment\":{\"id\":1,\"pwd_profile_id\":1,\"status\":\"Self-Employed\",\"category\":null,\"type\":null,\"occupation\":\"None\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"education\":{\"id\":1,\"pwd_profile_id\":1,\"attainment\":\"College\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"family_members\":[{\"id\":1,\"pwd_profile_id\":1,\"relation_type\":\"Father\",\"first_name\":\"Reynaldo\",\"last_name\":\"Calapao\",\"middle_name\":\"Suarez\",\"age\":null,\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},{\"id\":2,\"pwd_profile_id\":1,\"relation_type\":\"Mother\",\"first_name\":\"Anatalia\",\"last_name\":\"Calapao\",\"middle_name\":\"Suarez\",\"age\":null,\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"}],\"government_ids\":[],\"household_info\":{\"id\":1,\"pwd_profile_id\":1,\"living_arrangement\":\"Living with Family\",\"receiving_support\":false,\"is_pensioner\":false,\"pension_type\":null,\"monthly_pension\":null,\"income_source\":\"Allowance\",\"monthly_income\":\"3000.00\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"organization\":null}',1,'Updated: pwd_number','2026-02-04 06:17:02','2026-02-04 06:17:02','2026-02-04 06:17:02'),(7,1,8,'{\"id\":1,\"pwd_number\":\"123333\",\"first_name\":\"Jan Reinnen\",\"last_name\":\"Calapao\",\"middle_name\":\"Suarez\",\"suffix\":null,\"date_applied\":\"2026-02-03T16:00:00.000000Z\",\"status\":\"DECEASED\",\"current_version\":7,\"remarks\":\"hahahaha\",\"accessibility_needs\":\"Wheel chair\",\"service_needs\":\"Medical Assurance\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T06:17:02.000000Z\",\"deleted_at\":null,\"personal_info\":{\"id\":1,\"pwd_profile_id\":1,\"birth_date\":\"2003-07-07T16:00:00.000000Z\",\"birth_place\":\"Sn. Pablo City\",\"sex\":\"Male\",\"religion\":\"Catholic\",\"ethnic_group\":\"Aeta\",\"civil_status\":\"Single\",\"blood_type\":\"O+\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T06:17:02.000000Z\"},\"address\":{\"id\":1,\"pwd_profile_id\":1,\"house_street\":\"052 Ibaba Subdivision\",\"barangay_id\":14,\"city\":\"Pagsanjan\",\"province\":\"Laguna\",\"region\":\"4A\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\",\"barangay\":{\"id\":14,\"name\":\"Pinagsanjan\",\"code\":\"PIN\",\"is_active\":true,\"created_at\":\"2026-02-04T05:26:53.000000Z\",\"updated_at\":\"2026-02-04T05:26:53.000000Z\"}},\"contacts\":{\"id\":1,\"pwd_profile_id\":1,\"mobile\":\"09616969801\",\"landline\":null,\"email\":\"renzcalapao12@gmail.com\",\"guardian_contact\":\"09996871601\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"disabilities\":[{\"id\":3,\"pwd_profile_id\":1,\"disability_type_id\":5,\"cause\":\"Acquired\",\"cause_details\":null,\"is_primary\":true,\"created_at\":\"2026-02-04T06:17:02.000000Z\",\"updated_at\":\"2026-02-04T06:17:02.000000Z\",\"disability_type\":{\"id\":5,\"name\":\"Mental\",\"code\":\"MEN\",\"description\":\"Mental health conditions affecting daily functioning\",\"is_active\":true,\"created_at\":\"2026-02-04T05:26:41.000000Z\",\"updated_at\":\"2026-02-04T05:26:41.000000Z\"}}],\"employment\":{\"id\":1,\"pwd_profile_id\":1,\"status\":\"Self-Employed\",\"category\":null,\"type\":null,\"occupation\":\"None\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"education\":{\"id\":1,\"pwd_profile_id\":1,\"attainment\":\"College\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"family_members\":[{\"id\":1,\"pwd_profile_id\":1,\"relation_type\":\"Father\",\"first_name\":\"Reynaldo\",\"last_name\":\"Calapao\",\"middle_name\":\"Suarez\",\"age\":null,\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},{\"id\":2,\"pwd_profile_id\":1,\"relation_type\":\"Mother\",\"first_name\":\"Anatalia\",\"last_name\":\"Calapao\",\"middle_name\":\"Suarez\",\"age\":null,\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"}],\"government_ids\":[],\"household_info\":{\"id\":1,\"pwd_profile_id\":1,\"living_arrangement\":\"Living with Family\",\"receiving_support\":false,\"is_pensioner\":false,\"pension_type\":null,\"monthly_pension\":null,\"income_source\":\"Allowance\",\"monthly_income\":\"3000.00\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"organization\":null}',1,'address, disabilities','2026-02-04 06:17:02','2026-02-04 06:17:02','2026-02-04 06:17:02'),(8,2,1,'{\"pwd_number\":null,\"first_name\":\"Rolan\",\"last_name\":\"Sotomayor\",\"middle_name\":\"Castillo\",\"suffix\":null,\"date_applied\":\"2026-02-04T16:00:00.000000Z\",\"status\":\"ACTIVE\",\"current_version\":1,\"remarks\":\"For printing ID\",\"accessibility_needs\":\"Wheelchair\",\"service_needs\":\"Livelihood\",\"updated_at\":\"2026-02-05T01:31:12.000000Z\",\"created_at\":\"2026-02-05T01:31:12.000000Z\",\"id\":2,\"personal_info\":null,\"address\":null,\"contacts\":null,\"disabilities\":[],\"employment\":null,\"education\":null,\"family_members\":[],\"government_ids\":[],\"household_info\":null,\"organization\":null}',1,'Initial registration','2026-02-05 01:31:13','2026-02-05 01:31:13','2026-02-05 01:31:13'),(9,1,9,'{\"id\":1,\"pwd_number\":\"123333\",\"first_name\":\"Jan Reinnen\",\"last_name\":\"Calapao\",\"middle_name\":\"Suarez\",\"suffix\":null,\"date_applied\":\"2026-02-03T16:00:00.000000Z\",\"status\":\"DECEASED\",\"current_version\":8,\"remarks\":\"hahahaha\",\"accessibility_needs\":\"Wheel chair\",\"service_needs\":\"Medical Assurance\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T06:17:02.000000Z\",\"deleted_at\":null,\"address\":{\"id\":1,\"pwd_profile_id\":1,\"house_street\":\"052 Ibaba Subdivision\",\"barangay_id\":14,\"city\":\"Pagsanjan\",\"province\":\"Laguna\",\"region\":\"4A\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\",\"barangay\":{\"id\":14,\"name\":\"Pinagsanjan\",\"code\":\"PIN\",\"is_active\":true,\"created_at\":\"2026-02-04T05:26:53.000000Z\",\"updated_at\":\"2026-02-04T05:26:53.000000Z\"}},\"personal_info\":{\"id\":1,\"pwd_profile_id\":1,\"birth_date\":\"2004-07-07T16:00:00.000000Z\",\"birth_place\":\"Sn. Pablo City\",\"sex\":\"Male\",\"religion\":\"Catholic\",\"ethnic_group\":\"Aeta\",\"civil_status\":\"Single\",\"blood_type\":\"O+\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-05T02:01:21.000000Z\"},\"contacts\":{\"id\":1,\"pwd_profile_id\":1,\"mobile\":\"09616969801\",\"landline\":null,\"email\":\"renzcalapao12@gmail.com\",\"guardian_contact\":\"09996871601\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"disabilities\":[{\"id\":5,\"pwd_profile_id\":1,\"disability_type_id\":5,\"cause\":\"Acquired\",\"cause_details\":null,\"is_primary\":true,\"created_at\":\"2026-02-05T02:01:21.000000Z\",\"updated_at\":\"2026-02-05T02:01:21.000000Z\",\"disability_type\":{\"id\":5,\"name\":\"Mental\",\"code\":\"MEN\",\"description\":\"Mental health conditions affecting daily functioning\",\"is_active\":true,\"created_at\":\"2026-02-04T05:26:41.000000Z\",\"updated_at\":\"2026-02-04T05:26:41.000000Z\"}}],\"employment\":{\"id\":1,\"pwd_profile_id\":1,\"status\":\"Self-Employed\",\"category\":null,\"type\":null,\"occupation\":\"None\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"education\":{\"id\":1,\"pwd_profile_id\":1,\"attainment\":\"College\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"family_members\":[{\"id\":1,\"pwd_profile_id\":1,\"relation_type\":\"Father\",\"first_name\":\"Reynaldo\",\"last_name\":\"Calapao\",\"middle_name\":\"Suarez\",\"age\":null,\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},{\"id\":2,\"pwd_profile_id\":1,\"relation_type\":\"Mother\",\"first_name\":\"Anatalia\",\"last_name\":\"Calapao\",\"middle_name\":\"Suarez\",\"age\":null,\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"}],\"government_ids\":[],\"household_info\":{\"id\":1,\"pwd_profile_id\":1,\"living_arrangement\":\"Living with Family\",\"receiving_support\":false,\"is_pensioner\":false,\"pension_type\":null,\"monthly_pension\":null,\"income_source\":\"Allowance\",\"monthly_income\":\"3000.00\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"organization\":null}',1,'address, disabilities','2026-02-05 02:01:21','2026-02-05 02:01:21','2026-02-05 02:01:21'),(10,2,3,'{\"id\":2,\"pwd_number\":null,\"first_name\":\"Rolan\",\"last_name\":\"Sotomayor\",\"middle_name\":\"Castillo\",\"suffix\":null,\"date_applied\":\"2026-02-04T16:00:00.000000Z\",\"status\":\"ACTIVE\",\"current_version\":2,\"remarks\":\"For printing ID\",\"accessibility_needs\":\"Wheelchair\",\"service_needs\":\"Livelihood\",\"created_at\":\"2026-02-05T01:31:12.000000Z\",\"updated_at\":\"2026-02-05T01:31:13.000000Z\",\"deleted_at\":null,\"address\":{\"id\":2,\"pwd_profile_id\":2,\"house_street\":\"69 Kalye Putol\",\"barangay_id\":7,\"city\":\"Pagsanjan\",\"province\":\"Laguna\",\"region\":\"4A\",\"created_at\":\"2026-02-05T01:31:13.000000Z\",\"updated_at\":\"2026-02-05T01:31:13.000000Z\",\"barangay\":{\"id\":7,\"name\":\"Cabanbanan\",\"code\":\"CAB\",\"is_active\":true,\"created_at\":\"2026-02-04T05:26:53.000000Z\",\"updated_at\":\"2026-02-04T05:26:53.000000Z\"}},\"personal_info\":{\"id\":2,\"pwd_profile_id\":2,\"birth_date\":\"2003-07-17T16:00:00.000000Z\",\"birth_place\":\"Magdalena, Laguna\",\"sex\":\"Male\",\"religion\":\"Catholic\",\"ethnic_group\":null,\"civil_status\":\"Married\",\"blood_type\":\"A+\",\"created_at\":\"2026-02-05T01:31:13.000000Z\",\"updated_at\":\"2026-02-05T02:07:31.000000Z\"},\"contacts\":{\"id\":2,\"pwd_profile_id\":2,\"mobile\":\"091231238855\",\"landline\":\"132777\",\"email\":\"rolan@gmail.com\",\"guardian_contact\":null,\"created_at\":\"2026-02-05T01:31:13.000000Z\",\"updated_at\":\"2026-02-05T01:31:13.000000Z\"},\"disabilities\":[{\"id\":6,\"pwd_profile_id\":2,\"disability_type_id\":2,\"cause\":\"Acquired\",\"cause_details\":null,\"is_primary\":true,\"created_at\":\"2026-02-05T02:07:31.000000Z\",\"updated_at\":\"2026-02-05T02:07:31.000000Z\",\"disability_type\":{\"id\":2,\"name\":\"Deaf or Hard of Hearing\",\"code\":\"DHH\",\"description\":\"Hearing impairment or deafness\",\"is_active\":true,\"created_at\":\"2026-02-04T05:26:41.000000Z\",\"updated_at\":\"2026-02-04T05:26:41.000000Z\"}}],\"employment\":{\"id\":2,\"pwd_profile_id\":2,\"status\":\"Unemployed\",\"category\":null,\"type\":null,\"occupation\":\"None\",\"created_at\":\"2026-02-05T01:31:13.000000Z\",\"updated_at\":\"2026-02-05T01:31:13.000000Z\"},\"education\":{\"id\":2,\"pwd_profile_id\":2,\"attainment\":\"College\",\"created_at\":\"2026-02-05T01:31:13.000000Z\",\"updated_at\":\"2026-02-05T01:31:13.000000Z\"},\"family_members\":[],\"government_ids\":[{\"id\":1,\"pwd_profile_id\":2,\"id_type\":\"SSS\",\"id_number\":\"45532\",\"created_at\":\"2026-02-05T01:31:13.000000Z\",\"updated_at\":\"2026-02-05T01:31:13.000000Z\"},{\"id\":2,\"pwd_profile_id\":2,\"id_type\":\"GSIS\",\"id_number\":\"234422\",\"created_at\":\"2026-02-05T01:31:13.000000Z\",\"updated_at\":\"2026-02-05T01:31:13.000000Z\"},{\"id\":3,\"pwd_profile_id\":2,\"id_type\":\"PhilHealth\",\"id_number\":\"1245655\",\"created_at\":\"2026-02-05T01:31:13.000000Z\",\"updated_at\":\"2026-02-05T01:31:13.000000Z\"},{\"id\":4,\"pwd_profile_id\":2,\"id_type\":\"Pag-IBIG\",\"id_number\":\"1245324\",\"created_at\":\"2026-02-05T01:31:13.000000Z\",\"updated_at\":\"2026-02-05T01:31:13.000000Z\"}],\"household_info\":{\"id\":2,\"pwd_profile_id\":2,\"living_arrangement\":\"Living with Husband\\/Wife\",\"receiving_support\":false,\"is_pensioner\":false,\"pension_type\":null,\"monthly_pension\":null,\"income_source\":\"Allowance\",\"monthly_income\":\"100000.00\",\"created_at\":\"2026-02-05T01:31:13.000000Z\",\"updated_at\":\"2026-02-05T01:31:13.000000Z\"},\"organization\":null}',1,'address, disabilities','2026-02-05 02:07:32','2026-02-05 02:07:32','2026-02-05 02:07:32'),(11,2,4,'{\"id\":2,\"pwd_number\":null,\"first_name\":\"Rolan\",\"last_name\":\"Sotomayor\",\"middle_name\":\"Castillo\",\"suffix\":null,\"date_applied\":\"2026-02-04T16:00:00.000000Z\",\"status\":\"ACTIVE\",\"current_version\":3,\"remarks\":\"For printing ID\",\"accessibility_needs\":\"Wheelchair\",\"service_needs\":\"Livelihood\",\"created_at\":\"2026-02-05T01:31:12.000000Z\",\"updated_at\":\"2026-02-05T02:07:32.000000Z\",\"deleted_at\":null,\"address\":{\"id\":2,\"pwd_profile_id\":2,\"house_street\":\"69 Kalye Putol\",\"barangay_id\":7,\"city\":\"Pagsanjan\",\"province\":\"Laguna\",\"region\":\"4A\",\"created_at\":\"2026-02-05T01:31:13.000000Z\",\"updated_at\":\"2026-02-05T01:31:13.000000Z\",\"barangay\":{\"id\":7,\"name\":\"Cabanbanan\",\"code\":\"CAB\",\"is_active\":true,\"created_at\":\"2026-02-04T05:26:53.000000Z\",\"updated_at\":\"2026-02-04T05:26:53.000000Z\"}},\"personal_info\":{\"id\":2,\"pwd_profile_id\":2,\"birth_date\":\"2003-10-06T16:00:00.000000Z\",\"birth_place\":\"Magdalena, Laguna\",\"sex\":\"Male\",\"religion\":\"Catholic\",\"ethnic_group\":null,\"civil_status\":\"Married\",\"blood_type\":\"A+\",\"created_at\":\"2026-02-05T01:31:13.000000Z\",\"updated_at\":\"2026-02-05T02:20:31.000000Z\"},\"contacts\":{\"id\":2,\"pwd_profile_id\":2,\"mobile\":\"091231238855\",\"landline\":\"132777\",\"email\":\"rolan@gmail.com\",\"guardian_contact\":null,\"created_at\":\"2026-02-05T01:31:13.000000Z\",\"updated_at\":\"2026-02-05T01:31:13.000000Z\"},\"disabilities\":[{\"id\":7,\"pwd_profile_id\":2,\"disability_type_id\":2,\"cause\":\"Acquired\",\"cause_details\":null,\"is_primary\":true,\"created_at\":\"2026-02-05T02:20:31.000000Z\",\"updated_at\":\"2026-02-05T02:20:31.000000Z\",\"disability_type\":{\"id\":2,\"name\":\"Deaf or Hard of Hearing\",\"code\":\"DHH\",\"description\":\"Hearing impairment or deafness\",\"is_active\":true,\"created_at\":\"2026-02-04T05:26:41.000000Z\",\"updated_at\":\"2026-02-04T05:26:41.000000Z\"}}],\"employment\":{\"id\":2,\"pwd_profile_id\":2,\"status\":\"Unemployed\",\"category\":null,\"type\":null,\"occupation\":\"None\",\"created_at\":\"2026-02-05T01:31:13.000000Z\",\"updated_at\":\"2026-02-05T01:31:13.000000Z\"},\"education\":{\"id\":2,\"pwd_profile_id\":2,\"attainment\":\"College\",\"created_at\":\"2026-02-05T01:31:13.000000Z\",\"updated_at\":\"2026-02-05T01:31:13.000000Z\"},\"family_members\":[],\"government_ids\":[{\"id\":1,\"pwd_profile_id\":2,\"id_type\":\"SSS\",\"id_number\":\"45532\",\"created_at\":\"2026-02-05T01:31:13.000000Z\",\"updated_at\":\"2026-02-05T01:31:13.000000Z\"},{\"id\":2,\"pwd_profile_id\":2,\"id_type\":\"GSIS\",\"id_number\":\"234422\",\"created_at\":\"2026-02-05T01:31:13.000000Z\",\"updated_at\":\"2026-02-05T01:31:13.000000Z\"},{\"id\":3,\"pwd_profile_id\":2,\"id_type\":\"PhilHealth\",\"id_number\":\"1245655\",\"created_at\":\"2026-02-05T01:31:13.000000Z\",\"updated_at\":\"2026-02-05T01:31:13.000000Z\"},{\"id\":4,\"pwd_profile_id\":2,\"id_type\":\"Pag-IBIG\",\"id_number\":\"1245324\",\"created_at\":\"2026-02-05T01:31:13.000000Z\",\"updated_at\":\"2026-02-05T01:31:13.000000Z\"}],\"household_info\":{\"id\":2,\"pwd_profile_id\":2,\"living_arrangement\":\"Living with Husband\\/Wife\",\"receiving_support\":false,\"is_pensioner\":false,\"pension_type\":null,\"monthly_pension\":null,\"income_source\":\"Allowance\",\"monthly_income\":\"100000.00\",\"created_at\":\"2026-02-05T01:31:13.000000Z\",\"updated_at\":\"2026-02-05T01:31:13.000000Z\"},\"organization\":null}',1,'address, disabilities','2026-02-05 02:20:31','2026-02-05 02:20:31','2026-02-05 02:20:31'),(12,1,10,'{\"id\":1,\"pwd_number\":\"123333\",\"first_name\":\"Jan Reinnen\",\"last_name\":\"Calapao\",\"middle_name\":\"Suarez\",\"suffix\":null,\"date_applied\":\"2026-02-03T16:00:00.000000Z\",\"status\":\"DECEASED\",\"current_version\":9,\"remarks\":\"hahahaha\",\"accessibility_needs\":\"Wheel chair\",\"service_needs\":\"Medical Assurance\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-05T02:01:21.000000Z\",\"deleted_at\":null,\"address\":{\"id\":1,\"pwd_profile_id\":1,\"house_street\":\"052 Ibaba Subdivision\",\"barangay_id\":14,\"city\":\"Pagsanjan\",\"province\":\"Laguna\",\"region\":\"4A\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\",\"barangay\":{\"id\":14,\"name\":\"Pinagsanjan\",\"code\":\"PIN\",\"is_active\":true,\"created_at\":\"2026-02-04T05:26:53.000000Z\",\"updated_at\":\"2026-02-04T05:26:53.000000Z\"}},\"personal_info\":{\"id\":1,\"pwd_profile_id\":1,\"birth_date\":\"2003-10-06T16:00:00.000000Z\",\"birth_place\":\"Sn. Pablo City\",\"sex\":\"Male\",\"religion\":\"Catholic\",\"ethnic_group\":\"Aeta\",\"civil_status\":\"Single\",\"blood_type\":\"O+\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-05T02:21:26.000000Z\"},\"contacts\":{\"id\":1,\"pwd_profile_id\":1,\"mobile\":\"09616969801\",\"landline\":null,\"email\":\"renzcalapao12@gmail.com\",\"guardian_contact\":\"09996871601\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"disabilities\":[{\"id\":8,\"pwd_profile_id\":1,\"disability_type_id\":5,\"cause\":\"Acquired\",\"cause_details\":null,\"is_primary\":true,\"created_at\":\"2026-02-05T02:21:26.000000Z\",\"updated_at\":\"2026-02-05T02:21:26.000000Z\",\"disability_type\":{\"id\":5,\"name\":\"Mental\",\"code\":\"MEN\",\"description\":\"Mental health conditions affecting daily functioning\",\"is_active\":true,\"created_at\":\"2026-02-04T05:26:41.000000Z\",\"updated_at\":\"2026-02-04T05:26:41.000000Z\"}}],\"employment\":{\"id\":1,\"pwd_profile_id\":1,\"status\":\"Self-Employed\",\"category\":null,\"type\":null,\"occupation\":\"None\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"education\":{\"id\":1,\"pwd_profile_id\":1,\"attainment\":\"College\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"family_members\":[{\"id\":1,\"pwd_profile_id\":1,\"relation_type\":\"Father\",\"first_name\":\"Reynaldo\",\"last_name\":\"Calapao\",\"middle_name\":\"Suarez\",\"age\":null,\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},{\"id\":2,\"pwd_profile_id\":1,\"relation_type\":\"Mother\",\"first_name\":\"Anatalia\",\"last_name\":\"Calapao\",\"middle_name\":\"Suarez\",\"age\":null,\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"}],\"government_ids\":[],\"household_info\":{\"id\":1,\"pwd_profile_id\":1,\"living_arrangement\":\"Living with Family\",\"receiving_support\":false,\"is_pensioner\":false,\"pension_type\":null,\"monthly_pension\":null,\"income_source\":\"Allowance\",\"monthly_income\":\"3000.00\",\"created_at\":\"2026-02-04T05:34:10.000000Z\",\"updated_at\":\"2026-02-04T05:34:10.000000Z\"},\"organization\":null}',1,'address, disabilities','2026-02-05 02:21:26','2026-02-05 02:21:26','2026-02-05 02:21:26'),(13,2,5,'{\"id\":2,\"pwd_number\":null,\"first_name\":\"Rolan\",\"last_name\":\"Sotomayor\",\"middle_name\":\"Castillo\",\"suffix\":null,\"date_applied\":\"2026-02-04T16:00:00.000000Z\",\"status\":\"ACTIVE\",\"current_version\":4,\"remarks\":\"For printing ID\",\"accessibility_needs\":\"Wheelchair\",\"service_needs\":\"Livelihood\",\"created_at\":\"2026-02-05T01:31:12.000000Z\",\"updated_at\":\"2026-02-05T02:20:31.000000Z\",\"deleted_at\":null,\"address\":{\"id\":2,\"pwd_profile_id\":2,\"house_street\":\"69 Kalye Putol\",\"barangay_id\":7,\"city\":\"Pagsanjan\",\"province\":\"Laguna\",\"region\":\"4A\",\"created_at\":\"2026-02-05T01:31:13.000000Z\",\"updated_at\":\"2026-02-05T01:31:13.000000Z\",\"barangay\":{\"id\":7,\"name\":\"Cabanbanan\",\"code\":\"CAB\",\"is_active\":true,\"created_at\":\"2026-02-04T05:26:53.000000Z\",\"updated_at\":\"2026-02-04T05:26:53.000000Z\"}},\"personal_info\":{\"id\":2,\"pwd_profile_id\":2,\"birth_date\":\"2003-07-15T16:00:00.000000Z\",\"birth_place\":\"Magdalena, Laguna\",\"sex\":\"Male\",\"religion\":\"Catholic\",\"ethnic_group\":null,\"civil_status\":\"Married\",\"blood_type\":\"A+\",\"created_at\":\"2026-02-05T01:31:13.000000Z\",\"updated_at\":\"2026-02-05T02:21:49.000000Z\"},\"contacts\":{\"id\":2,\"pwd_profile_id\":2,\"mobile\":\"091231238855\",\"landline\":\"132777\",\"email\":\"rolan@gmail.com\",\"guardian_contact\":null,\"created_at\":\"2026-02-05T01:31:13.000000Z\",\"updated_at\":\"2026-02-05T01:31:13.000000Z\"},\"disabilities\":[{\"id\":9,\"pwd_profile_id\":2,\"disability_type_id\":2,\"cause\":\"Acquired\",\"cause_details\":null,\"is_primary\":true,\"created_at\":\"2026-02-05T02:21:49.000000Z\",\"updated_at\":\"2026-02-05T02:21:49.000000Z\",\"disability_type\":{\"id\":2,\"name\":\"Deaf or Hard of Hearing\",\"code\":\"DHH\",\"description\":\"Hearing impairment or deafness\",\"is_active\":true,\"created_at\":\"2026-02-04T05:26:41.000000Z\",\"updated_at\":\"2026-02-04T05:26:41.000000Z\"}}],\"employment\":{\"id\":2,\"pwd_profile_id\":2,\"status\":\"Unemployed\",\"category\":null,\"type\":null,\"occupation\":\"None\",\"created_at\":\"2026-02-05T01:31:13.000000Z\",\"updated_at\":\"2026-02-05T01:31:13.000000Z\"},\"education\":{\"id\":2,\"pwd_profile_id\":2,\"attainment\":\"College\",\"created_at\":\"2026-02-05T01:31:13.000000Z\",\"updated_at\":\"2026-02-05T01:31:13.000000Z\"},\"family_members\":[],\"government_ids\":[{\"id\":1,\"pwd_profile_id\":2,\"id_type\":\"SSS\",\"id_number\":\"45532\",\"created_at\":\"2026-02-05T01:31:13.000000Z\",\"updated_at\":\"2026-02-05T01:31:13.000000Z\"},{\"id\":2,\"pwd_profile_id\":2,\"id_type\":\"GSIS\",\"id_number\":\"234422\",\"created_at\":\"2026-02-05T01:31:13.000000Z\",\"updated_at\":\"2026-02-05T01:31:13.000000Z\"},{\"id\":3,\"pwd_profile_id\":2,\"id_type\":\"PhilHealth\",\"id_number\":\"1245655\",\"created_at\":\"2026-02-05T01:31:13.000000Z\",\"updated_at\":\"2026-02-05T01:31:13.000000Z\"},{\"id\":4,\"pwd_profile_id\":2,\"id_type\":\"Pag-IBIG\",\"id_number\":\"1245324\",\"created_at\":\"2026-02-05T01:31:13.000000Z\",\"updated_at\":\"2026-02-05T01:31:13.000000Z\"}],\"household_info\":{\"id\":2,\"pwd_profile_id\":2,\"living_arrangement\":\"Living with Husband\\/Wife\",\"receiving_support\":false,\"is_pensioner\":false,\"pension_type\":null,\"monthly_pension\":null,\"income_source\":\"Allowance\",\"monthly_income\":\"100000.00\",\"created_at\":\"2026-02-05T01:31:13.000000Z\",\"updated_at\":\"2026-02-05T01:31:13.000000Z\"},\"organization\":null}',1,'address, disabilities','2026-02-05 02:21:49','2026-02-05 02:21:49','2026-02-05 02:21:49'),(14,3,1,'{\"pwd_number\":null,\"first_name\":\"Jencel\",\"last_name\":\"Sofer\",\"middle_name\":null,\"suffix\":null,\"date_applied\":\"2026-02-04T16:00:00.000000Z\",\"status\":\"PENDING\",\"current_version\":1,\"remarks\":null,\"accessibility_needs\":null,\"service_needs\":null,\"updated_at\":\"2026-02-05T02:53:37.000000Z\",\"created_at\":\"2026-02-05T02:53:37.000000Z\",\"id\":3,\"personal_info\":null,\"address\":null,\"contacts\":null,\"disabilities\":[],\"employment\":null,\"education\":null,\"family_members\":[],\"government_ids\":[],\"household_info\":null,\"organization\":null}',4,'Initial registration','2026-02-05 02:53:37','2026-02-05 02:53:37','2026-02-05 02:53:37'),(15,3,2,'{\"id\":3,\"pwd_number\":null,\"first_name\":\"Jencel\",\"last_name\":\"Sofer\",\"middle_name\":null,\"suffix\":null,\"date_applied\":\"2026-02-04T16:00:00.000000Z\",\"status\":\"ACTIVE\",\"current_version\":2,\"remarks\":null,\"accessibility_needs\":null,\"service_needs\":null,\"created_at\":\"2026-02-05T02:53:37.000000Z\",\"updated_at\":\"2026-02-05T02:54:27.000000Z\",\"deleted_at\":null,\"personal_info\":{\"id\":3,\"pwd_profile_id\":3,\"birth_date\":\"2002-05-15T16:00:00.000000Z\",\"birth_place\":\"Duhat\",\"sex\":\"Male\",\"religion\":\"Catholic\",\"ethnic_group\":null,\"civil_status\":\"Single\",\"blood_type\":\"B+\",\"created_at\":\"2026-02-05T02:53:37.000000Z\",\"updated_at\":\"2026-02-05T02:53:37.000000Z\"},\"address\":{\"id\":3,\"pwd_profile_id\":3,\"house_street\":\"JNT Warehouse\",\"barangay_id\":11,\"city\":\"Pagsanjan\",\"province\":\"Laguna\",\"region\":\"4A\",\"created_at\":\"2026-02-05T02:53:37.000000Z\",\"updated_at\":\"2026-02-05T02:53:37.000000Z\",\"barangay\":{\"id\":11,\"name\":\"Layugan\",\"code\":\"LAY\",\"is_active\":true,\"created_at\":\"2026-02-04T05:26:53.000000Z\",\"updated_at\":\"2026-02-04T05:26:53.000000Z\"}},\"contacts\":{\"id\":3,\"pwd_profile_id\":3,\"mobile\":\"091424774744\",\"landline\":null,\"email\":\"jencel@gmail.com\",\"guardian_contact\":\"091231232111\",\"created_at\":\"2026-02-05T02:53:37.000000Z\",\"updated_at\":\"2026-02-05T02:53:37.000000Z\"},\"disabilities\":[{\"id\":10,\"pwd_profile_id\":3,\"disability_type_id\":10,\"cause\":\"Acquired\",\"cause_details\":null,\"is_primary\":true,\"created_at\":\"2026-02-05T02:53:37.000000Z\",\"updated_at\":\"2026-02-05T02:53:37.000000Z\",\"disability_type\":{\"id\":10,\"name\":\"Speech\\/Language\",\"code\":\"SPL\",\"description\":\"Speech or language impairments\",\"is_active\":true,\"created_at\":\"2026-02-04T05:26:41.000000Z\",\"updated_at\":\"2026-02-04T05:26:41.000000Z\"}}],\"employment\":{\"id\":3,\"pwd_profile_id\":3,\"status\":\"Employed\",\"category\":\"Private\",\"type\":\"Permanent\\/Regular\",\"occupation\":\"Loverboy\",\"created_at\":\"2026-02-05T02:53:37.000000Z\",\"updated_at\":\"2026-02-05T02:53:37.000000Z\"},\"education\":{\"id\":3,\"pwd_profile_id\":3,\"attainment\":\"Non-formal\",\"created_at\":\"2026-02-05T02:53:37.000000Z\",\"updated_at\":\"2026-02-05T02:53:37.000000Z\"},\"family_members\":[],\"government_ids\":[],\"household_info\":{\"id\":3,\"pwd_profile_id\":3,\"living_arrangement\":\"Living Alone\",\"receiving_support\":false,\"is_pensioner\":false,\"pension_type\":null,\"monthly_pension\":null,\"income_source\":\"Work\",\"monthly_income\":\"766999.00\",\"created_at\":\"2026-02-05T02:53:37.000000Z\",\"updated_at\":\"2026-02-05T02:53:37.000000Z\"},\"organization\":null}',1,'Updated: status','2026-02-05 02:54:28','2026-02-05 02:54:28','2026-02-05 02:54:28'),(16,4,1,'{\"pwd_number\":null,\"first_name\":\"Kate Ashley\",\"last_name\":\"Macasaet\",\"middle_name\":null,\"suffix\":null,\"date_applied\":\"2026-02-05T16:00:00.000000Z\",\"status\":\"ACTIVE\",\"current_version\":1,\"remarks\":null,\"accessibility_needs\":null,\"service_needs\":null,\"updated_at\":\"2026-02-06T00:34:58.000000Z\",\"created_at\":\"2026-02-06T00:34:58.000000Z\",\"id\":4,\"personal_info\":null,\"address\":null,\"contacts\":null,\"disabilities\":[],\"employment\":null,\"education\":null,\"family_members\":[],\"government_ids\":[],\"household_info\":null,\"organization\":null}',1,'Initial registration','2026-02-06 00:34:58','2026-02-06 00:34:58','2026-02-06 00:34:58');
/*!40000 ALTER TABLE `pwd_profile_versions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pwd_profiles`
--

DROP TABLE IF EXISTS `pwd_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pwd_profiles` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `pwd_number` varchar(255) DEFAULT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `middle_name` varchar(255) DEFAULT NULL,
  `suffix` varchar(255) DEFAULT NULL,
  `date_applied` date DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE','DECEASED','PENDING','UNDER_REVIEW') DEFAULT 'ACTIVE',
  `current_version` int(10) unsigned NOT NULL DEFAULT 1,
  `remarks` text DEFAULT NULL,
  `accessibility_needs` text DEFAULT NULL,
  `service_needs` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pwd_profiles_pwd_number_unique` (`pwd_number`),
  KEY `pwd_profiles_status_index` (`status`),
  KEY `pwd_profiles_last_name_index` (`last_name`),
  KEY `pwd_profiles_first_name_index` (`first_name`),
  KEY `pwd_profiles_date_applied_index` (`date_applied`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pwd_profiles`
--

LOCK TABLES `pwd_profiles` WRITE;
/*!40000 ALTER TABLE `pwd_profiles` DISABLE KEYS */;
INSERT INTO `pwd_profiles` VALUES (1,'123333','Jan Reinnen','Calapao','Suarez',NULL,'2026-02-04','DECEASED',10,'hahahaha','Wheel chair','Medical Assurance','2026-02-04 05:34:10','2026-02-05 02:21:26',NULL),(2,NULL,'Rolan','Sotomayor','Castillo',NULL,'2026-02-05','ACTIVE',5,'For printing ID','Wheelchair','Livelihood','2026-02-05 01:31:12','2026-02-05 02:21:49',NULL),(3,NULL,'Jencel','Sofer',NULL,NULL,'2026-02-05','ACTIVE',3,NULL,NULL,NULL,'2026-02-05 02:53:37','2026-02-05 02:54:28',NULL),(4,NULL,'Kate Ashley','Macasaet',NULL,NULL,'2026-02-06','ACTIVE',2,NULL,NULL,NULL,'2026-02-06 00:34:58','2026-02-06 00:34:58',NULL);
/*!40000 ALTER TABLE `pwd_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id_number` varchar(255) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `middle_name` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('ADMIN','STAFF','ENCODER','USER','PWD MEMBER') NOT NULL DEFAULT 'USER',
  `unit` varchar(255) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_id_number_unique` (`id_number`),
  KEY `users_role_index` (`role`),
  KEY `users_status_index` (`status`),
  KEY `users_id_number_index` (`id_number`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','Admin','User',NULL,'$2y$12$xA8.i.E6KAtYBQURckJnN.L45V8UYg.17hIBsC1NPCcv3nvIuFj3a','ADMIN',NULL,'ACTIVE',NULL,'2026-02-04 05:11:30','2026-02-04 06:14:59',NULL),(2,'staff','Staff','User',NULL,'$2y$12$jC0GPoYBkm7vXD7e4yMjbOkU/DhN0HAMRCyeP/Kn0JWsnA7VshhYC','STAFF',NULL,'ACTIVE',NULL,'2026-02-04 05:11:31','2026-02-04 06:15:00',NULL),(3,'mayor','Mayor','User',NULL,'$2y$12$R8bepe0hbTe3ES1/I6tJh.Tx5IhL.MlL5dYaYv632x3LeaMEx0oBa','ADMIN',NULL,'ACTIVE',NULL,'2026-02-04 05:11:31','2026-02-04 06:15:00',NULL),(4,'user','Regular','User',NULL,'$2y$12$7.gqq7esrsJxYfSk8NLiBeYlKI2EuRK2/v3ba7kVplPnjwR00jlnG','USER',NULL,'ACTIVE',NULL,'2026-02-04 05:11:31','2026-02-04 06:15:00',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-06 10:58:18
