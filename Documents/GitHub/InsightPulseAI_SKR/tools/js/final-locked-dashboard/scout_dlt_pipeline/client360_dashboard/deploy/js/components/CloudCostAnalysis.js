/**
 * Cloud Cost Analysis Component
 * Provides validated per-device cost models and blended monthly cost analysis
 */
class CloudCostAnalysis {
    constructor() {
        this.costData = this.initializeCostData();
        this.init();
    }

    init() {
        this.createAnalysisContainer();
        this.renderCostAnalysis();
        this.bindEvents();
    }

    initializeCostData() {
        return {
            // Validated Per-Device Cloud Cost Model
            perDeviceModel: {
                components: [
                    {
                        name: "Event Hubs Ingestion",
                        unitPrice: "$0.03/hr + $0.028/1M events",
                        cost20Devices: { value: 21.87, perDevice: 1.09 },
                        cost200Devices: { value: 24.29, perDevice: 0.12 },
                        basisInProduction: "16,000 CV-JSON events/device-day"
                    },
                    {
                        name: "Blob Storage – Hot Tier",
                        unitPrice: "$0.0184/GB-mo",
                        cost20Devices: { value: 0.11, perDevice: 0.006 },
                        cost200Devices: { value: 1.10, perDevice: 0.006 },
                        basisInProduction: "10 MB raw JSON/device-day"
                    },
                    {
                        name: "Databricks Stream-Processing",
                        unitPrice: "DS3v2 Premium @ $0.22/hr",
                        cost20Devices: { value: 907, perDevice: 45.35 },
                        cost200Devices: { value: 3878, perDevice: 19.39 },
                        basisInProduction: "Observed 85% of total bill",
                        note: "2-node 24×7 → 8-node 24×7"
                    },
                    {
                        name: "Nightly Batch Alternative",
                        unitPrice: "$0.22/hr",
                        cost20Devices: { value: 300, perDevice: 15.00 },
                        cost200Devices: { value: 300, perDevice: 1.50 },
                        basisInProduction: "Used when stream disabled",
                        note: "4-node, 2h"
                    },
                    {
                        name: "Relational Store (Gold Layer)",
                        unitPrice: "Azure SQL-DB GP 8 vC Gen5",
                        cost20Devices: { value: 610, perDevice: 30.50 },
                        cost200Devices: { value: 610, perDevice: 3.05 },
                        basisInProduction: "Current SKU"
                    }
                ]
            },

            // Blended Monthly Cost per Device
            blendedCosts: [
                {
                    processingMode: "Real-time Streaming",
                    dbEngine: "Azure SQL",
                    cost20Devices: 77,
                    cost200Devices: 23
                },
                {
                    processingMode: "Real-time Streaming", 
                    dbEngine: "PostgreSQL",
                    cost20Devices: 71,
                    cost200Devices: 22
                },
                {
                    processingMode: "Nightly Batch (2h)",
                    dbEngine: "Azure SQL",
                    cost20Devices: null,
                    cost200Devices: 4.7
                },
                {
                    processingMode: "Nightly Batch (2h)",
                    dbEngine: "PostgreSQL", 
                    cost20Devices: null,
                    cost200Devices: 3.9
                }
            ],

            // SQL DB → PostgreSQL Swap Analysis
            migrationAnalysis: {
                azureSQL: {
                    price: 610,
                    managedExtras: "Native",
                    migrationEffort: "—"
                },
                postgresql: {
                    price: 480,
                    managedExtras: "Partial / none",
                    migrationEffort: "≈ $15k (schema + T-SQL fixes)"
                },
                delta: {
                    savings: 130,
                    percentage: -21,
                    breakeven: "≈ 11.5 months"
                }
            },

            // Cost Optimization Recommendations
            recommendations: [
                {
                    rank: 1,
                    action: "Shift real-time workloads to 2h nightly batch",
                    impact: "up to -95% device cost",
                    priority: "high"
                },
                {
                    rank: 2,
                    action: "Enable Databricks auto-scale / auto-stop and test Spot nodes",
                    impact: "30-60% Databricks cost reduction",
                    priority: "high"
                },
                {
                    rank: 3,
                    action: "Re-evaluate SQL → PostgreSQL after Steps 1–2",
                    impact: "$130/mo savings when DB share rises",
                    priority: "medium"
                },
                {
                    rank: 4,
                    action: "Review Event Hubs TU auto-scale",
                    impact: "trim the fixed $21.6 baseline",
                    priority: "low"
                }
            ]
        };
    }

