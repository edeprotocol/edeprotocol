# Run with Apptainer

Build from the Docker images:

```bash
apptainer build ede-gateway.sif docker-daemon://ede-gateway:latest
apptainer build ede-resolver.sif docker-daemon://ede-resolver:latest
```

Run containers with exposed ports:

```bash
apptainer run ede-resolver.sif
apptainer run ede-gateway.sif
```
