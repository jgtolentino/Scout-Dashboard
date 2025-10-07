"""
Tide Agent - App Generator

This module generates full-stack application code based on specifications
created by the prompt parser.
"""

import os
import shutil
import json
import logging
from typing import Dict, List, Any, Optional
from pathlib import Path

from core.schema import AppSpecification, Entity, Relationship, CodeTemplate
from core.llm import LLMClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AppGenerator:
    """
    Generate full-stack application code based on specifications.
    """
    
    def __init__(
        self,
        spec: AppSpecification,
        output_dir: str,
        frontend_framework: str = "react",
        backend_framework: str = "fastapi",
        database: str = "postgres",
        llm_client: Optional[LLMClient] = None
    ):
        """
        Initialize the application generator.
        
        Args:
            spec: Application specification
            output_dir: Directory to output generated code
            frontend_framework: Frontend framework to use
            backend_framework: Backend framework to use
            database: Database to use
            llm_client: LLM client to use for code generation
        """
        self.spec = spec
        self.output_dir = Path(output_dir)
        self.frontend_framework = frontend_framework
        self.backend_framework = backend_framework
        self.database = database
        self.llm_client = llm_client or LLMClient()
        
        # Create output directory if it doesn't exist
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Template paths
        self.template_base_path = Path(__file__).parent.parent.parent / "templates"
        self.frontend_template_path = self.template_base_path / "frontend" / frontend_framework
        self.backend_template_path = self.template_base_path / "backend" / backend_framework
        self.database_template_path = self.template_base_path / "database" / database
    
    def generate(self) -> str:
        """
        Generate the full application.
        
        Returns:
            Path to the generated application
        """
        logger.info(f"Generating {self.spec.name} application")
        logger.info(f"Using: {self.frontend_framework} frontend, {self.backend_framework} backend, {self.database} database")
        
        # Create application directory structure
        app_dir = self.output_dir / self.spec.name.lower().replace(" ", "_")
        if app_dir.exists():
            logger.warning(f"Output directory {app_dir} already exists. Removing.")
            shutil.rmtree(app_dir)
        
        app_dir.mkdir(parents=True)
        
        # Save specification
        self._save_specification(app_dir)
        
        # Generate frontend code
        frontend_dir = app_dir / "frontend"
        self._generate_frontend(frontend_dir)
        
        # Generate backend code
        backend_dir = app_dir / "backend"
        self._generate_backend(backend_dir)
        
        # Generate database setup
        db_dir = app_dir / "database"
        self._generate_database(db_dir)
        
        # Generate deployment files
        self._generate_deployment_files(app_dir)
        
        # Generate README and documentation
        self._generate_documentation(app_dir)
        
        logger.info(f"Application generated at {app_dir}")
        return str(app_dir)
    
    def _save_specification(self, app_dir: Path) -> None:
        """
        Save the application specification.
        
        Args:
            app_dir: Application directory
        """
        spec_file = app_dir / "specification.json"
        with open(spec_file, "w") as f:
            json.dump(self.spec.to_dict(), f, indent=2)
        
        logger.info(f"Specification saved to {spec_file}")
    
    def _generate_frontend(self, frontend_dir: Path) -> None:
        """
        Generate frontend code.
        
        Args:
            frontend_dir: Frontend output directory
        """
        frontend_dir.mkdir(parents=True)
        
        # In a real implementation, we would use template files and the LLM
        # to generate the frontend code. For this demo, we create placeholder files.
        
        # Create basic structure based on framework
        if self.frontend_framework == "react":
            self._create_react_frontend(frontend_dir)
        elif self.frontend_framework == "vue":
            self._create_vue_frontend(frontend_dir)
        elif self.frontend_framework == "angular":
            self._create_angular_frontend(frontend_dir)
        else:
            logger.warning(f"Unsupported frontend framework: {self.frontend_framework}")
            self._create_generic_frontend(frontend_dir)
        
        logger.info(f"Frontend code generated at {frontend_dir}")
    
    def _create_react_frontend(self, frontend_dir: Path) -> None:
        """
        Create React frontend.
        
        Args:
            frontend_dir: Frontend output directory
        """
        # Create src directory
        src_dir = frontend_dir / "src"
        src_dir.mkdir(parents=True)
        
        # Create package.json
        package_json = {
            "name": self.spec.name.lower().replace(" ", "-"),
            "version": "0.1.0",
            "private": True,
            "dependencies": {
                "react": "^18.2.0",
                "react-dom": "^18.2.0",
                "react-router-dom": "^6.8.1",
                "axios": "^1.3.2"
            },
            "scripts": {
                "start": "react-scripts start",
                "build": "react-scripts build",
                "test": "react-scripts test",
                "eject": "react-scripts eject"
            }
        }
        
        with open(frontend_dir / "package.json", "w") as f:
            json.dump(package_json, f, indent=2)
        
        # Create index.js
        with open(src_dir / "index.js", "w") as f:
            f.write("""
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
            """.strip())
        
        # Create App.js
        with open(src_dir / "App.js", "w") as f:
            f.write(f"""
import React from 'react';
import {{BrowserRouter as Router, Routes, Route}} from 'react-router-dom';
import './App.css';

function App() {{
  return (
    <div className="App">
      <header className="App-header">
        <h1>{self.spec.name}</h1>
        <p>{self.spec.description}</p>
      </header>
      <Router>
        <Routes>
          <Route path="/" element={{<div>Home Page</div>}} />
          {self._generate_react_routes()}
        </Routes>
      </Router>
    </div>
  );
}}

export default App;
            """.strip())
        
        # Create entity components
        components_dir = src_dir / "components"
        components_dir.mkdir(exist_ok=True)
        
        for entity in self.spec.entities:
            self._create_react_entity_components(entity, components_dir)
    
    def _generate_react_routes(self) -> str:
        """
        Generate React route definitions for each entity.
        
        Returns:
            String containing route JSX
        """
        routes = []
        
        for entity in self.spec.entities:
            entity_name = entity.name.lower()
            routes.append(f'<Route path="/{entity_name}" element={{<div>{entity.name} List</div>}} />')
            routes.append(f'<Route path="/{entity_name}/:id" element={{<div>{entity.name} Details</div>}} />')
            routes.append(f'<Route path="/{entity_name}/create" element={{<div>Create {entity.name}</div>}} />')
            routes.append(f'<Route path="/{entity_name}/:id/edit" element={{<div>Edit {entity.name}</div>}} />')
        
        return "\n          ".join(routes)
    
    def _create_react_entity_components(self, entity: Entity, components_dir: Path) -> None:
        """
        Create React components for an entity.
        
        Args:
            entity: Entity to create components for
            components_dir: Components directory
        """
        entity_name = entity.name
        
        # Create directory for entity components
        entity_dir = components_dir / entity_name
        entity_dir.mkdir(exist_ok=True)
        
        # List component
        with open(entity_dir / f"{entity_name}List.js", "w") as f:
            f.write(f"""
import React, {{ useState, useEffect }} from 'react';
import {{ Link }} from 'react-router-dom';
import axios from 'axios';

function {entity_name}List() {{
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {{
    const fetchData = async () => {{
      try {{
        const response = await axios.get('/api/{entity_name.lower()}');
        setItems(response.data);
        setLoading(false);
      }} catch (err) {{
        setError('Failed to fetch {entity_name.lower()} data');
        setLoading(false);
      }}
    }};

    fetchData();
  }}, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{{error}}</div>;

  return (
    <div className="{entity_name.lower()}-list">
      <h2>{entity_name} List</h2>
      <Link to="/{entity_name.lower()}/create">Create {entity_name}</Link>
      <table>
        <thead>
          <tr>
            {self._generate_table_headers(entity)}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {{items.map(item => (
            <tr key={{item.id}}>
              {self._generate_table_cells(entity)}
              <td>
                <Link to={{`/{entity_name.lower()}/${{item.id}}`}}>View</Link>
                <Link to={{`/{entity_name.lower()}/${{item.id}}/edit`}}>Edit</Link>
                <button onClick={{() => handleDelete(item.id)}}>Delete</button>
              </td>
            </tr>
          ))}}
        </tbody>
      </table>
    </div>
  );

  async function handleDelete(id) {{
    if (window.confirm('Are you sure you want to delete this {entity_name.lower()}?')) {{
      try {{
        await axios.delete(`/api/{entity_name.lower()}/${{id}}`);
        setItems(items.filter(item => item.id !== id));
      }} catch (err) {{
        setError('Failed to delete {entity_name.lower()}');
      }}
    }}
  }}
}}

export default {entity_name}List;
            """.strip())
        
        # Form component
        with open(entity_dir / f"{entity_name}Form.js", "w") as f:
            f.write(f"""
import React, {{ useState, useEffect }} from 'react';
import {{ useNavigate, useParams }} from 'react-router-dom';
import axios from 'axios';

function {entity_name}Form() {{
  const navigate = useNavigate();
  const {{ id }} = useParams();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({{{self._generate_form_initial_state(entity)}}});
  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState(null);

  useEffect(() => {{
    if (isEditing) {{
      const fetchData = async () => {{
        try {{
          const response = await axios.get(`/api/{entity_name.lower()}/${{id}}`);
          setFormData(response.data);
          setLoading(false);
        }} catch (err) {{
          setError('Failed to fetch {entity_name.lower()} data');
          setLoading(false);
        }}
      }};

      fetchData();
    }}
  }}, [id, isEditing]);

  const handleChange = (e) => {{
    const {{ name, value }} = e.target;
    setFormData(prev => ({{
      ...prev,
      [name]: value
    }}));
  }};

  const handleSubmit = async (e) => {{
    e.preventDefault();
    setLoading(true);
    
    try {{
      if (isEditing) {{
        await axios.put(`/api/{entity_name.lower()}/${{id}}`, formData);
      }} else {{
        await axios.post('/api/{entity_name.lower()}', formData);
      }}
      navigate('/{entity_name.lower()}');
    }} catch (err) {{
      setError(`Failed to ${{isEditing ? 'update' : 'create'}} {entity_name.lower()}`);
      setLoading(false);
    }}
  }};

  if (loading && isEditing) return <div>Loading...</div>;
  if (error) return <div>{{error}}</div>;

  return (
    <div className="{entity_name.lower()}-form">
      <h2>{{isEditing ? 'Edit' : 'Create'}} {entity_name}</h2>
      <form onSubmit={{handleSubmit}}>
        {self._generate_form_fields(entity)}
        <div className="form-group">
          <button type="submit" disabled={{loading}}>
            {{loading ? 'Saving...' : isEditing ? 'Update' : 'Create'}}
          </button>
          <button type="button" onClick={{() => navigate('/{entity_name.lower()}')}}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}}

export default {entity_name}Form;
            """.strip())
        
        # Detail component
        with open(entity_dir / f"{entity_name}Detail.js", "w") as f:
            f.write(f"""
import React, {{ useState, useEffect }} from 'react';
import {{ useParams, Link, useNavigate }} from 'react-router-dom';
import axios from 'axios';

function {entity_name}Detail() {{
  const {{ id }} = useParams();
  const navigate = useNavigate();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {{
    const fetchData = async () => {{
      try {{
        const response = await axios.get(`/api/{entity_name.lower()}/${{id}}`);
        setItem(response.data);
        setLoading(false);
      }} catch (err) {{
        setError('Failed to fetch {entity_name.lower()} data');
        setLoading(false);
      }}
    }};

    fetchData();
  }}, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{{error}}</div>;
  if (!item) return <div>No {entity_name.lower()} found</div>;

  return (
    <div className="{entity_name.lower()}-detail">
      <h2>{entity_name} Details</h2>
      <dl>
        {self._generate_detail_fields(entity)}
      </dl>
      <div className="actions">
        <Link to={{`/{entity_name.lower()}/${{id}}/edit`}}>Edit</Link>
        <button onClick={{handleDelete}}>Delete</button>
        <Link to="/{entity_name.lower()}">Back to List</Link>
      </div>
    </div>
  );

  async function handleDelete() {{
    if (window.confirm('Are you sure you want to delete this {entity_name.lower()}?')) {{
      try {{
        await axios.delete(`/api/{entity_name.lower()}/${{id}}`);
        navigate('/{entity_name.lower()}');
      }} catch (err) {{
        setError('Failed to delete {entity_name.lower()}');
      }}
    }}
  }}
}}

export default {entity_name}Detail;
            """.strip())
    
    def _generate_table_headers(self, entity: Entity) -> str:
        """
        Generate table header cells for entity fields.
        
        Args:
            entity: Entity to generate headers for
            
        Returns:
            String with th elements
        """
        headers = []
        for field in entity.fields:
            if field.get("primary_key"):
                continue
            headers.append(f'<th>{field["name"].capitalize()}</th>')
        return "\n            ".join(headers)
    
    def _generate_table_cells(self, entity: Entity) -> str:
        """
        Generate table cells for entity fields.
        
        Args:
            entity: Entity to generate cells for
            
        Returns:
            String with td elements
        """
        cells = []
        for field in entity.fields:
            if field.get("primary_key"):
                continue
            
            field_type = field.get("type", "string")
            if field_type == "datetime":
                cells.append(f'<td>{{new Date(item.{field["name"]}).toLocaleString()}}</td>')
            elif field_type == "boolean":
                cells.append(f'<td>{{item.{field["name"]} ? "Yes" : "No"}}</td>')
            else:
                cells.append(f'<td>{{item.{field["name"]}}}</td>')
        
        return "\n              ".join(cells)
    
    def _generate_form_initial_state(self, entity: Entity) -> str:
        """
        Generate initial state for form fields.
        
        Args:
            entity: Entity to generate initial state for
            
        Returns:
            String with initial state object properties
        """
        states = []
        for field in entity.fields:
            if field.get("primary_key"):
                continue
            
            field_type = field.get("type", "string")
            if field_type in ["string", "text"]:
                states.append(f'{field["name"]}: ""')
            elif field_type in ["integer", "decimal", "float"]:
                states.append(f'{field["name"]}: 0')
            elif field_type == "boolean":
                states.append(f'{field["name"]}: false')
            elif field_type == "datetime":
                states.append(f'{field["name"]}: ""')
            else:
                states.append(f'{field["name"]}: null')
        
        return ", ".join(states)
    
    def _generate_form_fields(self, entity: Entity) -> str:
        """
        Generate form input fields for entity fields.
        
        Args:
            entity: Entity to generate form fields for
            
        Returns:
            String with form field elements
        """
        fields = []
        
        for field in entity.fields:
            if field.get("primary_key"):
                continue
            
            field_name = field["name"]
            field_type = field.get("type", "string")
            required = field.get("required", False)
            
            if field_type in ["string", "text"]:
                if field_type == "text":
                    fields.append(f"""
        <div className="form-group">
          <label htmlFor="{field_name}">{field_name.capitalize()}</label>
          <textarea
            id="{field_name}"
            name="{field_name}"
            value={{formData.{field_name} || ''}}
            onChange={{handleChange}}
            required={str(required).lower()}
          />
        </div>""")
                else:
                    fields.append(f"""
        <div className="form-group">
          <label htmlFor="{field_name}">{field_name.capitalize()}</label>
          <input
            type="text"
            id="{field_name}"
            name="{field_name}"
            value={{formData.{field_name} || ''}}
            onChange={{handleChange}}
            required={str(required).lower()}
          />
        </div>""")
            elif field_type in ["integer", "decimal", "float"]:
                fields.append(f"""
        <div className="form-group">
          <label htmlFor="{field_name}">{field_name.capitalize()}</label>
          <input
            type="number"
            id="{field_name}"
            name="{field_name}"
            value={{formData.{field_name} || 0}}
            onChange={{handleChange}}
            required={str(required).lower()}
          />
        </div>""")
            elif field_type == "boolean":
                fields.append(f"""
        <div className="form-group">
          <label htmlFor="{field_name}">{field_name.capitalize()}</label>
          <input
            type="checkbox"
            id="{field_name}"
            name="{field_name}"
            checked={{formData.{field_name} || false}}
            onChange={{e => setFormData(prev => ({{...prev, {field_name}: e.target.checked}}))}}
          />
        </div>""")
            elif field_type == "datetime":
                fields.append(f"""
        <div className="form-group">
          <label htmlFor="{field_name}">{field_name.capitalize()}</label>
          <input
            type="datetime-local"
            id="{field_name}"
            name="{field_name}"
            value={{formData.{field_name} ? new Date(formData.{field_name}).toISOString().slice(0, 16) : ''}}
            onChange={{handleChange}}
            required={str(required).lower()}
          />
        </div>""")
        
        return "\n".join(fields)
    
    def _generate_detail_fields(self, entity: Entity) -> str:
        """
        Generate detail fields for entity.
        
        Args:
            entity: Entity to generate detail fields for
            
        Returns:
            String with detail field elements
        """
        fields = []
        
        for field in entity.fields:
            if field.get("primary_key") and field["name"] != "id":
                continue
            
            field_name = field["name"]
            field_type = field.get("type", "string")
            
            if field_type == "datetime":
                fields.append(f"""
        <div className="detail-row">
          <dt>{field_name.capitalize()}</dt>
          <dd>{{item.{field_name} ? new Date(item.{field_name}).toLocaleString() : '-'}}</dd>
        </div>""")
            elif field_type == "boolean":
                fields.append(f"""
        <div className="detail-row">
          <dt>{field_name.capitalize()}</dt>
          <dd>{{item.{field_name} ? 'Yes' : 'No'}}</dd>
        </div>""")
            else:
                fields.append(f"""
        <div className="detail-row">
          <dt>{field_name.capitalize()}</dt>
          <dd>{{item.{field_name} || '-'}}</dd>
        </div>""")
        
        return "\n".join(fields)
    
    def _create_vue_frontend(self, frontend_dir: Path) -> None:
        """
        Create Vue frontend.
        
        Args:
            frontend_dir: Frontend output directory
        """
        # Placeholder implementation - in a real project this would be more comprehensive
        src_dir = frontend_dir / "src"
        src_dir.mkdir(parents=True)
        
        # Create package.json
        with open(frontend_dir / "package.json", "w") as f:
            json.dump({
                "name": self.spec.name.lower().replace(" ", "-"),
                "version": "0.1.0",
                "private": True,
                "scripts": {
                    "serve": "vue-cli-service serve",
                    "build": "vue-cli-service build"
                },
                "dependencies": {
                    "vue": "^3.2.45",
                    "vue-router": "^4.1.6",
                    "axios": "^1.3.2"
                }
            }, f, indent=2)
        
        # Create main.js
        with open(src_dir / "main.js", "w") as f:
            f.write("""
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
            """.strip())
        
        # Create App.vue
        with open(src_dir / "App.vue", "w") as f:
            f.write(f"""
<template>
  <div id="app">
    <header>
      <h1>{self.spec.name}</h1>
      <p>{self.spec.description}</p>
    </header>
    <router-view/>
  </div>
</template>

<script>
export default {{
  name: 'App'
}}
</script>

<style>
/* App styles */
</style>
            """.strip())
    
    def _create_angular_frontend(self, frontend_dir: Path) -> None:
        """
        Create Angular frontend.
        
        Args:
            frontend_dir: Frontend output directory
        """
        # Placeholder implementation - in a real project this would be more comprehensive
        src_dir = frontend_dir / "src"
        src_dir.mkdir(parents=True)
        
        # Create package.json
        with open(frontend_dir / "package.json", "w") as f:
            json.dump({
                "name": self.spec.name.lower().replace(" ", "-"),
                "version": "0.1.0",
                "scripts": {
                    "ng": "ng",
                    "start": "ng serve",
                    "build": "ng build"
                },
                "dependencies": {
                    "@angular/common": "^15.1.0",
                    "@angular/core": "^15.1.0",
                    "@angular/forms": "^15.1.0",
                    "@angular/router": "^15.1.0"
                }
            }, f, indent=2)
        
        # Create app directory
        app_dir = src_dir / "app"
        app_dir.mkdir(parents=True)
        
        # Create app component
        with open(app_dir / "app.component.ts", "w") as f:
            f.write(f"""
import {{ Component }} from '@angular/core';

@Component({{
  selector: 'app-root',
  template: `
    <div class="app">
      <header>
        <h1>{self.spec.name}</h1>
        <p>{self.spec.description}</p>
      </header>
      <router-outlet></router-outlet>
    </div>
  `,
  styles: []
}})
export class AppComponent {{
  title = '{self.spec.name}';
}}
            """.strip())
    
    def _create_generic_frontend(self, frontend_dir: Path) -> None:
        """
        Create generic frontend (fallback).
        
        Args:
            frontend_dir: Frontend output directory
        """
        # Create simple HTML frontend as fallback
        with open(frontend_dir / "index.html", "w") as f:
            f.write(f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{self.spec.name}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="app">
    <header>
      <h1>{self.spec.name}</h1>
      <p>{self.spec.description}</p>
    </header>
    <main>
      <p>This is a placeholder for your application.</p>
    </main>
  </div>
  <script src="app.js"></script>
</body>
</html>
            """.strip())
        
        with open(frontend_dir / "styles.css", "w") as f:
            f.write("""
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
}

