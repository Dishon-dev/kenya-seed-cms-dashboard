# Kenya Seed CMS Dashboard

This is the Content Management System dashboard for Kenya Seed Company, built with React and TypeScript.

## Features

- Content management for website sections
- Product management
- News and updates management
- User authentication
- Data visualization and analytics
- File upload capabilities

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Access to the Kenya Seed API server

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp env.example .env
   ```

4. Update the `.env` file with your API server URL

### Development

Start the development server:

```bash
npm start
```

The dashboard will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `build` directory.

### Testing

```bash
npm test
```

## Environment Variables

- `REACT_APP_API_URL`: The URL of your API server (default: http://localhost:5001)

## Deployment

This is a React application that can be deployed to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

Make sure to set the `REACT_APP_API_URL` environment variable to point to your production API server.

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── hooks/         # Custom React hooks
├── services/      # API services
├── types/         # TypeScript type definitions
└── utils/         # Utility functions
```

## Security Note

This dashboard should only be accessible to authorized personnel. Make sure to:
- Implement proper authentication
- Use HTTPS in production
- Restrict access by IP if possible
- Regularly update dependencies

