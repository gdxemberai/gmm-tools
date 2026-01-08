# Sports Card Arbitrage Tool - Frontend

A Next.js frontend interface for analyzing eBay sports card listings to identify profitable arbitrage opportunities.

## Features

### 🎯 Core Functionality
- **Listing Analysis**: Submit eBay listing titles and prices for instant analysis
- **Real-time Results**: Get immediate feedback on whether a listing is profitable
- **Detailed Parsing**: View comprehensive card details extracted from listing titles
- **Market Valuation**: See estimated market values based on historical sales data

### 🎨 UI Components

#### Input Section
- Multi-line text area for eBay listing titles
- Number input for listing prices
- Form validation with error messages
- Loading states with animated spinner

#### Results Display
1. **Investment Analysis Card**
   - Visual verdict (Profitable/Overpriced/Fair Price)
   - Color-coded backgrounds (Green/Red/Yellow)
   - Profit/loss calculation with percentage
   - Listed price vs. estimated value comparison

2. **Market Analysis Card**
   - Estimated market value (prominent display)
   - Match tier (Exact/Fuzzy match)
   - Number of comparable sales
   - Data source indicator (Cached/Fresh)

3. **Parsed Card Details Card**
   - Player name, brand, year, variation
   - Card type, number, serial numbering
   - Grading information (company, grade, subgrades)
   - Attribute badges (Rookie, Autograph, Patch, etc.)
   - Confidence level and warnings
   - Collapsible JSON view for technical details

#### Error Handling
- Dismissible error alerts
- Network error detection
- API error messages
- Form validation feedback

## Technical Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 4.x
- **State Management**: React Hooks (useState)
- **API Client**: Native Fetch API

## Project Structure

```
frontend/
├── app/
│   ├── page.tsx          # Main analysis page component
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles and animations
├── lib/
│   └── api.ts           # API client functions
├── types/
│   └── analysis.ts      # TypeScript interfaces
└── public/              # Static assets
```

## Key Files

### [`app/page.tsx`](app/page.tsx)
Main application component with:
- Form handling and validation
- API integration
- Results rendering
- State management
- Responsive layout

### [`lib/api.ts`](lib/api.ts)
API client with:
- `analyzeListing()` - Submit analysis requests
- `checkBackendHealth()` - Health check endpoint
- Custom error handling
- TypeScript type safety

### [`types/analysis.ts`](types/analysis.ts)
TypeScript interfaces matching backend models:
- `ParsedCardData` - Card details structure
- `AnalyzeRequest` - API request format
- `AnalyzeResponse` - API response format
- `ApiError` - Error response format

### [`app/globals.css`](app/globals.css)
Custom styles including:
- Smooth transitions and animations
- Loading spinner keyframes
- Fade-in effects
- Responsive design utilities
- Accessibility focus styles

## Responsive Design

The interface is fully responsive with breakpoints:
- **Mobile** (< 640px): Single column layout, adjusted font sizes
- **Tablet** (640px - 1024px): Optimized spacing and grid layouts
- **Desktop** (> 1024px): Full multi-column layout with max-width container

## Accessibility Features

- Semantic HTML elements
- ARIA labels on form inputs and buttons
- Keyboard navigation support
- Focus visible indicators
- Screen reader friendly error messages
- Proper heading hierarchy
- Color contrast compliance

## Environment Variables

Create a `.env.local` file (optional):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

If not set, defaults to `http://localhost:8000`.

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The application will be available at `http://localhost:3000`.

## API Integration

The frontend expects the backend API to be running at `http://localhost:8000` with the following endpoint:

### POST `/analyze`

**Request:**
```json
{
  "title": "2023 Panini Prizm Victor Wembanyama Silver Prizm PSA 10",
  "listing_price": 1500.00
}
```

**Response:**
```json
{
  "parsed_data": { /* ParsedCardData object */ },
  "estimated_value": 1800.00,
  "profit_loss": 300.00,
  "verdict": "GOOD DEAL",
  "match_tier": "exact_match",
  "sales_count": 15,
  "cached": false
}
```

## Color Scheme

- **Primary**: Indigo (#4F46E5) - Buttons and accents
- **Success**: Green (#10B981) - Profitable deals
- **Danger**: Red (#EF4444) - Overpriced listings
- **Warning**: Yellow (#F59E0B) - Fair price listings
- **Neutral**: Gray shades - Backgrounds and text

## User Flow

1. User enters eBay listing title and price
2. Click "Analyze Listing" button
3. Loading state displays with spinner
4. Results appear in three cards:
   - Investment verdict (top priority)
   - Market analysis details
   - Parsed card information
5. User can view JSON details or analyze another listing

## Error States

- **Empty Title**: "Please enter a listing title"
- **Invalid Price**: "Please enter a valid listing price"
- **Network Error**: "Network error - unable to connect to backend"
- **API Error**: Displays specific error message from backend
- **Validation Error**: Shows field-specific validation messages

## Performance Optimizations

- Client-side rendering for instant interactivity
- Minimal re-renders with proper state management
- Optimized Tailwind CSS (purged unused styles)
- Lazy loading of results (only render when available)
- Efficient form validation

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

Potential improvements:
- Analysis history tracking
- Comparison mode (multiple listings)
- Export results to PDF/CSV
- Dark mode toggle
- Advanced filtering options
- Batch analysis support
- Price alerts and notifications
