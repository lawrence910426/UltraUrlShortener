CREATE DATABASE urlshortener;
USE urlshortener;

CREATE TABLE urls (
    url TEXT,
    expireAt INT,
    urlId VARCHAR(512) PRIMARY KEY 
)
CREATE TABLE sumTable (
    totalRows INT
)