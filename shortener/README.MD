# Usage
Fill the following environment variables.
```bash=
export dbHost=
export dbUser=
export dbPassword=
export dbName=
export redisConnectionString=
export enableRedis=
```
For example, the following configuration had been used for developmnet.
```bash=
export dbHost=127.0.0.1
export dbUser=lawrence910426
export dbPassword=2rjurrru
export dbName=urlshortener
export redisConnectionString='redis://localhost:6380'
export enableRedis=off
```
Then, install the project and run the project.
```bash=
npm install .
npm run start
```

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
