import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    handleGoBack = () => {
        window.history.back();
    };

    handleReload = () => {
        window.location.reload();
    };

    handleHome = () => {
        window.location.href = '/dashboard';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 text-center border border-gray-100">
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center animate-pulse">
                                <AlertTriangle className="w-10 h-10 text-red-500" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong.</h1>
                        <p className="text-gray-500 mb-6 text-sm">
                            We encountered an unexpected error. Our team has been notified.
                        </p>

                        <div className="bg-red-50 rounded-lg p-4 mb-8 text-left overflow-hidden">
                            <p className="text-xs text-red-800 font-mono break-all">
                                {this.state.error && this.state.error.toString()}
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button onClick={this.handleReload} className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
                                <RefreshCw size={16} /> Try Again
                            </Button>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={this.handleGoBack} className="flex-1 gap-2">
                                    Go Back
                                </Button>
                                <Button variant="outline" onClick={this.handleHome} className="flex-1 gap-2">
                                    <Home size={16} /> Home
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-gray-400 text-xs">
                        OBE360 &copy; {new Date().getFullYear()} All rights reserved.
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
