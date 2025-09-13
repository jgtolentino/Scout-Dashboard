import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Lightbulb, 
  AlertTriangle,
  CheckCircle,
  Eye,
  Heart,
  MessageCircle,
  Palette,
  BarChart3,
  Zap
} from 'lucide-react';

interface FeatureScore {
  score: number;
  impact: number;
  importance_rank: number;
  trend?: 'up' | 'down' | 'stable';
  confidence: number;
}

interface CreativeRecommendation {
  feature: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  rationale: string;
  expected_lift: string;
  implementation_effort: 'low' | 'medium' | 'high';
  category: 'visual' | 'content' | 'emotional' | 'technical';
}

interface CreativeScorecardData {
  campaign_id: string;
  asset_id?: string;
  overall_impact_score: number;
  ces_prediction: number;
  feature_scores: Record<string, FeatureScore>;
  creative_recommendations: CreativeRecommendation[];
  expected_lift_estimates: Record<string, number>;
  priority_actions: Array<{
    feature: string;
    priority: string;
    expected_lift: number;
  }>;
  confidence_in_recommendations: number;
  generated_at: string;
  daivid_scores?: {
    visual_attention_score: number;
    emotional_impact_index: number;
    brand_power_score: number;
    message_clarity_rating: number;
    benchmark_quartile: number;
  };
}

interface CreativeScorecardProps {
  scorecardData: CreativeScorecardData;
  onActionImplemented?: (action: string, feature: string) => void;
  stakeholderRole?: 'creative' | 'strategist' | 'account_manager' | 'leadership';
}

