# Usage


# Security
- Avoided SQL Injection
- Inject username and password from environment variables
- System dead when 2038 (Unix timestamp)

# Performance
- Use another table to store COUNT(*) https://codehunter.cc/a/database/mysql-complexity-of-select-count-from-mytable
- Multiple read connection & Single write connection. (Assume more read operations)
- Redis cache.
- Stateless load balancer. (High scalability)

# Schema
```sql=
CREATE TABLE urls (
    url TEXT,
    expireAt INT,
    urlId VARCHAR(512) PRIMARY KEY 
)
CREATE TABLE sumTable (
    totalRows INT
)
```

```redis=
urlId, [url, expireAt], value
```

# Experiments
- No redis, 1 load balancer
- No redis, $N$ load balancer
- 1 redis, 1 load balancer
- 1 redis, $N$ load balancer
- $N$ redis, $N$ load balancer
