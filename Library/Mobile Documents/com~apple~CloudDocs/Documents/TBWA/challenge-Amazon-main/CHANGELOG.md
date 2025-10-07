# CHANGELOG.md - Scout Analytics Dashboard

## [Unreleased]

### Planning Phase

- Documented Scout schema retargeting strategy
- Created orchestrator contract for :bruno operations
- Defined JSON prompting specifications
- Established quality gates and success metrics

## [0.2.0] - 2024-01-XX (Scout Integration Phase)

### Added

- Complete Scout schema integration via CSVClient
- ScoutFilterComponents with regional dimensions
- SupabaseClient for edge function integration
- AI recommendations via sari-sari-expert-advanced
- Session-based filter synchronization
- Cross-page filter persistence

### Changed

- Data source from Amazon to Scout transactions
- Schema mapping for Philippine retail context
- Filter dimensions to Scout categories
- Currency display to Philippine Peso (₱)

### Technical

- Implemented DataAccessLayer abstraction
- Added Supabase Edge Function support
- Integrated React Query hooks (pending)
- Configured 60-second cache TTL

## [0.1.0] - 2024-01-01 (Original Amazon Dashboard)

### Initial Release

- Won Plotly App Challenge 2024
- Three main pages: Purchase Overview, Sentiment Analysis, Book Recommendations
- Google Gemini LLM integration
- 300MB+ dataset support
- Award-winning UI/UX design

## Schema Migration Map

### Transaction Fields

| Amazon Field      | Scout Field      | Type      | Notes               |
| ----------------- | ---------------- | --------- | ------------------- |
| Order Date        | transaction_date | timestamp | Philippine timezone |
| Purchase Total    | total_amount     | decimal   | PHP currency        |
| Category          | category         | varchar   | Retail categories   |
| Survey ResponseID | customer_id      | varchar   | Scout customer IDs  |
| Quantity          | quantity         | integer   | Item count          |
| Product Title     | product_name     | varchar   | From gold_products  |

### New Scout Fields

| Field            | Source                | Purpose              |
| ---------------- | --------------------- | -------------------- |
| region           | gold_transactions     | Geographic filtering |
| brand            | gold_brands           | Brand analysis       |
| store_name       | gold_transactions     | Store performance    |
| customer_segment | gold_personas         | Persona targeting    |
| behavior_signal  | gold_behavior_signals | AI insights          |

## Performance Benchmarks

### Current Performance

- Initial load: 2.5s
- Filter response: 400ms
- Chart render: 600ms
- AI recommendation: 1.2s

### Target Performance

- Initial load: <3s
- Filter response: <500ms
- Chart render: <800ms
- AI recommendation: <1.5s

## Breaking Changes

### API Changes

- DataClient.get_data() → client.transactions()
- Filter format changed to Scout dimensions
- Edge function endpoints updated

### UI Changes

- None (UI preserved as per contract)

### Data Changes

- Schema completely changed to Scout
- Date format: ISO 8601
- Currency: USD → PHP
- Categories: Amazon → Retail

## Migration Guide

### For Developers

1. Update environment variables:

   ```bash
   SUPABASE_URL=https://cxzllzyxwpyptfretryc.supabase.co
   SUPABASE_ANON_KEY=your_key_here
   DATA_SOURCE=supabase  # or csv for fallback
   ```

2. Update imports:

   ```python
   from utils.data_access import get_data_client
   client = get_data_client()
   ```

3. Use Scout schema:
   ```python
   df = client.transactions(
       region='NCR',
       category='Food & Beverages',
       date_gte='2024-01-01'
   )
   ```

### For Users

- No changes required
- UI remains identical
- Enhanced filtering options
- Improved AI recommendations

## Support

### Known Issues

- Edge function cold starts may cause initial delay
- Large date ranges may require pagination
- Some filters may have empty results in demo data

### Contact

- Technical: Use :bruno for sensitive operations
- Documentation: See PLANNING.md for architecture
- Tasks: See TASKS.md for implementation status