    createAnalysisContainer() {
        const existingContainer = document.getElementById('cloud-cost-analysis');
        if (existingContainer) {
            existingContainer.remove();
        }

        const container = document.createElement('div');
        container.id = 'cloud-cost-analysis';
        container.className = 'cloud-cost-analysis';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 2000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            overflow: auto;
        `;

        container.innerHTML = `
            <div class="cost-analysis-content" style="
                background: white;
                max-width: 1200px;
                margin: 2rem auto;
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                transform: translateY(30px);
                transition: transform 0.3s ease;
            ">
                <div class="cost-analysis-header" style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 2rem;
                    border-bottom: 1px solid #e1e4e8;
                    background: linear-gradient(135deg, #0067b1, #0052a3);
                    color: white;
                    border-radius: 12px 12px 0 0;
                ">
                    <div>
                        <h2 style="margin: 0 0 0.5rem 0; font-size: 1.75rem; font-weight: 600;">Cloud Cost Analysis Report</h2>
                        <p style="margin: 0; opacity: 0.9; font-size: 1rem;">Validated Per-Device Model & Optimization Recommendations</p>
                    </div>
                    <button class="close-analysis-btn" style="
                        background: none;
                        border: none;
                        color: white;
                        font-size: 1.5rem;
                        cursor: pointer;
                        padding: 0.5rem;
                        border-radius: 6px;
                        transition: background 0.2s;
                    ">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="cost-analysis-body" style="padding: 0;">
                    <div id="cost-analysis-content"></div>
                </div>
            </div>
        `;

        document.body.appendChild(container);
    }

    renderCostAnalysis() {
        const contentDiv = document.getElementById('cost-analysis-content');
        
        contentDiv.innerHTML = `
            <div style="padding: 2rem;">
                <!-- Section 1: Per-Device Cost Model -->
                <section style="margin-bottom: 3rem;">
                    <h3 style="color: #0067b1; font-size: 1.5rem; margin-bottom: 1.5rem; border-bottom: 2px solid #e1e4e8; padding-bottom: 0.5rem;">
                        <i class="fas fa-calculator" style="margin-right: 0.5rem;"></i>
                        1. Validated Per-Device Cloud Cost Model
                    </h3>
                    <div id="per-device-table"></div>
                </section>

                <!-- Section 2: Blended Monthly Costs -->
                <section style="margin-bottom: 3rem;">
                    <h3 style="color: #0067b1; font-size: 1.5rem; margin-bottom: 1.5rem; border-bottom: 2px solid #e1e4e8; padding-bottom: 0.5rem;">
                        <i class="fas fa-chart-pie" style="margin-right: 0.5rem;"></i>
                        2. Blended Monthly Cost per Device
                    </h3>
                    <div id="blended-costs-table"></div>
                    <div style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #17a2b8;">
                        <p style="margin: 0; color: #0c5460; font-weight: 500;">
                            <i class="fas fa-info-circle" style="margin-right: 0.5rem;"></i>
                            Streaming drives > 80% of spend; database choice shifts totals by ~8%
                        </p>
                    </div>
                </section>

                <!-- Section 3: Migration Analysis -->
                <section style="margin-bottom: 3rem;">
                    <h3 style="color: #0067b1; font-size: 1.5rem; margin-bottom: 1.5rem; border-bottom: 2px solid #e1e4e8; padding-bottom: 0.5rem;">
                        <i class="fas fa-exchange-alt" style="margin-right: 0.5rem;"></i>
                        3. SQL DB → PostgreSQL Swap Analysis
                    </h3>
                    <div id="migration-analysis"></div>
                </section>

                <!-- Section 4: Key Takeaways -->
                <section style="margin-bottom: 3rem;">
                    <h3 style="color: #0067b1; font-size: 1.5rem; margin-bottom: 1.5rem; border-bottom: 2px solid #e1e4e8; padding-bottom: 0.5rem;">
                        <i class="fas fa-lightbulb" style="margin-right: 0.5rem;"></i>
                        Key Takeaways
                    </h3>
                    <div id="key-takeaways"></div>
                </section>

                <!-- Section 5: Optimization Recommendations -->
                <section>
                    <h3 style="color: #0067b1; font-size: 1.5rem; margin-bottom: 1.5rem; border-bottom: 2px solid #e1e4e8; padding-bottom: 0.5rem;">
                        <i class="fas fa-rocket" style="margin-right: 0.5rem;"></i>
                        Immediate Cost-Down Actions (Ranked)
                    </h3>
                    <div id="recommendations"></div>
                </section>
            </div>
        `;

        this.renderPerDeviceTable();
        this.renderBlendedCostsTable();
        this.renderMigrationAnalysis();
        this.renderKeyTakeaways();
        this.renderRecommendations();
    }

    renderPerDeviceTable() {
        const container = document.getElementById('per-device-table');
        const { components } = this.costData.perDeviceModel;

        const tableHTML = `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 1rem; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <thead>
                        <tr style="background: linear-gradient(135deg, #f8f9fa, #e9ecef);">
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600; color: #495057;">Component</th>
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600; color: #495057;">Unit Price</th>
                            <th style="padding: 1rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600; color: #495057;">20 Devices</th>
                            <th style="padding: 1rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600; color: #495057;">200 Devices</th>
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600; color: #495057;">Basis in Production</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${components.map((comp, index) => `
                            <tr style="border-bottom: 1px solid #dee2e6; transition: background 0.2s;" 
                                onmouseover="this.style.background='#f8f9fa'" 
                                onmouseout="this.style.background='white'">
                                <td style="padding: 1rem; font-weight: 500; color: #212529;">
                                    ${comp.name}
                                    ${comp.note ? `<br><small style="color: #6c757d; font-style: italic;">${comp.note}</small>` : ''}
                                </td>
                                <td style="padding: 1rem; font-family: monospace; color: #0067b1; font-weight: 500;">${comp.unitPrice}</td>
                                <td style="padding: 1rem; text-align: center;">
                                    <div style="font-weight: 600; color: #212529;">$${comp.cost20Devices.value}/mo</div>
                                    <div style="font-size: 0.875rem; color: #6c757d;">(≈ $${comp.cost20Devices.perDevice}/device-mo)</div>
                                </td>
                                <td style="padding: 1rem; text-align: center;">
                                    <div style="font-weight: 600; color: #212529;">$${comp.cost200Devices.value}/mo</div>
                                    <div style="font-size: 0.875rem; color: #6c757d;">(≈ $${comp.cost200Devices.perDevice}/device-mo)</div>
                                </td>
                                <td style="padding: 1rem; color: #495057; font-size: 0.9rem;">${comp.basisInProduction}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = tableHTML;
    }

    renderBlendedCostsTable() {
        const container = document.getElementById('blended-costs-table');
        const { blendedCosts } = this.costData;

        const tableHTML = `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 1rem; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <thead>
                        <tr style="background: linear-gradient(135deg, #f8f9fa, #e9ecef);">
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600; color: #495057;">Processing Mode</th>
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600; color: #495057;">DB Engine</th>
                            <th style="padding: 1rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600; color: #495057;">20 Devices</th>
                            <th style="padding: 1rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600; color: #495057;">200 Devices</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${blendedCosts.map((cost, index) => `
                            <tr style="border-bottom: 1px solid #dee2e6; transition: background 0.2s;" 
                                onmouseover="this.style.background='#f8f9fa'" 
                                onmouseout="this.style.background='white'">
                                <td style="padding: 1rem; font-weight: 500; color: #212529;">${cost.processingMode}</td>
                                <td style="padding: 1rem; color: #495057;">
                                    <span style="padding: 0.25rem 0.5rem; background: ${cost.dbEngine === 'Azure SQL' ? '#0067b1' : '#28a745'}; color: white; border-radius: 4px; font-size: 0.875rem;">
                                        ${cost.dbEngine}
                                    </span>
                                </td>
                                <td style="padding: 1rem; text-align: center; font-weight: 600; color: #212529;">
                                    ${cost.cost20Devices ? `$${cost.cost20Devices}/device-mo` : '—'}
                                </td>
                                <td style="padding: 1rem; text-align: center; font-weight: 600; color: #212529;">
                                    $${cost.cost200Devices}/device-mo
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = tableHTML;
    }

    renderMigrationAnalysis() {
        const container = document.getElementById('migration-analysis');
        const { migrationAnalysis } = this.costData;

        const analysisHTML = `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 1rem; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <thead>
                        <tr style="background: linear-gradient(135deg, #f8f9fa, #e9ecef);">
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600; color: #495057;">Metric</th>
                            <th style="padding: 1rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600; color: #495057;">Azure SQL DB (8 vC)</th>
                            <th style="padding: 1rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600; color: #495057;">PostgreSQL Flex (8 vC)</th>
                            <th style="padding: 1rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600; color: #495057;">Delta</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid #dee2e6;">
                            <td style="padding: 1rem; font-weight: 500; color: #212529;">Pay-as-you-go Price</td>
                            <td style="padding: 1rem; text-align: center; font-weight: 600; color: #212529;">$${migrationAnalysis.azureSQL.price}/mo</td>
                            <td style="padding: 1rem; text-align: center; font-weight: 600; color: #212529;">$${migrationAnalysis.postgresql.price}/mo</td>
                            <td style="padding: 1rem; text-align: center;">
                                <span style="color: #28a745; font-weight: 600;">– $${migrationAnalysis.delta.savings}/mo</span>
                                <br>
                                <span style="color: #28a745; font-size: 0.875rem;">(${migrationAnalysis.delta.percentage}%)</span>
                            </td>
                        </tr>
                        <tr style="border-bottom: 1px solid #dee2e6;">
                            <td style="padding: 1rem; font-weight: 500; color: #212529;">Managed Extras</td>
                            <td style="padding: 1rem; text-align: center; color: #495057;">${migrationAnalysis.azureSQL.managedExtras}</td>
                            <td style="padding: 1rem; text-align: center; color: #495057;">${migrationAnalysis.postgresql.managedExtras}</td>
                            <td style="padding: 1rem; text-align: center; color: #dc3545; font-weight: 500;">Tooling Gap</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #dee2e6;">
                            <td style="padding: 1rem; font-weight: 500; color: #212529;">One-off Migration Effort</td>
                            <td style="padding: 1rem; text-align: center; color: #495057;">${migrationAnalysis.azureSQL.migrationEffort}</td>
                            <td style="padding: 1rem; text-align: center; color: #dc3545; font-weight: 500;">${migrationAnalysis.postgresql.migrationEffort}</td>
                            <td style="padding: 1rem; text-align: center; color: #495057;">—</td>
                        </tr>
                        <tr>
                            <td style="padding: 1rem; font-weight: 500; color: #212529;">Breakeven</td>
                            <td style="padding: 1rem; text-align: center; color: #495057;">—</td>
                            <td style="padding: 1rem; text-align: center; font-weight: 600; color: #ffc107;">${migrationAnalysis.delta.breakeven}</td>
                            <td style="padding: 1rem; text-align: center; color: #495057;">—</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = analysisHTML;
    }

    renderKeyTakeaways() {
        const container = document.getElementById('key-takeaways');

        const takeawaysHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                <div style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); padding: 1.5rem; border-radius: 8px; border-left: 4px solid #2196f3;">
                    <h4 style="color: #1976d2; margin: 0 0 1rem 0; font-size: 1.125rem;">
                        <i class="fas fa-flask" style="margin-right: 0.5rem;"></i>
                        Current 20-Device Pilot
                    </h4>
                    <p style="margin: 0; color: #37474f; line-height: 1.5;">
                        SQL engine is ~13% of monthly bill. Migrating now adds risk for modest savings.
                    </p>
                </div>
                
                <div style="background: linear-gradient(135deg, #f3e5f5, #e8f5e8); padding: 1.5rem; border-radius: 8px; border-left: 4px solid #9c27b0;">
                    <h4 style="color: #7b1fa2; margin: 0 0 1rem 0; font-size: 1.125rem;">
                        <i class="fas fa-chart-line" style="margin-right: 0.5rem;"></i>
                        Scaling Considerations
                    </h4>
                    <p style="margin: 0; color: #37474f; line-height: 1.5;">
                        At fleet sizes ≥ 100 devices or data > 1 TB, the $130/mo gap compounds. Switching becomes 
                        more attractive after right-sizing Databricks, bringing breakeven below nine months.
                    </p>
                </div>
            </div>
        `;

        container.innerHTML = takeawaysHTML;
    }

    renderRecommendations() {
        const container = document.getElementById('recommendations');
        const { recommendations } = this.costData;

        const priorityColors = {
            high: '#dc3545',
            medium: '#ffc107', 
            low: '#28a745'
        };

        const recommendationsHTML = `
            <div style="display: grid; gap: 1rem;">
                ${recommendations.map(rec => `
                    <div style="
                        display: flex; 
                        align-items: center; 
                        padding: 1.5rem; 
                        background: white; 
                        border-radius: 8px; 
                        border-left: 4px solid ${priorityColors[rec.priority]};
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                        transition: transform 0.2s, box-shadow 0.2s;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 16px rgba(0,0,0,0.15)'" 
                       onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'">
                        <div style="
                            min-width: 3rem; 
                            height: 3rem; 
                            background: ${priorityColors[rec.priority]}; 
                            color: white; 
                            border-radius: 50%; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center; 
                            font-weight: 700; 
                            font-size: 1.25rem;
                            margin-right: 1.5rem;
                        ">
                            ${rec.rank}
                        </div>
                        <div style="flex: 1;">
                            <h4 style="margin: 0 0 0.5rem 0; color: #212529; font-size: 1.125rem; font-weight: 600;">
                                ${rec.action}
                            </h4>
                            <p style="margin: 0; color: #6c757d; font-size: 0.95rem;">
                                <strong style="color: #28a745;">Impact:</strong> ${rec.impact}
                            </p>
                        </div>
                        <div style="text-align: right;">
                            <span style="
                                padding: 0.25rem 0.75rem; 
                                background: ${priorityColors[rec.priority]}15; 
                                color: ${priorityColors[rec.priority]}; 
                                border-radius: 20px; 
                                font-size: 0.875rem; 
                                font-weight: 600;
                                text-transform: uppercase;
                            ">
                                ${rec.priority}
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        container.innerHTML = recommendationsHTML;
    }

    bindEvents() {
        const closeBtn = document.querySelector('.close-analysis-btn');
        const overlay = document.getElementById('cloud-cost-analysis');

        closeBtn.addEventListener('click', () => this.close());
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.close();
            }
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });
    }

    open() {
        const container = document.getElementById('cloud-cost-analysis');
        const content = container.querySelector('.cost-analysis-content');
        
        container.style.opacity = '1';
        container.style.visibility = 'visible';
        content.style.transform = 'translateY(0)';
        
        document.body.style.overflow = 'hidden';
    }

    close() {
        const container = document.getElementById('cloud-cost-analysis');
        const content = container.querySelector('.cost-analysis-content');
        
        container.style.opacity = '0';
        container.style.visibility = 'hidden';
        content.style.transform = 'translateY(30px)';
        
        document.body.style.overflow = '';
    }

    isOpen() {
        const container = document.getElementById('cloud-cost-analysis');
        return container && container.style.visibility === 'visible';
    }

    // Calculate cost projections for different scenarios
    calculateProjections(deviceCount, mode = 'streaming') {
        const baseComponents = this.costData.perDeviceModel.components;
        let totalCost = 0;

        baseComponents.forEach(comp => {
            if (comp.name.includes('Databricks')) {
                if (mode === 'batch') {
                    totalCost += comp.cost20Devices.value; // Fixed batch cost
                } else {
                    // Scale streaming cost
                    const scaleFactor = deviceCount / 20;
                    totalCost += comp.cost20Devices.value * scaleFactor * 0.5; // Efficiency gains
                }
            } else if (comp.name.includes('Storage') || comp.name.includes('Event Hubs')) {
                // Scale linearly with device count
                totalCost += (comp.cost20Devices.value / 20) * deviceCount;
            } else {
                // Fixed costs (SQL DB)
                totalCost += comp.cost20Devices.value;
            }
        });

        return {
            totalMonthlyCost: Math.round(totalCost),
            costPerDevice: Math.round((totalCost / deviceCount) * 100) / 100,
            mode: mode
        };
    }
}

// Initialize global instance
window.cloudCostAnalysis = new CloudCostAnalysis();