.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  background-color: #f4f4f4;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 5px;
}
            """.strip())
        
        with open(frontend_dir / "app.js", "w") as f:
            f.write("""
// This is a placeholder for your JavaScript code
console.log('Application initialized');
            """.strip())
    
    def _generate_backend(self, backend_dir: Path) -> None:
        """
        Generate backend code.
        
        Args:
            backend_dir: Backend output directory
        """
        backend_dir.mkdir(parents=True)
        
        # In a real implementation, we would use template files and the LLM
        # to generate the backend code. For this demo, we create placeholder files.
        
        # Create basic structure based on framework
        if self.backend_framework == "fastapi":
            self._create_fastapi_backend(backend_dir)
        elif self.backend_framework == "express":
            self._create_express_backend(backend_dir)
        elif self.backend_framework == "laravel":
            self._create_laravel_backend(backend_dir)
        else:
            logger.warning(f"Unsupported backend framework: {self.backend_framework}")
            self._create_generic_backend(backend_dir)
        
        logger.info(f"Backend code generated at {backend_dir}")
    
    def _create_fastapi_backend(self, backend_dir: Path) -> None:
        """
        Create FastAPI backend.
        
        Args:
            backend_dir: Backend output directory
        """
        # Create app directory
        app_dir = backend_dir / "app"
        app_dir.mkdir(parents=True)
        
        # Create requirements.txt
        with open(backend_dir / "requirements.txt", "w") as f:
            f.write("""
