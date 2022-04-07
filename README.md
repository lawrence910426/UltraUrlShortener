# 高流量的網址縮短器
顧名思義，這是個~~炫耀~~分享網址縮短器能做多快的小專案，峰值能處理 140+ qps，Github 連結[在此](https://github.com/lawrence910426/UltraUrlShortener)。

# 引言
最近投了 Dcard 實習，其中後端實習的功課就是寫個網址縮短器。然而，活在電腦世界中這麼久了，還沒好好用過 Redis/Load balancer 這些黑科技，~~為了在 Backend Taiwan 繼續混下去~~，我決定來好好跟黑科技奮戰一波。

# 架構設計
前端採用 Nginx 分配請求 (Request) 給後端，後端採用 Nodejs，資料庫採用 MySQL，記憶體快取 (Cache) 採用 Redis，下圖言簡意賅的顯示了整個架構。

![](https://i.imgur.com/DWKEmh0.png)

部署環境是 Google Compute Engine 一台，採用 `Docker-Compose` 執行單機部署，地區在 `us-central1-a`，型號是 `e2-medium`。

# 程式撰寫
由於丟的實習是後端工程師，需要實際撰寫程式碼的地方也落在後端，因此以下僅介紹後端的設計。後端採用 Express 框架開發，並有兩個主要的子程序 (Subprocess)，`redirect.js` 與 `upload.js`。

- `redirect.js` 負責重導向
    1. 程序會先問 Redis 紀錄是否存在
    2. 如果有紀錄的話，就直接用快取資料
    3. 否則，去資料庫拿資料
- `upload.js` 負責上傳新紀錄，為求資料正確性，以下操作都被包在一個 `Transaction` 裡面
    1. 程序會先問資料庫總共存有幾筆紀錄
    2. 將資料筆數 $N$ 以 36 進位表達，也就是以 `123...abc....` 的編碼方式表達，並作為短網址的 token
    3. 將短網址寫入資料庫
    4. 將短網址寫入快取 

為了避免 `SELECT COUNT(*)` 這種 [龜速的 $O(N)$ 操作](https://stackoverflow.com/questions/5257973/mysql-complexity-of-select-count-from-mytable)，我決定再額外開一個資料表 `sumTable`，資料表負責維護 `SELECT COUNT(*)` 的結果，這樣就能做到 $O(1)$ 新增與 $O(1)$ 查詢了。

# 效能與觀察
為了有效觀察效能的變化，我寫了一隻可視覺化的測試腳本，下圖採用 `matplotlib` 生成，~~字體過小傷眼請見諒~~。

### 兩台 Load balancer, 一台 Redis
本組設定下，兩台 Load balancer 會連線到同一台 Redis，並且這兩台 Load balancer 也會連到同一台資料庫，效能如下。

1. 不存在的網址查詢
![](https://i.imgur.com/BSUN0Cv.png)

2. 存在的網址查詢
![](https://i.imgur.com/XUiuBiE.png)

3. 寫入短網址
![](https://i.imgur.com/y40Zwzt.png)

4. 混和 (20% 不存在, 50% 查詢, 30% 寫入)
![](https://i.imgur.com/mLPLIJU.png)


### 兩台 Load balancer, 兩台 Redis
本組設定下，兩台 Load balancer 會分別連線到一台 Redis，然而，這兩台 Load balancer 會連線到同一台資料庫，效能如下。

1. 不存在的網址查詢
![](https://i.imgur.com/YtU3rN2.png)

2. 存在的網址查詢
![](https://i.imgur.com/NrvjJqK.png)

3. 寫入短網址
![](https://i.imgur.com/VhRVrmL.png)

4. 混和 (20% 不存在, 50% 查詢, 30% 寫入)
![](https://i.imgur.com/xR0tF7b.png)

### 兩台 Load balancer, 沒有 Redis
本組設定下，兩台 Load balancer 會直接連線到同一台資料庫，效能如下。

1. 不存在的網址查詢
![](https://i.imgur.com/2GesgiU.png)

2. 存在的網址查詢
![](https://i.imgur.com/DlLr0eA.png)

3. 寫入短網址
![](https://i.imgur.com/H1xZr6m.png)

4. 混和 (20% 不存在, 50% 查詢, 30% 寫入)
![](https://i.imgur.com/B7RJ1My.png)

### 三台 Load balancer, 三台 Redis
本組設定下，三台 Load balancer 會分別連線到三台 Redis，然而，這三台 Load balancer 會連線到同一台資料庫，效能如下。

1. 不存在的網址查詢
![](https://i.imgur.com/ZQfnefs.png)

2. 存在的網址查詢
![](https://i.imgur.com/QfXNvhS.png)

3. 寫入短網址
![](https://i.imgur.com/2xsVdms.png)

4. 混和 (20% 不存在, 50% 查詢, 30% 寫入)
![](https://i.imgur.com/P09zNF1.png)

## 小結
不論是哪組實驗，基本遵循一個大原則 -- Redis 開越多就跑越快。可以觀察到下列四個現象
- 如果沒有開 Redis，讀取速度（存在的網址查詢）只有大概 15 qps
- 如果有開 Redis，輕輕鬆鬆達到 100+ qps 都不在話下
- 不論有沒有開 Redis，寫入操作都差不多落在 50+ qps
- 開兩台 Load balancer 跟開三台 Load balancer 效能其實差不多

# 結語
> 一時開 Redis 一時爽，一直開 Redis 一直爽

從這次的小專案中，得到的結論就是狂開 Redis 就對了，與其多開一台 Load balancer，不如多開一台 Redis。

很感謝 Dcard 願意提供一個這麼酷的功課來讓我練習高流量設計，希望這篇文章能讓大家愛上 Redis，也希望能順利投上 Dcard！