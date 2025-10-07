# Sketch Generation API

The Sketch Generation API provides endpoints for creating, managing, and retrieving sketches generated based on text prompts.

## Endpoints

### Generate Sketch

```
POST /api/sketch_generate
```

Creates a new sketch generation job based on the provided text prompt.

#### Request Body

```json
{
  "prompt": "Draw a flowchart for data processing",
  "description": "Data Flow Diagram",
  "type": "flowchart",
  "style": "rough",
  "tags": ["data", "flowchart", "diagram"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| prompt | string | Yes | The text prompt describing what to generate |
| description | string | No | A short description of the sketch (default: "Unnamed sketch") |
| type | string | No | The type of sketch to generate (options: "concept", "flowchart", "wireframe", "diagram") |
| style | string | No | The visual style to use (options: "rough", "clean", "detailed") |
| tags | array | No | Array of tags to associate with the sketch |

#### Response

```json
{
  "success": true,
  "message": "Sketch generation job started",
  "data": {
    "jobId": "sketch-a1b2c3d4e5f6",
    "status": "pending",
    "statusUrl": "/api/sketch_generate/status/sketch-a1b2c3d4e5f6"
  }
}
```

### Get Sketch Status

```
GET /api/sketch_generate/status/:jobId
```

Retrieves the status and details of a sketch generation job.

#### Response

```json
{
  "success": true,
  "data": {
    "jobId": "sketch-a1b2c3d4e5f6",
    "status": "completed",
    "description": "Data Flow Diagram",
    "createdAt": "2023-05-10T15:30:45.123Z",
    "startedAt": "2023-05-10T15:30:45.456Z",
    "completedAt": "2023-05-10T15:30:47.789Z",
    "result": {
      "sketchId": "sketch-a1b2c3d4e5f6",
      "filePath": "/path/to/sketch.json",
      "elements": 12,
      "preview": "/api/sketch_generate/preview/sketch-a1b2c3d4e5f6"
    }
  }
}
```

### Get Sketch Preview

```
GET /api/sketch_generate/preview/:jobId
```

Retrieves a preview of the generated sketch as SVG content.

#### Response

```json
{
  "success": true,
  "data": {
    "jobId": "sketch-a1b2c3d4e5f6",
    "svgContent": "<svg>...</svg>",
    "description": "Data Flow Diagram"
  }
}
```

## Testing

A test interface is available at `/test-sketch` to try out the sketch generation API through a user-friendly web interface.

## Implementation Details

- Sketches are stored as JSON files in the `output/sketches` directory
- Preview rendering is done on-demand based on the stored sketch data
- Jobs are processed asynchronously to allow for longer generation times
- Each sketch has a unique ID for referencing throughout the API

## Future Enhancements

- Add support for SVG export
- Implement actual sketch generation with ML models
- Add support for sketch templates
- Allow for collaborative editing of sketches
- Implement version history for sketches