fastapi==0.95.0
uvicorn==0.21.1
sqlalchemy==2.0.7
pydantic==1.10.7
alembic==1.10.2
psycopg2-binary==2.9.5
python-jose==3.3.0
passlib==1.7.4
python-multipart==0.0.6
            """.strip())
        
        # Create main.py
        with open(app_dir / "main.py", "w") as f:
            f.write(f"""
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import models, schemas, crud
from .database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="{self.spec.name} API", description="{self.spec.description}")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

{self._generate_fastapi_routes()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
            """.strip())
        
        # Create database.py
        with open(app_dir / "database.py", "w") as f:
            f.write("""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "postgresql://postgres:postgres@db:5432/postgres"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
            """.strip())
        
        # Create models.py
        with open(app_dir / "models.py", "w") as f:
            f.write(self._generate_sqlalchemy_models())
        
        # Create schemas.py
        with open(app_dir / "schemas.py", "w") as f:
            f.write(self._generate_pydantic_schemas())
        
        # Create crud.py
        with open(app_dir / "crud.py", "w") as f:
            f.write(self._generate_fastapi_crud())
    
    def _generate_fastapi_routes(self) -> str:
        """
        Generate FastAPI route handlers for each entity.
        
        Returns:
            String containing route definitions
        """
        routes = []
        
        for entity in self.spec.entities:
            entity_name = entity.name
            entity_name_lower = entity_name.lower()
            
            routes.append(f"""
@app.post("/{entity_name_lower}/", response_model=schemas.{entity_name})
def create_{entity_name_lower}(item: schemas.{entity_name}Create, db: Session = Depends(get_db)):
    return crud.create_{entity_name_lower}(db=db, item=item)

@app.get("/{entity_name_lower}/", response_model=list[schemas.{entity_name}])
def read_{entity_name_lower}s(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    items = crud.get_{entity_name_lower}s(db, skip=skip, limit=limit)
    return items

@app.get("/{entity_name_lower}/{{item_id}}", response_model=schemas.{entity_name})
def read_{entity_name_lower}(item_id: int, db: Session = Depends(get_db)):
    db_item = crud.get_{entity_name_lower}(db, item_id=item_id)
    if db_item is None:
        raise HTTPException(status_code=404, detail="{entity_name} not found")
    return db_item

@app.put("/{entity_name_lower}/{{item_id}}", response_model=schemas.{entity_name})
def update_{entity_name_lower}(item_id: int, item: schemas.{entity_name}Update, db: Session = Depends(get_db)):
    db_item = crud.get_{entity_name_lower}(db, item_id=item_id)
    if db_item is None:
        raise HTTPException(status_code=404, detail="{entity_name} not found")
    return crud.update_{entity_name_lower}(db=db, db_item=db_item, item=item)

@app.delete("/{entity_name_lower}/{{item_id}}", response_model=schemas.{entity_name})
def delete_{entity_name_lower}(item_id: int, db: Session = Depends(get_db)):
    db_item = crud.get_{entity_name_lower}(db, item_id=item_id)
    if db_item is None:
        raise HTTPException(status_code=404, detail="{entity_name} not found")
    return crud.delete_{entity_name_lower}(db=db, db_item=db_item)""")
        
        return "\n".join(routes)
    
    def _generate_sqlalchemy_models(self) -> str:
        """
        Generate SQLAlchemy models for entities.
        
        Returns:
            String containing model definitions
        """
        imports = """
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from .database import Base
"""
        
        models = []
        
        for entity in self.spec.entities:
            entity_name = entity.name
            
            model_fields = []
            for field in entity.fields:
                field_name = field["name"]
                field_type = field.get("type", "string")
                
                # Map field types to SQLAlchemy types
                if field_type == "uuid":
                    model_fields.append(f'    {field_name} = Column(String, primary_key=True, index=True)')
                elif field_type == "string":
                    model_fields.append(f'    {field_name} = Column(String, index={str(field.get("indexed", False)).lower()})')
                elif field_type == "text":
                    model_fields.append(f'    {field_name} = Column(Text)')
                elif field_type in ["integer", "int"]:
                    model_fields.append(f'    {field_name} = Column(Integer)')
                elif field_type in ["decimal", "float"]:
                    model_fields.append(f'    {field_name} = Column(Float)')
                elif field_type == "boolean":
                    model_fields.append(f'    {field_name} = Column(Boolean, default=False)')
                elif field_type == "datetime":
                    model_fields.append(f'    {field_name} = Column(DateTime, default=datetime.utcnow)')
            
            # Add timestamps
            if entity.timestamps:
                if not any(f["name"] == "created_at" for f in entity.fields):
                    model_fields.append('    created_at = Column(DateTime, default=datetime.utcnow)')
                if not any(f["name"] == "updated_at" for f in entity.fields):
                    model_fields.append('    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)')
            
            # Add relationships
            for relationship_obj in self.spec.relationships:
                if relationship_obj.source == entity_name:
                    target = relationship_obj.target
                    if relationship_obj.type in ["one_to_many", "one_to_one"]:
                        back_populates = f"{entity_name.lower()}s" if relationship_obj.type == "one_to_many" else entity_name.lower()
                        model_fields.append(f'    {target.lower()}s = relationship("{target}", back_populates="{back_populates}")')
                elif relationship_obj.target == entity_name:
                    source = relationship_obj.source
                    source_id_field = f"{source.lower()}_id"
                    if relationship_obj.type in ["many_to_one", "one_to_one"]:
                        model_fields.append(f'    {source_id_field} = Column(String, ForeignKey("{source.lower()}.id"))')
                        back_populates = f"{entity_name.lower()}s" if relationship_obj.type == "many_to_one" else entity_name.lower()
                        model_fields.append(f'    {source.lower()} = relationship("{source}", back_populates="{back_populates}")')
            
            models.append(f"""
class {entity_name}(Base):
    __tablename__ = "{entity_name.lower()}"

{chr(10).join(model_fields)}
""")
        
        return imports + "\n".join(models)
    
    def _generate_pydantic_schemas(self) -> str:
        """
        Generate Pydantic schemas for entities.
        
        Returns:
            String containing schema definitions
        """
        imports = """
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
"""
        
        schemas = []
        
        for entity in self.spec.entities:
            entity_name = entity.name
            
            # Base Schema
            base_fields = []
            for field in entity.fields:
                field_name = field["name"]
                field_type = field.get("type", "string")
                
                # Map field types to Python types
                if field_type == "uuid":
                    base_fields.append(f'    {field_name}: str')
                elif field_type in ["string", "text"]:
                    base_fields.append(f'    {field_name}: str')
                elif field_type in ["integer", "int"]:
                    base_fields.append(f'    {field_name}: int')
                elif field_type in ["decimal", "float"]:
                    base_fields.append(f'    {field_name}: float')
                elif field_type == "boolean":
                    base_fields.append(f'    {field_name}: bool')
                elif field_type == "datetime":
                    base_fields.append(f'    {field_name}: datetime')
            
            # Create Schema (without ID for creation)
            create_fields = []
            for field in entity.fields:
                if field.get("primary_key"):
                    continue
                
                field_name = field["name"]
                field_type = field.get("type", "string")
                
                # Make fields optional for timestamps
                if field_name in ["created_at", "updated_at"]:
                    continue
                
                # Map field types to Python types
                if field_type == "uuid":
                    create_fields.append(f'    {field_name}: str')
                elif field_type in ["string", "text"]:
                    create_fields.append(f'    {field_name}: str')
                elif field_type in ["integer", "int"]:
                    create_fields.append(f'    {field_name}: int')
                elif field_type in ["decimal", "float"]:
                    create_fields.append(f'    {field_name}: float')
                elif field_type == "boolean":
                    create_fields.append(f'    {field_name}: bool = False')
                elif field_type == "datetime":
                    create_fields.append(f'    {field_name}: Optional[datetime] = None')
            
            # Update Schema (all fields optional)
            update_fields = []
            for field in entity.fields:
                if field.get("primary_key") or field["name"] in ["created_at", "updated_at"]:
                    continue
                
                field_name = field["name"]
                field_type = field.get("type", "string")
                
                # Map field types to Python types with Optional
                if field_type == "uuid":
                    update_fields.append(f'    {field_name}: Optional[str] = None')
                elif field_type in ["string", "text"]:
                    update_fields.append(f'    {field_name}: Optional[str] = None')
                elif field_type in ["integer", "int"]:
                    update_fields.append(f'    {field_name}: Optional[int] = None')
                elif field_type in ["decimal", "float"]:
                    update_fields.append(f'    {field_name}: Optional[float] = None')
                elif field_type == "boolean":
                    update_fields.append(f'    {field_name}: Optional[bool] = None')
                elif field_type == "datetime":
                    update_fields.append(f'    {field_name}: Optional[datetime] = None')
            
            schemas.append(f"""
class {entity_name}Base(BaseModel):
{chr(10).join(base_fields)}

class {entity_name}Create(BaseModel):
{chr(10).join(create_fields)}

class {entity_name}Update(BaseModel):
{chr(10).join(update_fields)}

class {entity_name}(BaseModel):
{chr(10).join(base_fields)}

    class Config:
        orm_mode = True
""")
        
        return imports + "\n".join(schemas)
    
    def _generate_fastapi_crud(self) -> str:
        """
        Generate CRUD operations for entities.
        
        Returns:
            String containing CRUD functions
        """
        imports = """
from sqlalchemy.orm import Session
from . import models, schemas
"""
        
        crud_functions = []
        
        for entity in self.spec.entities:
            entity_name = entity.name
            entity_name_lower = entity_name.lower()
            
            crud_functions.append(f"""
def get_{entity_name_lower}(db: Session, item_id: int):
    return db.query(models.{entity_name}).filter(models.{entity_name}.id == item_id).first()

def get_{entity_name_lower}s(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.{entity_name}).offset(skip).limit(limit).all()

def create_{entity_name_lower}(db: Session, item: schemas.{entity_name}Create):
    db_item = models.{entity_name}(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_{entity_name_lower}(db: Session, db_item: models.{entity_name}, item: schemas.{entity_name}Update):
    update_data = item.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

def delete_{entity_name_lower}(db: Session, db_item: models.{entity_name}):
    db.delete(db_item)
    db.commit()
    return db_item
""")
        
        return imports + "\n".join(crud_functions)
    
    def _create_express_backend(self, backend_dir: Path) -> None:
        """
        Create Express backend.
        
        Args:
            backend_dir: Backend output directory
        """
        # Placeholder implementation - in a real project this would be more comprehensive
        # Create package.json
        with open(backend_dir / "package.json", "w") as f:
            json.dump({
                "name": f"{self.spec.name.lower().replace(' ', '-')}-api",
                "version": "1.0.0",
                "main": "index.js",
                "scripts": {
                    "start": "node index.js",
                    "dev": "nodemon index.js"
                },
                "dependencies": {
                    "express": "^4.18.2",
                    "mongoose": "^6.9.1",
                    "cors": "^2.8.5",
                    "dotenv": "^16.0.3",
                    "bcryptjs": "^2.4.3",
                    "jsonwebtoken": "^9.0.0"
                },
                "devDependencies": {
                    "nodemon": "^2.0.20"
                }
            }, f, indent=2)
        
        # Create index.js
        with open(backend_dir / "index.js", "w") as f:
            f.write(f"""
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/{self.spec.name.lower().replace(" ", "_")}', {{
  useNewUrlParser: true,
  useUnifiedTopology: true
}});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {{
  console.log('Connected to MongoDB');
}});

