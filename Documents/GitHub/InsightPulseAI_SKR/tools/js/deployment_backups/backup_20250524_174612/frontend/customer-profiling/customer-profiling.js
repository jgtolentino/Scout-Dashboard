// Customer Profiling Module
(function() {
    'use strict';
    
    // API Configuration
    const API_BASE_URL = '/api/customer';
    
    // State management
    let currentPage = 1;
    const pageSize = 25;
    let currentFilters = {};
    let summaryData = null;
    let profileData = null;
    
    // Initialize module
    document.addEventListener('DOMContentLoaded', function() {
        initializeEventListeners();
        loadSummaryData();
        loadCustomerProfiles();
    });
    
    // Event listeners
    function initializeEventListeners() {
        document.getElementById('apply-filters').addEventListener('click', applyFilters);
        document.getElementById('prev-page').addEventListener('click', () => changePage(-1));
        document.getElementById('next-page').addEventListener('click', () => changePage(1));
    }
    
    // Apply filters
    function applyFilters() {
        currentFilters = {
            segment: document.getElementById('segment-filter').value,
            minLifetimeValue: document.getElementById('ltv-filter').value,
            maxChurnRisk: document.getElementById('churn-filter').value,
            location: document.getElementById('location-filter').value
        };
        currentPage = 1;
        loadCustomerProfiles();
    }
    
    // Load summary data
    async function loadSummaryData() {
        try {
            const response = await fetch(`${API_BASE_URL}/profiles?summary=true`);
            const data = await response.json();
            summaryData = data;
            updateSummaryCards(data);
            renderCharts(data);
        } catch (error) {
            console.error('Failed to load summary data:', error);
        }
    }
    
    // Load customer profiles
    async function loadCustomerProfiles() {
        try {
            const params = new URLSearchParams({
                ...currentFilters,
                pageSize: pageSize,
                pageNumber: currentPage
            });
            
            const response = await fetch(`${API_BASE_URL}/profiles?${params}`);
            const data = await response.json();
            profileData = data;
            renderCustomerTable(data.customers);
            updatePagination();
        } catch (error) {
            console.error('Failed to load customer profiles:', error);
        }
    }
    
    // Update summary cards
    function updateSummaryCards(data) {
        const segments = data.segments;
        const totalCustomers = segments.reduce((sum, seg) => sum + seg.CustomerCount, 0);
        const totalValue = segments.reduce((sum, seg) => sum + (seg.AvgLifetimeValue * seg.CustomerCount), 0);
        const avgLTV = totalValue / totalCustomers;
        const atRiskCount = segments
            .filter(seg => seg.AvgChurnRisk > 0.5)
            .reduce((sum, seg) => sum + seg.CustomerCount, 0);
        const vipCount = segments
            .find(seg => seg.CustomerSegment === 'VIP')?.CustomerCount || 0;
        
        document.getElementById('total-customers').textContent = totalCustomers.toLocaleString();
        document.getElementById('avg-ltv').textContent = '₱' + avgLTV.toFixed(2).toLocaleString();
        document.getElementById('at-risk-count').textContent = atRiskCount.toLocaleString();
        document.getElementById('vip-count').textContent = vipCount.toLocaleString();
    }
    
    // Render charts
    function renderCharts(data) {
        renderSegmentDistribution(data.segments);
        renderLTVAnalysis(data.segments);
        renderChurnDistribution(data.segments);
        renderDemographicBreakdown(data.demographics);
    }
    
    // Segment distribution pie chart
    function renderSegmentDistribution(segments) {
        const data = [{
            type: 'pie',
            labels: segments.map(s => s.CustomerSegment),
            values: segments.map(s => s.CustomerCount),
            hole: 0.4,
            textinfo: 'label+percent',
            marker: {
                colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#A29BFE']
            }
        }];
        
        const layout = {
            title: '',
            showlegend: true,
            height: 400
        };
        
        Plotly.newPlot('segment-distribution-chart', data, layout);
    }
    
    // Lifetime value analysis
    function renderLTVAnalysis(segments) {
        const data = [{
            type: 'bar',
            x: segments.map(s => s.CustomerSegment),
            y: segments.map(s => s.AvgLifetimeValue),
            marker: {
                color: segments.map(s => s.AvgLifetimeValue),
                colorscale: 'Viridis'
            },
            text: segments.map(s => '₱' + s.AvgLifetimeValue.toFixed(2)),
            textposition: 'outside'
        }];
        
        const layout = {
            title: '',
            xaxis: { title: 'Customer Segment' },
            yaxis: { title: 'Average Lifetime Value (₱)' },
            height: 400
        };
        
        Plotly.newPlot('ltv-analysis-chart', data, layout);
    }
    
    // Churn risk distribution
    function renderChurnDistribution(segments) {
        const riskLevels = ['Low (< 30%)', 'Medium (30-50%)', 'High (> 50%)'];
        const riskCounts = [0, 0, 0];
        
        segments.forEach(seg => {
            if (seg.AvgChurnRisk < 0.3) riskCounts[0] += seg.CustomerCount;
            else if (seg.AvgChurnRisk < 0.5) riskCounts[1] += seg.CustomerCount;
            else riskCounts[2] += seg.CustomerCount;
        });
        
        const data = [{
            type: 'bar',
            x: riskLevels,
            y: riskCounts,
            marker: {
                color: ['#52C41A', '#FAAD14', '#F5222D']
            }
        }];
        
        const layout = {
            title: '',
            xaxis: { title: 'Churn Risk Level' },
            yaxis: { title: 'Number of Customers' },
            height: 400
        };
        
        Plotly.newPlot('churn-prediction-chart', data, layout);
    }
    
    // Demographic breakdown
    function renderDemographicBreakdown(demographics) {
        const ageGroups = [...new Set(demographics.map(d => d.InferredAgeGroup))];
        const maleData = ageGroups.map(age => 
            demographics.find(d => d.InferredAgeGroup === age && d.InferredGender === 'Male')?.CustomerCount || 0
        );
        const femaleData = ageGroups.map(age => 
            demographics.find(d => d.InferredAgeGroup === age && d.InferredGender === 'Female')?.CustomerCount || 0
        );
        
        const data = [
            {
                name: 'Male',
                type: 'bar',
                x: ageGroups,
                y: maleData,
                marker: { color: '#4ECDC4' }
            },
            {
                name: 'Female',
                type: 'bar',
                x: ageGroups,
                y: femaleData,
                marker: { color: '#FF6B6B' }
            }
        ];
        
        const layout = {
            title: '',
            barmode: 'group',
            xaxis: { title: 'Age Group' },
            yaxis: { title: 'Number of Customers' },
            height: 400
        };
        
        Plotly.newPlot('demographic-breakdown-chart', data, layout);
    }
    
    // Render customer table
    function renderCustomerTable(customers) {
        const tbody = document.getElementById('customer-tbody');
        tbody.innerHTML = '';
        
        customers.forEach(customer => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${customer.customerId}</td>
                <td><span class="segment-badge segment-${customer.segment.toLowerCase().replace(' ', '-')}">${customer.segment}</span></td>
                <td>₱${customer.value.lifetime.toFixed(2).toLocaleString()}</td>
                <td>
                    <span class="risk-badge risk-${customer.churnRisk.level.toLowerCase()}">
                        ${(customer.churnRisk.score * 100).toFixed(0)}%
                    </span>
                </td>
                <td>₱${customer.value.totalSpent.toFixed(2).toLocaleString()}</td>
                <td>${customer.value.transactions}</td>
                <td>${customer.behavior.daysSinceLastPurchase}d ago</td>
                <td>
                    <button class="btn-view" onclick="viewCustomerDetails(${customer.customerId})">View</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    // Pagination
    function updatePagination() {
        document.getElementById('page-info').textContent = `Page ${currentPage}`;
        document.getElementById('prev-page').disabled = currentPage === 1;
        document.getElementById('next-page').disabled = profileData?.customers?.length < pageSize;
    }
    
    function changePage(direction) {
        currentPage += direction;
        loadCustomerProfiles();
    }
    
    // View customer details (placeholder)
    window.viewCustomerDetails = function(customerId) {
        alert(`View details for customer ${customerId} - Feature coming soon!`);
    };
    
})();