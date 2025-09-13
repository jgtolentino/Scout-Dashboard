using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AdvisorAPI.Models;
using AdvisorAPI.Services;
using AdvisorAPI.DTOs;
using AutoMapper;
using FluentValidation;
using System.Security.Claims;
using MediatR;
using AdvisorAPI.Commands;
using AdvisorAPI.Queries;

namespace AdvisorAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AdvisorController : ControllerBase
{
    private readonly IAdvisorService _advisorService;
    private readonly IInsightGeneratorService _insightGenerator;
    private readonly IRecommendationService _recommendationService;
    private readonly IMapper _mapper;
    private readonly IMediator _mediator;
    private readonly ILogger<AdvisorController> _logger;

    public AdvisorController(
        IAdvisorService advisorService,
        IInsightGeneratorService insightGenerator,
        IRecommendationService recommendationService,
        IMapper mapper,
        IMediator mediator,
        ILogger<AdvisorController> logger)
    {
        _advisorService = advisorService;
        _insightGenerator = insightGenerator;
        _recommendationService = recommendationService;
        _mapper = mapper;
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Get AI-powered business insights based on query
    /// </summary>
    /// <param name="request">Insight generation request</param>
    /// <returns>Generated business insights</returns>
    [HttpPost("insights")]
    [ProducesResponseType(typeof(InsightResponse), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    [ProducesResponseType(typeof(ErrorResponse), 500)]
    public async Task<ActionResult<InsightResponse>> GenerateInsights([FromBody] InsightRequest request)
    {
        try
        {
            _logger.LogInformation("Generating insights for query: {Query}", request.Query);

            var command = new GenerateInsightsCommand
            {
                Query = request.Query,
                Context = request.Context,
                UserId = GetCurrentUserId(),
                Filters = request.Filters
            };

            var insights = await _mediator.Send(command);

            var response = new InsightResponse
            {
                Insights = insights.Select(_mapper.Map<InsightDto>).ToList(),
                GeneratedAt = DateTime.UtcNow,
                Query = request.Query,
                ConfidenceScore = insights.Average(i => i.ConfidenceScore)
            };

            return Ok(response);
        }
        catch (ValidationException ex)
        {
            _logger.LogWarning("Validation failed for insights request: {Errors}", string.Join(", ", ex.Errors));
            return BadRequest(new ErrorResponse { Message = "Validation failed", Details = ex.Errors.ToArray() });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating insights for query: {Query}", request.Query);
            return StatusCode(500, new ErrorResponse { Message = "An error occurred while generating insights" });
        }
    }

    /// <summary>
    /// Get AI-powered recommendations for business optimization
    /// </summary>
    /// <param name="request">Recommendation request parameters</param>
    /// <returns>Business recommendations</returns>
    [HttpPost("recommendations")]
    [ProducesResponseType(typeof(RecommendationResponse), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    public async Task<ActionResult<RecommendationResponse>> GetRecommendations([FromBody] RecommendationRequest request)
    {
        try
        {
            _logger.LogInformation("Generating recommendations for category: {Category}", request.Category);

            var command = new GenerateRecommendationsCommand
            {
                Category = request.Category,
                Context = request.Context,
                UserId = GetCurrentUserId(),
                Priority = request.Priority,
                TimeFrame = request.TimeFrame
            };

            var recommendations = await _mediator.Send(command);

            var response = new RecommendationResponse
            {
                Recommendations = recommendations.Select(_mapper.Map<RecommendationDto>).ToList(),
                Category = request.Category,
                GeneratedAt = DateTime.UtcNow,
                TotalCount = recommendations.Count
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating recommendations for category: {Category}", request.Category);
            return StatusCode(500, new ErrorResponse { Message = "An error occurred while generating recommendations" });
        }
    }

    /// <summary>
    /// Analyze data patterns and trends
    /// </summary>
    /// <param name="request">Data analysis request</param>
    /// <returns>Analysis results</returns>
    [HttpPost("analyze")]
    [ProducesResponseType(typeof(AnalysisResponse), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    public async Task<ActionResult<AnalysisResponse>> AnalyzeData([FromBody] AnalysisRequest request)
    {
        try
        {
            _logger.LogInformation("Analyzing data for metrics: {Metrics}", string.Join(", ", request.Metrics));

            var query = new AnalyzeDataQuery
            {
                Metrics = request.Metrics,
                DateRange = request.DateRange,
                Dimensions = request.Dimensions,
                Filters = request.Filters,
                UserId = GetCurrentUserId()
            };

            var analysis = await _mediator.Send(query);

            var response = new AnalysisResponse
            {
                Results = analysis.Results.Select(_mapper.Map<AnalysisResultDto>).ToList(),
                Summary = _mapper.Map<AnalysisSummaryDto>(analysis.Summary),
                Trends = analysis.Trends.Select(_mapper.Map<TrendDto>).ToList(),
                GeneratedAt = DateTime.UtcNow
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analyzing data for metrics: {Metrics}", string.Join(", ", request.Metrics));
            return StatusCode(500, new ErrorResponse { Message = "An error occurred while analyzing data" });
        }
    }

    /// <summary>
    /// Get predictive forecasts based on historical data
    /// </summary>
    /// <param name="request">Forecast request parameters</param>
    /// <returns>Predictive forecasts</returns>
    [HttpPost("forecast")]
    [ProducesResponseType(typeof(ForecastResponse), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    public async Task<ActionResult<ForecastResponse>> GetForecast([FromBody] ForecastRequest request)
    {
        try
        {
            _logger.LogInformation("Generating forecast for metric: {Metric}", request.Metric);

            var command = new GenerateForecastCommand
            {
                Metric = request.Metric,
                HistoricalPeriod = request.HistoricalPeriod,
                ForecastPeriod = request.ForecastPeriod,
                Model = request.Model,
                UserId = GetCurrentUserId()
            };

            var forecast = await _mediator.Send(command);

            var response = new ForecastResponse
            {
                Metric = request.Metric,
                Predictions = forecast.Predictions.Select(_mapper.Map<PredictionDto>).ToList(),
                ConfidenceIntervals = forecast.ConfidenceIntervals.Select(_mapper.Map<ConfidenceIntervalDto>).ToList(),
                ModelAccuracy = forecast.ModelAccuracy,
                GeneratedAt = DateTime.UtcNow
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating forecast for metric: {Metric}", request.Metric);
            return StatusCode(500, new ErrorResponse { Message = "An error occurred while generating forecast" });
        }
    }

    /// <summary>
    /// Get available metrics for analysis
    /// </summary>
    /// <returns>List of available metrics</returns>
    [HttpGet("metrics")]
    [ProducesResponseType(typeof(MetricsResponse), 200)]
    public async Task<ActionResult<MetricsResponse>> GetAvailableMetrics()
    {
        try
        {
            var query = new GetAvailableMetricsQuery { UserId = GetCurrentUserId() };
            var metrics = await _mediator.Send(query);

            var response = new MetricsResponse
            {
                Metrics = metrics.Select(_mapper.Map<MetricDto>).ToList(),
                Categories = metrics.GroupBy(m => m.Category).Select(g => g.Key).ToList()
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving available metrics");
            return StatusCode(500, new ErrorResponse { Message = "An error occurred while retrieving metrics" });
        }
    }

    /// <summary>
    /// Get advisor conversation history
    /// </summary>
    /// <param name="limit">Number of conversations to return</param>
    /// <returns>Conversation history</returns>
    [HttpGet("conversations")]
    [ProducesResponseType(typeof(ConversationHistoryResponse), 200)]
    public async Task<ActionResult<ConversationHistoryResponse>> GetConversationHistory([FromQuery] int limit = 50)
    {
        try
        {
            var query = new GetConversationHistoryQuery 
            { 
                UserId = GetCurrentUserId(),
                Limit = limit
            };

            var conversations = await _mediator.Send(query);

            var response = new ConversationHistoryResponse
            {
                Conversations = conversations.Select(_mapper.Map<ConversationDto>).ToList(),
                TotalCount = conversations.Count
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving conversation history for user: {UserId}", GetCurrentUserId());
            return StatusCode(500, new ErrorResponse { Message = "An error occurred while retrieving conversation history" });
        }
    }

    /// <summary>
    /// Save user feedback on insights or recommendations
    /// </summary>
    /// <param name="request">Feedback request</param>
    /// <returns>Success confirmation</returns>
    [HttpPost("feedback")]
    [ProducesResponseType(typeof(FeedbackResponse), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    public async Task<ActionResult<FeedbackResponse>> SubmitFeedback([FromBody] FeedbackRequest request)
    {
        try
        {
            _logger.LogInformation("Submitting feedback for item: {ItemId}", request.ItemId);

            var command = new SubmitFeedbackCommand
            {
                ItemId = request.ItemId,
                ItemType = request.ItemType,
                Rating = request.Rating,
                Comments = request.Comments,
                UserId = GetCurrentUserId()
            };

            await _mediator.Send(command);

            var response = new FeedbackResponse
            {
                Success = true,
                Message = "Feedback submitted successfully"
            };

            return Ok(response);
        }
        catch (ValidationException ex)
        {
            _logger.LogWarning("Validation failed for feedback submission: {Errors}", string.Join(", ", ex.Errors));
            return BadRequest(new ErrorResponse { Message = "Validation failed", Details = ex.Errors.ToArray() });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting feedback for item: {ItemId}", request.ItemId);
            return StatusCode(500, new ErrorResponse { Message = "An error occurred while submitting feedback" });
        }
    }

    /// <summary>
    /// Get advisor performance statistics
    /// </summary>
    /// <returns>Performance statistics</returns>
    [HttpGet("statistics")]
    [Authorize(Policy = "RequireAnalystRole")]
    [ProducesResponseType(typeof(StatisticsResponse), 200)]
    public async Task<ActionResult<StatisticsResponse>> GetStatistics()
    {
        try
        {
            var query = new GetAdvisorStatisticsQuery();
            var statistics = await _mediator.Send(query);

            var response = new StatisticsResponse
            {
                TotalQueries = statistics.TotalQueries,
                AverageResponseTime = statistics.AverageResponseTime,
                UserSatisfactionScore = statistics.UserSatisfactionScore,
                TopCategories = statistics.TopCategories.Select(_mapper.Map<CategoryStatDto>).ToList(),
                UsageByHour = statistics.UsageByHour.Select(_mapper.Map<UsageStatDto>).ToList()
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving advisor statistics");
            return StatusCode(500, new ErrorResponse { Message = "An error occurred while retrieving statistics" });
        }
    }

    private string GetCurrentUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "anonymous";
    }
}