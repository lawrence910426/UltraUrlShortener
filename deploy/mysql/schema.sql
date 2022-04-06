-- This file should be manually imported --
-- Docker compose does not always run this file, it may be a bug. --

CREATE DATABASE urlshortener;
USE urlshortener;

CREATE TABLE urls (
    url TEXT,
    expireAt INT,
    urlId VARCHAR(512) PRIMARY KEY 
);

CREATE TABLE sumTable (
    totalRows INT
);

INSERT INTO sumTable VALUES (0);

ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY '2rjurrru';
FLUSH PRIVILEGES;
