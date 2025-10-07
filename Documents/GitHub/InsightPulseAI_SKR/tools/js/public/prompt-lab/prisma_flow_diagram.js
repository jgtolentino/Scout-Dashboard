// PRISMA Flow Diagram - Mermaid.js Implementation
// This can be imported into the Prompt Lab or any other component

export const prismaDiagram = `flowchart TB
    A[Records identified through<br>database searching (n = 483)]
    B[Records after duplicates<br>removed (n = 356)]
    C[Records screened<br>(n = 356)]
    D[Records excluded<br>(n = 302)]
    E[Full-text articles assessed<br>for eligibility (n = 54)]
    F[Full-text articles excluded<br>(n = 48):<br>• Non-randomized design (n = 16)<br>• Inappropriate intervention (n = 12)<br>• Different population/indication (n = 9)<br>• Insufficient outcome data (n = 7)<br>• Duplicated reporting (n = 4)]
    G[Studies included in<br>qualitative synthesis (n = 6)]
    H[Studies included in<br>quantitative synthesis<br>(meta-analysis) (n = 6)]

    A --> B --> C
    C --> D
    C --> E
    E --> F
    E --> G --> H
`;

// Usage example:
// 
// 1. Import in React component:
// import { prismaDiagram } from './prisma_flow_diagram';
//
// 2. Use in component:
// <div className="mermaid">{prismaDiagram}</div>
//
// 3. Make sure Mermaid is initialized in your app:
// import mermaid from 'mermaid';
// mermaid.initialize({ startOnLoad: true });