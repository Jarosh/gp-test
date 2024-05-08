# gp-test

Well, you know what to do...

```docker-compose up -d```

or to re-run everything (including DB content) from scratch

```
docker-compose down
docker-compose up -d --force-recreate --build
```

Make sure host machine doesn't mind regarding forwarding ports 3000 and 3001 otherwise edit respective numbers in the `docker-compose.yml` config.
