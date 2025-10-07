# Rendering Diagrams with ClodRep

ClodRep includes powerful diagram generation capabilities that allow you to render SVG artifacts from various sources.

## Rendering from Diagram Languages

### Mermaid Diagrams

```bash
# Render a Mermaid diagram from a file
:diagram --format mermaid --input examples/sample_diagram.mmd

# Render a Mermaid diagram from text
:diagram --format mermaid --text --input "graph TD; A-->B; B-->C; C-->D; D-->E;" --output flowchart.svg
```

### Graphviz DOT Diagrams

```bash
# Render a DOT diagram from a file
:diagram --format dot --input examples/network.dot

# Render a simple DOT diagram from text
:diagram --format dot --text --input "digraph G {main -> parse -> execute; main -> init; main -> cleanup; execute -> make_string; execute -> printf; init -> make_string;}" --output process.svg
```

### PlantUML Diagrams

```bash
# Render a PlantUML diagram from a file
:diagram --format plantuml --input examples/sequence.puml

# Render a simple sequence diagram from text
:diagram --format plantuml --text --input "@startuml\nAlice -> Bob: Authentication Request\nBob --> Alice: Authentication Response\n@enduml" --output auth_flow.svg
```

## Generating Diagrams from Text Descriptions

ClodRep can leverage Claude to generate diagrams from natural language descriptions:

```bash
# Generate a diagram from a text description
:diagram --format text --text --input "Create a flowchart showing user authentication with login, password verification, two-factor auth, and access granted/denied outcomes"

# Generate a system architecture diagram from description
:diagram --format text --text --input "Create a system architecture diagram for a microservices application with API gateway, service discovery, 3 microservices, a database, and message queue" --output architecture.svg
```

## Integration with Claude

You can use the `:claude` command to generate diagram code, then render it with `:diagram`:

```bash
# Two-step process with Claude generating the Mermaid code
:claude run "Create a Mermaid diagram showing the deployment pipeline with stages for build, test, stage, and production" > my_pipeline.mmd
:diagram --format mermaid --input my_pipeline.mmd
```

## Viewing Generated Artifacts

All diagrams are saved in the `artifacts` directory. You can view them using:

```bash
open /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/pulser-cli/artifacts/diagram_output.svg
```

Or use your favorite image viewer or web browser.