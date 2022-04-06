import requests
import time
import math
import random

SERVER_IP = 'localhost'
NON_EXIST_QUERIES_RATIO = 10
QUERY_RATIO = 50
NUMBER_OF_THREADS = 30

def write(url, expire):
    headers = {
        'Content-Type': 'application/json'
    }
    data = '{ "url": "' + url + '", "expireAt": "' + expire + '" }'
    return requests.post(f'http://{SERVER_IP}/api/v1/urls', headers=headers, data=data)
    

def read(id):
    return requests.get(f'http://{SERVER_IP}/{id}')

def worker():
    time.sleep(random.randint(0, 9) / 100)
    i = 0
    timeTags, startTag = [], time.time()
    while time.time() < startTag + 60:
        if i < NON_EXIST_QUERIES_RATIO:
            read('-1')
        elif NON_EXIST_QUERIES_RATIO <= i and i < QUERY_RATIO:
            read('0')
        elif QUERY_RATIO <= i:
            write('www.google.com', "2023-02-08T09:20:41Z")
        timeTags.append(time.time())
        i = (i + 1) % 100
    return timeTags

from multiprocessing.pool import ThreadPool
pool = ThreadPool(processes=NUMBER_OF_THREADS)
async_result = pool.apply_async(worker) # tuple of args for foo
timeTags = sorted([tag for tag in result for result in async_result])
timeTags = [math.floor(tag) for tag in timeTags]
bucket = {}
for tag in timeTags:
    bucket[tag] += 1

import matplotlib.pyplot as plt
import numpy as np

math_scores = [78, 67, 90, 81]
iterator = np.arange(len(x))
x = bucket.keys()
y = [bucket[k] for k in x]
plt.bar(np.arange(len(x)), y)
plt.xticks(iterator, x)
plt.xlabel('time')
plt.ylabel('ops per bucket')
plt.title('Performance chart')
plt.show()