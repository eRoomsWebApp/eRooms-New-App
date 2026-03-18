
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class FriendlyErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

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
              We encountered an unexpected error while loading this page. Our team has been notified.
            </p>
            
            <div className="flex flex-col gap-4">
              <button
                onClick={this.handleReset}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl hover:bg-indigo-600 transition-all"
              >
                <RefreshCcw size={18} /> Reload Page
              </button>
              
              <Link
                to="/"
                onClick={() => this.setState({ hasError: false })}
                className="w-full bg-slate-100 text-slate-900 py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 border border-slate-200 hover:bg-slate-200 transition-all"
              >
                <Home size={18} /> Back to Home
              </Link>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-10 p-4 bg-slate-50 rounded-xl text-left overflow-auto max-h-40 border border-slate-100">
                <p className="text-[10px] font-mono text-rose-600 break-all">
                  {this.state.error?.toString()}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default FriendlyErrorBoundary;
