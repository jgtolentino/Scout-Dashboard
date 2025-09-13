# Running Your Superset Dashboard

Your dashboard has been packaged as a self-contained Docker image! Here's how to use it:

## Loading the Docker Image

```bash
docker load -i /Users/tbwa/Downloads/superset/brand-analytics-dashboard-v1.tar
```

## Running the Dashboard

```bash
docker run -p 8088:8088 brand-analytics-dashboard:v1
```

## Accessing the Dashboard

1. Open your browser and navigate to: http://localhost:8088
2. Login with:
   - Username: admin
   - Password: admin
3. Go to Dashboards and find your brand analytics dashboard

## Command Explanation

- `-p 8088:8088`: Maps port 8088 from the container to port 8088 on your host
- `brand-analytics-dashboard:v1`: The name and tag of the Docker image

## Stopping the Dashboard

When you're done, you can stop the running container:

1. Find the container ID:
   ```bash
   docker ps
   ```

2. Stop it:
   ```bash
   docker stop <container-id>
   ```

## Exporting Changes

If you make changes to the dashboard in Superset, you can export them by:

1. In Superset UI, go to your dashboard
2. Click the "..." menu
3. Select "Export"
4. Save the JSON file

Then you can rebuild the Docker image with the updated JSON file using:

```bash
:superset-docker --dir /path/to/directory/with/new/json
```

## Troubleshooting

If you have issues accessing the dashboard:
- Ensure Docker is running on your machine
- Check that port 8088 isn't already in use
- Look at the container logs: `docker logs <container-id>`