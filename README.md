# wallet-api-eth


## local
```
docker-compose -f docker-compose-local.yml up -d
```

## dev
```
docker-compose -f docker-compose-eth-init.yml up
docker-compose -f docker-compose-dev.yml up -d
```
```
docker exec -ti private-ethereum geth attach
```

## prod
```
docker-compose up -d
```


## Stop
```
docker-compose stop
```