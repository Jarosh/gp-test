# gp-test

Well, you know what to do...

```docker-compose up -d```

or to re-run everything (including DB content) from scratch

```
docker-compose down
docker-compose up -d --force-recreate --build
```

Make sure host machine doesn't mind regarding forwarding ports 80 and 3001 otherwise try to change respective port numbers throughout the code on your own risk.

Once everything is fine, go to the http://localhost/
