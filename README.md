# Semantic Press API

| URL |  |
| - | - |
| http://api.semanticpress.com |  |

## /health

### GET

Returns a JSON object of the server health, including CPU profiling and heap profiling.

Read more about server monitoring: [http://stackoverflow.com/questions/5580776/monitoring-a-node-js-server](http://stackoverflow.com/questions/5580776/monitoring-a-node-js-server)

```
{
  "pid": 13592,
  "memory": {
    "rss": 42119168,
    "heapTotal": 20608760,
    "heapUsed": 11413688
  },
  "uptime": 99
}
```