// Routes
app.get('/', (req, res) => {{
  res.send('{self.spec.name} API');
}});

// Import and use routes
{self._generate_express_route_imports()}

// Start server
app.listen(PORT, () => {{
  console.log(`Server running on port ${{PORT}}`);
}});
            """.strip())
    
    def _generate_express_route_imports(self) -> str:
        """
        Generate Express route imports for each entity.
        
        Returns:
            String containing route imports
        """
        imports = []
        
        for entity in self.spec.entities:
            entity_name = entity.name
            entity_name_lower = entity_name.lower()
            
            imports.append(f'const {entity_name_lower}Routes = require("./routes/{entity_name_lower}");')
            imports.append(f'app.use("/api/{entity_name_lower}", {entity_name_lower}Routes);')
        
        return "\n".join(imports)
    
    def _create_laravel_backend(self, backend_dir: Path) -> None:
        """
        Create Laravel backend.
        
        Args:
            backend_dir: Backend output directory
        """
        # Placeholder implementation - in a real project this would be more comprehensive
        # Create composer.json
        with open(backend_dir / "composer.json", "w") as f:
            json.dump({
                "name": f"{self.spec.name.lower().replace(' ', '-')}-api",
                "type": "project",
                "description": self.spec.description,
                "require": {
                    "php": "^8.0",
                    "laravel/framework": "^9.0"
                }
            }, f, indent=2)
    
    def _create_generic_backend(self, backend_dir: Path) -> None:
        """
        Create generic backend (fallback).
        
        Args:
            backend_dir: Backend output directory
        """
        # Create a simple README explaining the backend structure
        with open(backend_dir / "README.md", "w") as f:
            f.write(f"""
