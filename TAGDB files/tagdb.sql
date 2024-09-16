CREATE DATABASE IF NOT EXISTS TagDB;
CREATE USER IF NOT EXISTS 'taguser'@'localhost' IDENTIFIED BY 'taggy';

USE TagDB;

CREATE TABLE IF NOT EXISTS tags (
    tag_id INT AUTO_INCREMENT PRIMARY KEY,
    tag_name VARCHAR(255) NOT NULL,
    UNIQUE(tag_name)
);
GRANT ALL PRIVILEGES ON TagDB.tags to taguser@localhost;

CREATE TABLE IF NOT EXISTS tag_values (
    value_id INT AUTO_INCREMENT PRIMARY KEY,
    tag_id INT,
    tag_value VARCHAR(255) NOT NULL,
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE,
    UNIQUE(tag_id, tag_value)
);
GRANT ALL PRIVILEGES ON TagDB.tag_values to taguser@localhost;

CREATE TABLE IF NOT EXISTS files (
    file_id INT AUTO_INCREMENT PRIMARY KEY,
    file_path VARCHAR(255) NOT NULL,
    UNIQUE(file_path)
);
GRANT ALL PRIVILEGES ON TagDB.files to taguser@localhost;

CREATE TABLE IF NOT EXISTS file_tags (
    file_id INT,
    value_id INT,
    FOREIGN KEY (file_id) REFERENCES files(file_id) ON DELETE CASCADE,
    FOREIGN KEY (value_id) REFERENCES tag_values(value_id) ON DELETE CASCADE,
    PRIMARY KEY (file_id, value_id)
);
GRANT ALL PRIVILEGES ON TagDB.file_tags to taguser@localhost;
