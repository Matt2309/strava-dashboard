"use client";

import React from "react";
import { Button } from "./ui/button";

interface ErrorBoundaryProps {
	children: React.ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
}

class ErrorBoundary extends React.Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(_: Error): ErrorBoundaryState {
		return { hasError: true };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("Uncaught error:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="flex flex-col items-center justify-center h-screen">
					<h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
					<p className="mb-4">We're sorry, but an unexpected error occurred.</p>
					<Button onClick={() => this.setState({ hasError: false })}>
						Try again
					</Button>
				</div>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
