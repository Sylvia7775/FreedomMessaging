import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error?.message || 'Unexpected error' };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('WeedChat caught runtime error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#12161F] text-white p-6 text-center">
          <h1 className="text-xl font-extrabold mb-2">WeedChat</h1>
          <p className="text-xs text-slate-400 mb-4 max-w-sm">
            Recovering workspace state ({this.state.errorMessage})
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, errorMessage: '' });
            }}
            className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 cursor-pointer"
          >
            Reload WeedChat
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
);
