# Hello Deer Panel - Frontend

React frontend for the Hello Deer Panel application with authentication features.

## Features

- **React 18** with TypeScript
- **Redux Toolkit** for state management
- **Redux Saga** for async operations
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API communication

## Tech Stack

- React 18
- TypeScript
- Redux Toolkit
- Redux Saga
- Tailwind CSS
- React Router DOM
- Axios

## Project Structure

```
src/
├── components/          # React components
│   ├── LoginForm.tsx   # Login form component
│   └── Dashboard.tsx   # Dashboard component
├── hooks/              # Custom React hooks
│   └── useAppSelector.ts
├── services/           # API services
│   └── api.ts
├── store/              # Redux store
│   ├── index.ts        # Store configuration
│   ├── slices/         # Redux Toolkit slices
│   │   └── authSlice.ts
│   └── sagas/          # Redux Saga
│       ├── index.ts
│       └── authSaga.ts
├── types/              # TypeScript type definitions
│   └── index.ts
└── App.tsx             # Main App component
```

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

The application will run on `http://localhost:3100`.

### Build for Production

```bash
npm run build
```

## API Configuration

The frontend communicates with the Laravel backend API at `http://127.0.0.1:8000/api`.

### API Endpoints

- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user/profile` - Get user profile

## State Management

The application uses Redux Toolkit with Redux Saga for state management:

- **Auth Slice**: Handles authentication state (user, token, loading, errors)
- **Auth Saga**: Handles async authentication operations

## Styling

The application uses Tailwind CSS for styling with custom configuration in `tailwind.config.js`.

## Development

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### Environment Variables

Create a `.env` file in the root directory:

```
PORT=3100
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
