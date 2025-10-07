// Workflow Designer Application
class WorkflowDesigner {
    constructor() {
        this.nodes = new Map();
        this.connections = [];
        this.selectedNode = null;
        this.nodeTypes = [];
        this.workflowId = null;
        this.ws = null;
        
        this.init();
    }

    async init() {
        // Load node types
        await this.loadNodeTypes();
        
        // Setup WebSocket
        this.setupWebSocket();
        
        // Setup event handlers
        this.setupEventHandlers();
        
        // Setup drag and drop
        this.setupDragAndDrop();
        
        // Load example workflow
        await this.loadWorkflows();
    }

    async loadNodeTypes() {
        const response = await fetch('/api/nodes');
        this.nodeTypes = await response.json();
        
        // Group nodes by category
        const categories = {
            'Core': ['start', 'transform', 'if', 'loop'],
            'Integration': ['http-request', 'claude-mcp', 'webhook'],
            'Triggers': ['schedule', 'webhook']
        };
        
        const palette = document.getElementById('nodePalette');
        palette.innerHTML = '';
        
        Object.entries(categories).forEach(([category, types]) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'node-category';
            categoryDiv.innerHTML = `<h3>${category}</h3>`;
            
            types.forEach(type => {
                const nodeType = this.nodeTypes.find(n => n.type === type);
                if (nodeType) {
                    const nodeEl = document.createElement('div');
                    nodeEl.className = 'draggable-node';
                    nodeEl.draggable = true;
                    nodeEl.dataset.nodeType = type;
                    nodeEl.innerHTML = `
                        <div class="node-name">${nodeType.name}</div>
                        <div class="node-desc">${nodeType.description}</div>
                    `;
                    categoryDiv.appendChild(nodeEl);
                }
            });
            
            palette.appendChild(categoryDiv);
        });
    }

    setupWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        this.ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'execution:started':
                this.showExecutionPanel();
                this.addExecutionLog('info', `Execution started: ${data.execution.id}`);
                break;
                
            case 'execution:completed':
                this.addExecutionLog('success', 'Execution completed successfully');
                console.log('Results:', data.execution.results);
                break;
                
            case 'execution:failed':
                this.addExecutionLog('error', `Execution failed: ${data.execution.error}`);
                break;
        }
    }

    setupEventHandlers() {
        // Toolbar buttons
        document.getElementById('newWorkflow').onclick = () => this.newWorkflow();
        document.getElementById('saveWorkflow').onclick = () => this.saveWorkflow();
        document.getElementById('executeWorkflow').onclick = () => this.executeWorkflow();
        document.getElementById('showExecutions').onclick = () => this.showExecutions();
        document.getElementById('closeExecution').onclick = () => this.hideExecutionPanel();
        
        // Canvas click
        document.getElementById('canvas').onclick = (e) => {
            if (e.target.id === 'canvas') {
                this.selectNode(null);
            }
        };
    }

    setupDragAndDrop() {
        const canvas = document.getElementById('canvas');
        
        // Drag from palette
        document.querySelectorAll('.draggable-node').forEach(node => {
            node.ondragstart = (e) => {
                e.dataTransfer.setData('nodeType', node.dataset.nodeType);
            };
        });
        
        // Drop on canvas
        canvas.ondragover = (e) => {
            e.preventDefault();
        };
        
        canvas.ondrop = (e) => {
            e.preventDefault();
            const nodeType = e.dataTransfer.getData('nodeType');
            if (nodeType) {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left + canvas.scrollLeft;
                const y = e.clientY - rect.top + canvas.scrollTop;
                this.addNode(nodeType, x, y);
            }
        };
    }

    addNode(type, x, y) {
        const nodeType = this.nodeTypes.find(n => n.type === type);
        if (!nodeType) return;
        
        const node = {
            id: `node_${Date.now()}`,
            type: type,
            position: { x, y },
            parameters: {}
        };
        
        this.nodes.set(node.id, node);
        
        // Create DOM element
        const nodeEl = document.createElement('div');
        nodeEl.className = 'workflow-node';
        nodeEl.id = node.id;
        nodeEl.style.left = `${x}px`;
        nodeEl.style.top = `${y}px`;
        nodeEl.innerHTML = `
            <div class="node-header">
                <div class="node-icon"></div>
                ${nodeType.name}
            </div>
            <div class="node-ports">
                ${nodeType.inputs.length > 0 ? '<div class="port input"></div>' : ''}
                ${nodeType.outputs.length > 0 ? '<div class="port output"></div>' : ''}
            </div>
        `;
        
        document.getElementById('canvas').appendChild(nodeEl);
        
        // Make draggable
        this.makeDraggable(nodeEl);
        
        // Select on click
        nodeEl.onclick = (e) => {
            e.stopPropagation();
            this.selectNode(node.id);
        };
        
        // Port connections
        nodeEl.querySelectorAll('.port').forEach(port => {
            port.onclick = (e) => {
                e.stopPropagation();
                this.handlePortClick(node.id, port.classList.contains('output') ? 'output' : 'input');
            };
        });
    }

    makeDraggable(element) {
        let isDragging = false;
        let startX, startY, offsetX, offsetY;
        
        element.onmousedown = (e) => {
            if (e.target.classList.contains('port')) return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            offsetX = element.offsetLeft;
            offsetY = element.offsetTop;
            
            document.onmousemove = (e) => {
                if (!isDragging) return;
                
                const x = offsetX + e.clientX - startX;
                const y = offsetY + e.clientY - startY;
                
                element.style.left = `${x}px`;
                element.style.top = `${y}px`;
                
                const node = this.nodes.get(element.id);
                if (node) {
                    node.position = { x, y };
                    this.updateConnections();
                }
            };
            
            document.onmouseup = () => {
                isDragging = false;
                document.onmousemove = null;
                document.onmouseup = null;
            };
        };
    }

    selectNode(nodeId) {
        // Clear previous selection
        document.querySelectorAll('.workflow-node').forEach(el => {
            el.classList.remove('selected');
        });
        
        if (nodeId) {
            document.getElementById(nodeId).classList.add('selected');
            this.selectedNode = nodeId;
            this.showNodeProperties(nodeId);
        } else {
            this.selectedNode = null;
            this.showWorkflowProperties();
        }
    }

    showNodeProperties(nodeId) {
        const node = this.nodes.get(nodeId);
        const nodeType = this.nodeTypes.find(n => n.type === node.type);
        
        const content = document.getElementById('propertiesContent');
        content.innerHTML = `
            <div class="property-group">
                <h3>Node Properties</h3>
                <div class="property">
                    <label>ID</label>
                    <input type="text" value="${node.id}" readonly>
                </div>
                <div class="property">
                    <label>Type</label>
                    <input type="text" value="${nodeType.name}" readonly>
                </div>
            </div>
            <div class="property-group">
                <h3>Parameters</h3>
                ${this.renderNodeParameters(node, nodeType)}
            </div>
        `;
    }

    renderNodeParameters(node, nodeType) {
        if (!nodeType.parameters) return '<p style="color: #666; font-size: 14px;">No parameters</p>';
        
        return Object.entries(nodeType.parameters).map(([key, param]) => {
            const value = node.parameters[key] || param.default || '';
            
            let input = '';
            if (param.type === 'string' && key.includes('code')) {
                input = `<textarea id="param_${key}" data-param="${key}">${value}</textarea>`;
            } else if (param.type === 'object') {
                input = `<textarea id="param_${key}" data-param="${key}">${JSON.stringify(value, null, 2)}</textarea>`;
            } else {
                input = `<input type="text" id="param_${key}" data-param="${key}" value="${value}">`;
            }
            
            return `
                <div class="property">
                    <label>${key} ${param.required ? '*' : ''}</label>
                    ${input}
                </div>
            `;
        }).join('');
    }

    showWorkflowProperties() {
        const content = document.getElementById('propertiesContent');
        content.innerHTML = `
            <div class="property-group">
                <h3>Workflow Properties</h3>
                <div class="property">
                    <label>Name</label>
                    <input type="text" id="workflowNameInput" value="${document.getElementById('workflowName').textContent}">
                </div>
                <div class="property">
                    <label>Description</label>
                    <textarea id="workflowDescInput" placeholder="Workflow description"></textarea>
                </div>
            </div>
        `;
        
        // Update workflow name on change
        document.getElementById('workflowNameInput').onchange = (e) => {
            document.getElementById('workflowName').textContent = e.target.value;
        };
    }

    handlePortClick(nodeId, portType) {
        // Simple connection creation (would be more complex in production)
        console.log(`Port clicked: ${nodeId} ${portType}`);
    }

    updateConnections() {
        // Redraw SVG connections
        const svg = document.getElementById('connections');
        svg.innerHTML = '';
        
        this.connections.forEach(conn => {
            const fromNode = document.getElementById(conn.from.node);
            const toNode = document.getElementById(conn.to.node);
            
            if (fromNode && toNode) {
                const fromPort = fromNode.querySelector('.port.output');
                const toPort = toNode.querySelector('.port.input');
                
                if (fromPort && toPort) {
                    const fromRect = fromPort.getBoundingClientRect();
                    const toRect = toPort.getBoundingClientRect();
                    const canvasRect = svg.getBoundingClientRect();
                    
                    const x1 = fromRect.left + fromRect.width/2 - canvasRect.left;
                    const y1 = fromRect.top + fromRect.height/2 - canvasRect.top;
                    const x2 = toRect.left + toRect.width/2 - canvasRect.left;
                    const y2 = toRect.top + toRect.height/2 - canvasRect.top;
                    
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    const midX = (x1 + x2) / 2;
                    path.setAttribute('d', `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`);
                    path.setAttribute('class', 'connection');
                    svg.appendChild(path);
                }
            }
        });
    }

    async newWorkflow() {
        this.nodes.clear();
        this.connections = [];
        this.workflowId = null;
        document.getElementById('canvas').innerHTML = '<svg id="connections"></svg>';
        document.getElementById('workflowName').textContent = 'Untitled Workflow';
        this.selectNode(null);
    }

    async saveWorkflow() {
        const name = document.getElementById('workflowName').textContent;
        const workflow = {
            name,
            nodes: Array.from(this.nodes.values()),
            connections: this.connections
        };
        
        try {
            const response = await fetch('/api/workflows', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(workflow)
            });
            
            const saved = await response.json();
            this.workflowId = saved.id;
            this.addExecutionLog('success', `Workflow saved: ${saved.id}`);
        } catch (error) {
            this.addExecutionLog('error', `Failed to save: ${error.message}`);
        }
    }

    async executeWorkflow() {
        if (!this.workflowId) {
            await this.saveWorkflow();
        }
        
        if (!this.workflowId) return;
        
        this.showExecutionPanel();
        this.clearExecutionLog();
        
        try {
            const response = await fetch(`/api/workflows/${this.workflowId}/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            
            const execution = await response.json();
            console.log('Execution:', execution);
        } catch (error) {
            this.addExecutionLog('error', `Failed to execute: ${error.message}`);
        }
    }

    async loadWorkflows() {
        const response = await fetch('/api/workflows');
        const workflows = await response.json();
        
        if (workflows.length > 0) {
            // Load first workflow
            const workflow = workflows[0];
            this.loadWorkflow(workflow);
        }
    }

    loadWorkflow(workflow) {
        this.newWorkflow();
        this.workflowId = workflow.id;
        document.getElementById('workflowName').textContent = workflow.name;
        
        // Add nodes
        workflow.nodes.forEach(node => {
            this.nodes.set(node.id, node);
            
            const nodeType = this.nodeTypes.find(n => n.type === node.type);
            const nodeEl = document.createElement('div');
            nodeEl.className = 'workflow-node';
            nodeEl.id = node.id;
            nodeEl.style.left = `${node.position.x}px`;
            nodeEl.style.top = `${node.position.y}px`;
            nodeEl.innerHTML = `
                <div class="node-header">
                    <div class="node-icon"></div>
                    ${nodeType.name}
                </div>
                <div class="node-ports">
                    ${nodeType.inputs.length > 0 ? '<div class="port input"></div>' : ''}
                    ${nodeType.outputs.length > 0 ? '<div class="port output"></div>' : ''}
                </div>
            `;
            
            document.getElementById('canvas').appendChild(nodeEl);
            this.makeDraggable(nodeEl);
            
            nodeEl.onclick = (e) => {
                e.stopPropagation();
                this.selectNode(node.id);
            };
        });
        
        // Add connections
        this.connections = workflow.connections;
        this.updateConnections();
    }

    showExecutions() {
        // Would show execution history
        console.log('Show executions');
    }

    showExecutionPanel() {
        document.getElementById('executionPanel').classList.add('open');
    }

    hideExecutionPanel() {
        document.getElementById('executionPanel').classList.remove('open');
    }

    clearExecutionLog() {
        document.getElementById('executionLog').innerHTML = '';
    }

    addExecutionLog(type, message) {
        const log = document.getElementById('executionLog');
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;
    }
}

// Initialize the designer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new WorkflowDesigner();
});