# {self.spec.name} Backend

This is a placeholder for the backend implementation.

## Entities

{self._generate_entities_markdown()}

## Relationships

{self._generate_relationships_markdown()}

## Features

{self._generate_features_markdown()}
            """.strip())
    
    def _generate_entities_markdown(self) -> str:
        """
        Generate Markdown description of entities.
        
        Returns:
            Markdown string
        """
        markdown = []
        
        for entity in self.spec.entities:
            markdown.append(f"### {entity.name}")
            markdown.append(f"{entity.description}\n")
            markdown.append("| Field | Type | Description |")
            markdown.append("| ----- | ---- | ----------- |")
            
            for field in entity.fields:
                field_name = field["name"]
                field_type = field.get("type", "string")
                field_desc = field.get("description", "")
                markdown.append(f"| {field_name} | {field_type} | {field_desc} |")
            
            markdown.append("")
        
        return "\n".join(markdown)
    
    def _generate_relationships_markdown(self) -> str:
        """
        Generate Markdown description of relationships.
        
        Returns:
            Markdown string
        """
        if not self.spec.relationships:
            return "No relationships defined."
        
        markdown = []
        markdown.append("| Source | Relationship | Target | Description |")
        markdown.append("| ------ | ------------ | ------ | ----------- |")
        
        for rel in self.spec.relationships:
            markdown.append(f"| {rel.source} | {rel.type.replace('_', ' ')} | {rel.target} | {rel.description} |")
        
        return "\n".join(markdown)
    
    def _generate_features_markdown(self) -> str:
        """
        Generate Markdown description of features.
        
        Returns:
            Markdown string
        """
        if not self.spec.features:
            return "No features defined."
        
        markdown = []
        
        for feature in self.spec.features:
            markdown.append(f"### {feature.name}")
            markdown.append(f"{feature.description}")
            markdown.append(f"Required: {'Yes' if feature.required else 'No'}")
            markdown.append("")
        
        return "\n".join(markdown)
    
    def _generate_database(self, db_dir: Path) -> None:
        """
        Generate database setup.
        
        Args:
            db_dir: Database output directory
        """
        db_dir.mkdir(parents=True)
        
        # Generate database scripts based on selected database
        if self.database == "postgres":
            self._generate_postgres_setup(db_dir)
        elif self.database == "mysql":
            self._generate_mysql_setup(db_dir)
        elif self.database == "mongodb":
            self._generate_mongodb_setup(db_dir)
        else:
            logger.warning(f"Unsupported database: {self.database}")
            self._generate_generic_database_setup(db_dir)
        
        logger.info(f"Database setup generated at {db_dir}")
    
    def _generate_postgres_setup(self, db_dir: Path) -> None:
        """
        Generate PostgreSQL setup.
        
        Args:
            db_dir: Database output directory
        """
        # Create schema.sql
        with open(db_dir / "schema.sql", "w") as f:
            f.write(self._generate_postgres_schema())
        
        # Create docker-compose.yml for Postgres
        with open(db_dir / "docker-compose.yml", "w") as f:
            f.write(f"""