const CreativeScorecard: React.FC<CreativeScorecardProps> = ({
  scorecardData,
  onActionImplemented,
  stakeholderRole = 'creative'
}) => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [implementedActions, setImplementedActions] = useState<Set<string>>(new Set());

  // Get priority level color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get feature category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'visual': return <Eye className=\"w-4 h-4\" />;
      case 'content': return <MessageCircle className=\"w-4 h-4\" />;
      case 'emotional': return <Heart className=\"w-4 h-4\" />;
      case 'technical': return <Zap className=\"w-4 h-4\" />;
      default: return <Target className=\"w-4 h-4\" />;
    }
  };

  // Handle action implementation
  const handleImplementAction = (action: string, feature: string) => {
    setImplementedActions(prev => new Set([...prev, `${feature}_${action}`]));
    onActionImplemented?.(action, feature);
  };

  // Filter recommendations by stakeholder role
  const getFilteredRecommendations = () => {
    const roleFilters = {
      creative: ['visual', 'content', 'emotional'],
      strategist: ['content', 'emotional', 'technical'],
      account_manager: ['technical', 'content'],
      leadership: ['technical']
    };

    const allowedCategories = roleFilters[stakeholderRole] || Object.keys(roleFilters);
    return scorecardData.creative_recommendations.filter(rec => 
      allowedCategories.includes(rec.category)
    );
  };

  const filteredRecommendations = getFilteredRecommendations();

  return (
    <div className=\"space-y-6\">
      {/* Header Summary */}
      <Card>
        <CardHeader>
          <div className=\"flex items-center justify-between\">
            <div>
              <CardTitle className=\"text-2xl font-bold\">Creative Effectiveness Scorecard</CardTitle>
              <p className=\"text-sm text-gray-600 mt-1\">
                AI-powered analysis with actionable recommendations • Generated {new Date(scorecardData.generated_at).toLocaleDateString()}
              </p>
            </div>
            <div className=\"text-right\">
              <div className=\"text-3xl font-bold text-blue-600\">
                {scorecardData.overall_impact_score.toFixed(1)}/10
              </div>
              <p className=\"text-sm text-gray-600\">Impact Score</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className=\"grid grid-cols-1 md:grid-cols-4 gap-4\">
            {/* CES Prediction */}
            <div className=\"text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg\">
              <div className=\"text-2xl font-bold text-blue-600\">
                {Math.round(scorecardData.ces_prediction)}
              </div>
              <div className=\"text-sm text-gray-600\">CES Score</div>
              <div className=\"text-xs text-gray-500 mt-1\">
                Predicted effectiveness
              </div>
            </div>

            {/* Confidence Level */}
            <div className=\"text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg\">
              <div className=\"text-2xl font-bold text-green-600\">
                {Math.round(scorecardData.confidence_in_recommendations * 100)}%
              </div>
              <div className=\"text-sm text-gray-600\">Confidence</div>
              <div className=\"text-xs text-gray-500 mt-1\">
                Recommendation reliability
              </div>
            </div>

            {/* High Priority Actions */}
            <div className=\"text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg\">
              <div className=\"text-2xl font-bold text-orange-600\">
                {scorecardData.priority_actions.filter(a => a.priority === 'high').length}
              </div>
              <div className=\"text-sm text-gray-600\">Priority Actions</div>
              <div className=\"text-xs text-gray-500 mt-1\">
                Immediate improvements
              </div>
            </div>

            {/* Expected Lift */}
            <div className=\"text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg\">
              <div className=\"text-2xl font-bold text-purple-600\">
                +{Math.round(Object.values(scorecardData.expected_lift_estimates).reduce((a, b) => a + b, 0))}%
              </div>
              <div className=\"text-sm text-gray-600\">Potential Lift</div>
              <div className=\"text-xs text-gray-500 mt-1\">
                Combined improvements
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className=\"grid w-full grid-cols-4\">
          <TabsTrigger value=\"overview\">Overview</TabsTrigger>
          <TabsTrigger value=\"features\">Feature Analysis</TabsTrigger>
          <TabsTrigger value=\"recommendations\">Recommendations</TabsTrigger>
          <TabsTrigger value=\"benchmarks\">Benchmarks</TabsTrigger>
        </TabsList>

        <TabsContent value=\"overview\" className=\"space-y-4\">
          {/* Priority Actions */}
          <Card>
            <CardHeader>
              <CardTitle className=\"flex items-center gap-2\">
                <AlertTriangle className=\"w-5 h-5 text-orange-500\" />
                Priority Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"space-y-3\">
                {scorecardData.priority_actions
                  .filter(action => action.priority === 'high')
                  .slice(0, 3)
                  .map((action, index) => (
                  <div key={index} className=\"flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg\">
                    <div className=\"flex-1\">
                      <div className=\"font-medium text-red-900\">{action.feature.replace('_', ' ').toUpperCase()}</div>
                      <div className=\"text-sm text-red-700\">
                        Expected lift: +{action.expected_lift.toFixed(1)}%
                      </div>
                    </div>
                    <Badge className={getPriorityColor(action.priority)}>
                      {action.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Wins */}
          <Card>
            <CardHeader>
              <CardTitle className=\"flex items-center gap-2\">
                <Zap className=\"w-5 h-5 text-green-500\" />
                Quick Wins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
                {filteredRecommendations
                  .filter(rec => rec.implementation_effort === 'low' && rec.priority !== 'low')
                  .slice(0, 4)
                  .map((rec, index) => (
                  <div key={index} className=\"p-3 bg-green-50 border border-green-200 rounded-lg\">
                    <div className=\"flex items-center gap-2 mb-2\">
                      {getCategoryIcon(rec.category)}
                      <span className=\"font-medium text-green-900\">{rec.feature.replace('_', ' ')}</span>
                    </div>
                    <div className=\"text-sm text-green-700 mb-2\">{rec.action}</div>
                    <div className=\"text-xs text-green-600\">{rec.expected_lift}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value=\"features\" className=\"space-y-4\">
          <Card>
            <CardHeader>
              <CardTitle>Feature Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"space-y-4\">
                {Object.entries(scorecardData.feature_scores)
                  .sort(([,a], [,b]) => b.impact - a.impact)
                  .map(([featureName, score]) => (
                  <div key={featureName} className=\"space-y-2\">
                    <div className=\"flex items-center justify-between\">
                      <div className=\"flex items-center gap-2\">
                        <span className=\"font-medium\">{featureName.replace('_', ' ').toUpperCase()}</span>
                        <Badge variant=\"outline\">Rank #{score.importance_rank}</Badge>
                      </div>
                      <div className=\"flex items-center gap-2\">
                        <span className=\"text-sm text-gray-600\">
                          Impact: {score.impact > 0 ? '+' : ''}{(score.impact * 100).toFixed(1)}%
                        </span>
                        {score.impact > 0 ? (
                          <TrendingUp className=\"w-4 h-4 text-green-500\" />
                        ) : (
                          <TrendingDown className=\"w-4 h-4 text-red-500\" />
                        )}
                      </div>
                    </div>
                    <div className=\"space-y-1\">
                      <Progress value={score.score * 10} className=\"h-2\" />
                      <div className=\"flex justify-between text-xs text-gray-500\">
                        <span>Score: {score.score.toFixed(2)}/10</span>
                        <span>Confidence: {(score.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value=\"recommendations\" className=\"space-y-4\">
          <div className=\"grid grid-cols-1 gap-4\">
            {filteredRecommendations
              .sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
              })
              .map((rec, index) => (
              <Card key={index} className=\"hover:shadow-md transition-shadow\">
                <CardContent className=\"p-6\">
                  <div className=\"flex items-start justify-between mb-4\">
                    <div className=\"flex items-center gap-3\">
                      {getCategoryIcon(rec.category)}
                      <div>
                        <h3 className=\"font-semibold text-lg\">{rec.feature.replace('_', ' ').toUpperCase()}</h3>
                        <p className=\"text-sm text-gray-600\">{rec.category} optimization</p>
                      </div>
                    </div>
                    <div className=\"flex items-center gap-2\">
                      <Badge className={getPriorityColor(rec.priority)}>
                        {rec.priority} priority
                      </Badge>
                      <Badge variant=\"outline\" className=\"text-xs\">
                        {rec.implementation_effort} effort
                      </Badge>
                    </div>
                  </div>

                  <div className=\"space-y-3\">
                    <div>
                      <h4 className=\"font-medium text-sm text-gray-700 mb-1\">RECOMMENDED ACTION</h4>
                      <p className=\"text-gray-900\">{rec.action}</p>
                    </div>

                    <div>
                      <h4 className=\"font-medium text-sm text-gray-700 mb-1\">RATIONALE</h4>
                      <p className=\"text-gray-700 text-sm\">{rec.rationale}</p>
                    </div>

                    <div className=\"flex items-center justify-between pt-3 border-t\">
                      <div className=\"text-sm\">
                        <span className=\"text-gray-600\">Expected lift: </span>
                        <span className=\"font-semibold text-green-600\">{rec.expected_lift}</span>
                      </div>
                      
                      <Button 
                        onClick={() => handleImplementAction(rec.action, rec.feature)}
                        disabled={implementedActions.has(`${rec.feature}_${rec.action}`)}
                        variant={implementedActions.has(`${rec.feature}_${rec.action}`) ? \"outline\" : \"default\"}
                        size=\"sm\"
                      >
                        {implementedActions.has(`${rec.feature}_${rec.action}`) ? (
                          <>
                            <CheckCircle className=\"w-4 h-4 mr-1\" />
                            Implemented
                          </>
                        ) : (
                          <>
                            <Lightbulb className=\"w-4 h-4 mr-1\" />
                            Implement
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value=\"benchmarks\" className=\"space-y-4\">
          {scorecardData.daivid_scores && (
            <Card>
              <CardHeader>
                <CardTitle className=\"flex items-center gap-2\">
                  <BarChart3 className=\"w-5 h-5\" />
                  DAIVID Benchmark Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className=\"grid grid-cols-2 md:grid-cols-3 gap-4\">
                  <div className=\"text-center p-4 border rounded-lg\">
                    <div className=\"text-2xl font-bold text-blue-600\">
                      {Math.round(scorecardData.daivid_scores.visual_attention_score * 100)}
                    </div>
                    <div className=\"text-sm text-gray-600\">Visual Attention</div>
                    <Progress value={scorecardData.daivid_scores.visual_attention_score * 100} className=\"mt-2 h-2\" />
                  </div>
                  
                  <div className=\"text-center p-4 border rounded-lg\">
                    <div className=\"text-2xl font-bold text-purple-600\">
                      {Math.round(scorecardData.daivid_scores.emotional_impact_index * 100)}
                    </div>
                    <div className=\"text-sm text-gray-600\">Emotional Impact</div>
                    <Progress value={scorecardData.daivid_scores.emotional_impact_index * 100} className=\"mt-2 h-2\" />
                  </div>
                  
                  <div className=\"text-center p-4 border rounded-lg\">
                    <div className=\"text-2xl font-bold text-green-600\">
                      {Math.round(scorecardData.daivid_scores.brand_power_score * 100)}
                    </div>
                    <div className=\"text-sm text-gray-600\">Brand Power</div>
                    <Progress value={scorecardData.daivid_scores.brand_power_score * 100} className=\"mt-2 h-2\" />
                  </div>
                  
                  <div className=\"text-center p-4 border rounded-lg\">
                    <div className=\"text-2xl font-bold text-orange-600\">
                      {Math.round(scorecardData.daivid_scores.message_clarity_rating * 100)}
                    </div>
                    <div className=\"text-sm text-gray-600\">Message Clarity</div>
                    <Progress value={scorecardData.daivid_scores.message_clarity_rating * 100} className=\"mt-2 h-2\" />
                  </div>
                  
                  <div className=\"text-center p-4 border rounded-lg\">
                    <div className=\"text-2xl font-bold text-indigo-600\">
                      Q{scorecardData.daivid_scores.benchmark_quartile}
                    </div>
                    <div className=\"text-sm text-gray-600\">Industry Quartile</div>
                    <div className=\"text-xs text-gray-500 mt-1\">
                      {scorecardData.daivid_scores.benchmark_quartile >= 3 ? 'Above average' : 'Below average'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Competitive Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Competitive Positioning</CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"space-y-4\">
                <div className=\"p-4 bg-blue-50 border border-blue-200 rounded-lg\">
                  <h4 className=\"font-medium text-blue-900 mb-2\">Industry Benchmarks</h4>
                  <div className=\"grid grid-cols-2 gap-4 text-sm\">
                    <div>
                      <span className=\"text-blue-700\">Average CES Score: </span>
                      <span className=\"font-semibold\">65.2</span>
                    </div>
                    <div>
                      <span className=\"text-blue-700\">Top Quartile: </span>
                      <span className=\"font-semibold\">78.5+</span>
                    </div>
                  </div>
                </div>
                
                <div className=\"p-4 bg-green-50 border border-green-200 rounded-lg\">
                  <h4 className=\"font-medium text-green-900 mb-2\">Your Performance</h4>
                  <div className=\"text-sm text-green-700\">
                    {scorecardData.ces_prediction > 78.5 ? (
                      \"🎉 Excellent! You're in the top quartile of creative effectiveness.\"
                    ) : scorecardData.ces_prediction > 65.2 ? (
                      \"👍 Good performance, above industry average with room for optimization.\"
                    ) : (
                      \"⚠️ Below average. Focus on high-priority recommendations for significant improvement.\"
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreativeScorecard;