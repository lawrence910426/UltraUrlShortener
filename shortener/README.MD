# Hash algorithms
- SHA-1, MD5 are vulnerable to length extension attack
- SHA-512 is not vulnerable to length extension attack
- Collision possibility $C = 1 - \frac{P(n, m)}{m^n} \approx \frac{m^2}{2n}$ (Taylor expansion)
- Assume we have $m=10^30$ urls, take sha-512 which makes $n=2^512$, which makes $C \approx 3.72 \cdot 10^{-95}$.

# Security issues
- Avoided MySQL
- Inject username and password from environment variables
- System dead when 2038 (Unix timestamp)

# Using transaction instead of COUNT(*)
- https://codehunter.cc/a/database/mysql-complexity-of-select-count-from-mytable

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