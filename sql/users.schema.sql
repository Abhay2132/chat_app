CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  full_name varchar(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash CHAR(60) NOT NULL,  -- Store hashed password, not plain text
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)