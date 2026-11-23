import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class FriendlyErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-[48px] p-12 shadow-2xl border border-slate-100 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] -rotate-12 pointer-events-none">
              <AlertTriangle size={200} />
            </div>

            <div className="w-24 h-24 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mx-auto mb-8 shadow-inner">
              <AlertTriangle size={48} />
            </div>

            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">
              Something Went Wrong
            </h1>

            <p className="text-slate-400 font-bold mb-10 leading-relaxed">
              We encountered an unexpected error while loading this page. Please refresh to try again.
            </p>

            <div className="flex flex-col gap-4">
              <button
                onClick={this.handleReset}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl hover:bg-blue-600 transition-all"
              >
                <RefreshCcw size={18} /> Reload Page
              </button>

              <Link
                to="/"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="w-full bg-slate-100 text-slate-900 py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 border border-slate-200 hover:bg-slate-200 transition-all"
              >
                <Home size={18} /> Back to Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default FriendlyErrorBoundary;