version: '3.8'

services:
  db:
    image: postgres:14
    restart: always
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_USER: postgres
      POSTGRES_DB: {self.spec.name.lower().replace(" ", "_")}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./schema.sql:/docker-entrypoint-initdb.d/schema.sql

volumes:
  postgres_data:
            """.strip())
    
    def _generate_postgres_schema(self) -> str:
        """
        Generate PostgreSQL schema.
        
        Returns:
            SQL schema
        """
        schema = [f"-- {self.spec.name} Database Schema"]
        
        # Create tables
        for entity in self.spec.entities:
            entity_name = entity.name.lower()
            
            schema.append(f"\n-- {entity.name} Table")
            schema.append(f"CREATE TABLE IF NOT EXISTS {entity_name} (")
            
            # Add fields
            fields = []
            primary_key = None
            
            for field in entity.fields:
                field_name = field["name"]
                field_type = field.get("type", "string")
                
                # Map field types to PostgreSQL types
                if field_type == "uuid":
                    if field.get("primary_key"):
                        primary_key = field_name
                        fields.append(f"  {field_name} UUID PRIMARY KEY DEFAULT gen_random_uuid()")
                    else:
                        fields.append(f"  {field_name} UUID")
                elif field_type in ["string", "varchar"]:
                    fields.append(f"  {field_name} VARCHAR(255)")
                elif field_type == "text":
                    fields.append(f"  {field_name} TEXT")
                elif field_type in ["integer", "int"]:
                    if field.get("primary_key"):
                        primary_key = field_name
                        fields.append(f"  {field_name} SERIAL PRIMARY KEY")
                    else:
                        fields.append(f"  {field_name} INTEGER")
                elif field_type in ["decimal", "float"]:
                    fields.append(f"  {field_name} DECIMAL(12, 2)")
                elif field_type == "boolean":
                    fields.append(f"  {field_name} BOOLEAN DEFAULT FALSE")
                elif field_type == "datetime":
                    fields.append(f"  {field_name} TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP")
            
            # Add timestamps
            if entity.timestamps:
                if not any(f["name"] == "created_at" for f in entity.fields):
                    fields.append("  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP")
                if not any(f["name"] == "updated_at" for f in entity.fields):
                    fields.append("  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP")
            
            # Add primary key if none specified
            if not primary_key:
                fields.append("  id SERIAL PRIMARY KEY")
            
            schema.append(",\n".join(fields))
            schema.append(");")
        
        # Add foreign key constraints
        for rel in self.spec.relationships:
            if rel.type in ["many_to_one", "one_to_one"]:
                source = rel.source.lower()
                target = rel.target.lower()
                
                schema.append(f"\n-- {rel.source} to {rel.target} Relationship")
                schema.append(f"ALTER TABLE {source} ADD COLUMN IF NOT EXISTS {target}_id INTEGER;")
                schema.append(f"ALTER TABLE {source} ADD CONSTRAINT fk_{source}_{target}")
                schema.append(f"  FOREIGN KEY ({target}_id) REFERENCES {target} (id) ON DELETE CASCADE;")
            elif rel.type == "many_to_many":
                source = rel.source.lower()
                target = rel.target.lower()
                junction_table = f"{source}_{target}"
                
                schema.append(f"\n-- {rel.source} to {rel.target} Many-to-Many Relationship")
                schema.append(f"CREATE TABLE IF NOT EXISTS {junction_table} (")
                schema.append(f"  {source}_id INTEGER REFERENCES {source} (id) ON DELETE CASCADE,")
                schema.append(f"  {target}_id INTEGER REFERENCES {target} (id) ON DELETE CASCADE,")
                schema.append(f"  PRIMARY KEY ({source}_id, {target}_id)")
                schema.append(");")
        
        # Add indexes
        for entity in self.spec.entities:
            entity_name = entity.name.lower()
            
            for field in entity.fields:
                if field.get("indexed") and not field.get("primary_key"):
                    field_name = field["name"]
                    schema.append(f"\n-- Index for {entity_name}.{field_name}")
                    schema.append(f"CREATE INDEX IF NOT EXISTS idx_{entity_name}_{field_name} ON {entity_name} ({field_name});")
        
        return "\n".join(schema)
    
    def _generate_mysql_setup(self, db_dir: Path) -> None:
        """
        Generate MySQL setup.
        
        Args:
            db_dir: Database output directory
        """
        # Placeholder implementation - similar to Postgres but with MySQL syntax
        with open(db_dir / "README.md", "w") as f:
            f.write(f"""
# MySQL Database Setup for {self.spec.name}

This directory contains MySQL database setup files.

## Setup Instructions

1. Use docker-compose.yml to start a MySQL container
2. Execute schema.sql to create the database schema
            """.strip())
    
    def _generate_mongodb_setup(self, db_dir: Path) -> None:
        """
        Generate MongoDB setup.
        
        Args:
            db_dir: Database output directory
        """
        # Placeholder implementation - MongoDB doesn't use schemas like SQL databases
        with open(db_dir / "README.md", "w") as f:
            f.write(f"""
# MongoDB Database Setup for {self.spec.name}

This directory contains MongoDB database setup files.

## Setup Instructions

1. Use docker-compose.yml to start a MongoDB container
2. The database will be created automatically when the app runs
            """.strip())
    
    def _generate_generic_database_setup(self, db_dir: Path) -> None:
        """
        Generate generic database setup (fallback).
        
        Args:
            db_dir: Database output directory
        """
        # Create a generic README
        with open(db_dir / "README.md", "w") as f:
            f.write(f"""
# Database Setup for {self.spec.name}

This is a placeholder for database setup.

## Entities

{self._generate_entities_markdown()}

## Relationships

{self._generate_relationships_markdown()}
            """.strip())
    
    def _generate_deployment_files(self, app_dir: Path) -> None:
        """
        Generate deployment files.
        
        Args:
            app_dir: Application directory
        """
        # Create docker-compose.yml for the full stack
        with open(app_dir / "docker-compose.yml", "w") as f:
            f.write(f"""
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - db
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/{self.spec.name.lower().replace(" ", "_")}

  db:
    image: postgres:14
    restart: always
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_USER: postgres
      POSTGRES_DB: {self.spec.name.lower().replace(" ", "_")}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql

volumes:
  postgres_data:
            """.strip())
        
        # Create frontend Dockerfile
        frontend_dir = app_dir / "frontend"
        with open(frontend_dir / "Dockerfile", "w") as f:
            frontend_dockerfile = """
FROM node:16-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
            """.strip()
            
            # Adjust for Vue/Angular if needed
            if self.frontend_framework == "vue":
                frontend_dockerfile = frontend_dockerfile.replace("/app/build", "/app/dist")
            
            f.write(frontend_dockerfile)
        
        # Create nginx.conf
        with open(frontend_dir / "nginx.conf", "w") as f:
            f.write("""
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
            """.strip())
        
        # Create backend Dockerfile
        backend_dir = app_dir / "backend"
        with open(backend_dir / "Dockerfile", "w") as f:
            if self.backend_framework == "fastapi":
                f.write("""
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
                """.strip())
            elif self.backend_framework == "express":
                f.write("""
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8000
CMD ["node", "index.js"]
                """.strip())
        
        # Create GitHub workflow for CI/CD
        github_dir = app_dir / ".github" / "workflows"
        github_dir.mkdir(parents=True, exist_ok=True)
        
        with open(github_dir / "ci.yml", "w") as f:
            f.write(f"""
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Build Frontend
      run: |
        cd frontend
        npm install
        npm run build

    - name: Build Backend
      run: |
        cd backend
        {self._get_backend_build_command()}
            """.strip())
    
    def _get_backend_build_command(self) -> str:
        """
        Get the build command for the backend.
        
        Returns:
            Build command string
        """
        if self.backend_framework == "fastapi":
            return "pip install -r requirements.txt\npython -m pytest"
        elif self.backend_framework == "express":
            return "npm install\nnpm test"
        elif self.backend_framework == "laravel":
            return "composer install\nphp artisan test"
        else:
            return "echo \"No build command specified\""
    
    def _generate_documentation(self, app_dir: Path) -> None:
        """
        Generate README and documentation.
        
        Args:
            app_dir: Application directory
        """
        # Create README.md
        with open(app_dir / "README.md", "w") as f:
            f.write(f"""
# {self.spec.name}

{self.spec.description}

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)

## Overview

This application was generated using PulseForge, an AI-powered app generator.

- **Frontend**: {self.frontend_framework.capitalize()}
- **Backend**: {self.backend_framework.capitalize()}
- **Database**: {self.database.capitalize()}

## Features

{self._generate_features_documentation()}

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (for local development)
- {self._get_backend_prerequisites()}

### Installation

1. Clone the repository
2. Run the application with Docker Compose:

```bash
docker-compose up -d
```

3. Access the application at http://localhost:3000

### Local Development

#### Frontend

```bash
cd frontend
npm install
npm start
```

#### Backend

```bash
cd backend
{self._get_backend_dev_commands()}
```

## Project Structure

```
{self._generate_directory_structure()}
```

## API Documentation

{self._generate_api_documentation()}

## Deployment

This application can be deployed using Docker containers. The repository includes:

- Dockerfiles for frontend and backend
- docker-compose.yml for local deployment
- GitHub Actions workflow for CI/CD

### Deployment Options

1. **Docker Compose**: Use the included docker-compose.yml
2. **Kubernetes**: Adapt the Dockerfiles for Kubernetes deployment
3. **Cloud Platforms**: Deploy to AWS, Azure, or Google Cloud
            """.strip())
        
        # Create CONTRIBUTING.md
        with open(app_dir / "CONTRIBUTING.md", "w") as f:
            f.write(f"""
# Contributing to {self.spec.name}

Thank you for considering contributing to this project!

## Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `{self._get_test_command()}`
5. Commit your changes: `git commit -m 'Add my feature'`
6. Push to the branch: `git push origin feature/my-feature`
7. Submit a pull request

## Code Style

This project follows standard coding conventions for {self.frontend_framework} and {self.backend_framework}.

## Testing

Please include tests for your changes.

## License

By contributing, you agree that your contributions will be licensed under the project's license.
            """.strip())
        
        # Create LICENSE file
        with open(app_dir / "LICENSE", "w") as f:
            f.write("""
MIT License

Copyright (c) 2025 PulseForge

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
            """.strip())
    
    def _generate_features_documentation(self) -> str:
        """
        Generate documentation for features.
        
        Returns:
            Markdown string
        """
        if not self.spec.features:
            return "No specific features have been defined."
        
        features = []
        
        for feature in self.spec.features:
            features.append(f"- **{feature.name.capitalize()}**: {feature.description}")
        
        return "\n".join(features)
    
    def _get_backend_prerequisites(self) -> str:
        """
        Get prerequisites for the backend.
        
        Returns:
            Prerequisites string
        """
        if self.backend_framework == "fastapi":
            return "Python 3.8+ and pip"
        elif self.backend_framework == "express":
            return "Node.js and npm"
        elif self.backend_framework == "laravel":
            return "PHP 8.0+ and Composer"
        else:
            return "Backend framework prerequisites"
    
    def _get_backend_dev_commands(self) -> str:
        """
        Get development commands for the backend.
        
        Returns:
            Development commands string
        """
        if self.backend_framework == "fastapi":
            return "pip install -r requirements.txt\nuvicorn app.main:app --reload"
        elif self.backend_framework == "express":
            return "npm install\nnpm run dev"
        elif self.backend_framework == "laravel":
            return "composer install\nphp artisan serve"
        else:
            return "# Start the backend development server"
    
    def _generate_directory_structure(self) -> str:
        """
        Generate directory structure documentation.
        
        Returns:
            Directory structure string
        """
        return f"""
├── frontend/               # {self.frontend_framework.capitalize()} frontend
│   ├── src/                # Source code
│   ├── public/             # Static assets
│   └── package.json        # Dependencies
├── backend/                # {self.backend_framework.capitalize()} backend
│   ├── app/                # Application code
│   └── requirements.txt    # Dependencies
├── database/               # Database setup
│   └── schema.sql          # Database schema
├── docker-compose.yml      # Docker Compose configuration
└── README.md               # Project documentation
""".strip()
    
    def _generate_api_documentation(self) -> str:
        """
        Generate API documentation.
        
        Returns:
            API documentation string
        """
        api_docs = ["### API Endpoints\n"]
        
        for entity in self.spec.entities:
            entity_name = entity.name
            entity_name_lower = entity_name.lower()
            
            api_docs.append(f"#### {entity_name} Endpoints\n")
            api_docs.append(f"- `GET /api/{entity_name_lower}`: Get all {entity_name_lower}s")
            api_docs.append(f"- `GET /api/{entity_name_lower}/:id`: Get a specific {entity_name_lower}")
            api_docs.append(f"- `POST /api/{entity_name_lower}`: Create a new {entity_name_lower}")
            api_docs.append(f"- `PUT /api/{entity_name_lower}/:id`: Update a {entity_name_lower}")
            api_docs.append(f"- `DELETE /api/{entity_name_lower}/:id`: Delete a {entity_name_lower}\n")
        
        return "\n".join(api_docs)
    
    def _get_test_command(self) -> str:
        """
        Get test command.
        
        Returns:
            Test command string
        """
        frontend_test = "cd frontend && npm test"
        
        if self.backend_framework == "fastapi":
            backend_test = "cd backend && python -m pytest"
        elif self.backend_framework == "express":
            backend_test = "cd backend && npm test"
        elif self.backend_framework == "laravel":
            backend_test = "cd backend && php artisan test"
        else:
            backend_test = "cd backend && echo 'No tests specified'"
        
        return f"{frontend_test}\n{backend_test}"


def generate_app(spec_text: str, output_dir: str, **kwargs) -> str:
    """
    Main entry point for app generation.
    
    Args:
        spec_text: Specification text (JSON or YAML)
        output_dir: Output directory
        **kwargs: Additional options
    
    Returns:
        Path to generated application
    """
    # Parse the specification
    try:
        if spec_text.strip().startswith("{"):
            spec_dict = json.loads(spec_text)
        else:
            import yaml
            spec_dict = yaml.safe_load(spec_text)
        
        # Convert to AppSpecification object
        from core.schema import AppSpecification
        spec = AppSpecification(**spec_dict)
    except Exception as e:
        logger.error(f"Failed to parse specification: {e}")
        raise
    
    # Create the app generator
    generator = AppGenerator(
        spec=spec,
        output_dir=output_dir,
        frontend_framework=kwargs.get("frontend_framework", "react"),
        backend_framework=kwargs.get("backend_framework", "fastapi"),
        database=kwargs.get("database", "postgres")
    )
    
    # Generate the application
    return generator.generate()


# Example usage
if __name__ == "__main__":
    from core.schema import AppSpecification, Entity, Feature
    
    # Create a simple specification
    spec = AppSpecification(
        name="Task Manager",
        type="productivity",
        description="A simple task management application",
        entities=[
            Entity(
                name="Task",
                fields=[
                    {"name": "id", "type": "uuid", "primary_key": True},
                    {"name": "title", "type": "string"},
                    {"name": "description", "type": "text"},
                    {"name": "completed", "type": "boolean"},
                    {"name": "due_date", "type": "datetime"}
                ],
                description="Task to be completed"
            ),
            Entity(
                name="User",
                fields=[
                    {"name": "id", "type": "uuid", "primary_key": True},
                    {"name": "username", "type": "string", "unique": True},
                    {"name": "email", "type": "string", "unique": True},
                    {"name": "password", "type": "string"}
                ],
                description="User account",
                is_auth_related=True
            )
        ],
        relationships=[
            {
                "source": "User",
                "target": "Task",
                "type": "one_to_many",
                "description": "User owns many tasks"
            }
        ],
        features=[
            Feature(
                name="authentication",
                description="User authentication and authorization",
                required=True
            ),
            Feature(
                name="task_filtering",
                description="Filter tasks by completion status and due date",
                required=False
            )
        ]
    )
    
    # Generate the application
    output_path = generate_app(
        spec_text=json.dumps(spec.to_dict()),
        output_dir="./output",
        frontend_framework="react",
        backend_framework="fastapi",
        database="postgres"
    )
    
    print(f"Application generated at: {output_path}")